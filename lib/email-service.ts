"use server";

import { supabase } from "@/lib/supabase";

type ProcessEmailQueueOptions = {
    limit?: number;
};

type EmailQueueItem = {
    id: string;
    recipient_email: string;
    subject: string;
    body: string;
    html: string | null;
    attempts: number;
};

export async function processEmailQueue(options: ProcessEmailQueueOptions = {}) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "Educon <onboarding@resend.dev>";
    const limit = options.limit || 25;

    if (!resendApiKey) {
        return {
            success: false,
            sent: 0,
            failed: 0,
            error: "Cal configurar RESEND_API_KEY a l'entorn.",
        };
    }

    const { data: items, error } = await supabase
        .from("email_notifications")
        .select("id, recipient_email, subject, body, html, attempts")
        .eq("status", "pending")
        .lte("send_after", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(limit);

    if (error) {
        return { success: false, sent: 0, failed: 0, error: error.message };
    }

    let sent = 0;
    let failed = 0;

    for (const item of (items || []) as EmailQueueItem[]) {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: item.recipient_email,
                subject: item.subject,
                text: item.body,
                html: item.html || buildDefaultHtml(item.subject, item.body),
            }),
        });

        if (response.ok) {
            sent += 1;
            await supabase
                .from("email_notifications")
                .update({
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    attempts: item.attempts + 1,
                    last_error: null,
                })
                .eq("id", item.id);
        } else {
            failed += 1;
            const errorText = await response.text();
            const isPermanentFailure = response.status === 400 || response.status === 401 || response.status === 403;
            await supabase
                .from("email_notifications")
                .update({
                    status: isPermanentFailure || item.attempts + 1 >= 5 ? "failed" : "pending",
                    attempts: item.attempts + 1,
                    last_error: errorText.slice(0, 1000),
                })
                .eq("id", item.id);
        }
    }

    return { success: true, sent, failed };
}

function buildDefaultHtml(subject: string, body: string) {
    return `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b">
            <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(subject)}</h1>
            <p style="font-size:14px;margin:0 0 18px">${escapeHtml(body)}</p>
            <p style="font-size:12px;color:#71717a;margin:0">Educon</p>
        </div>
    `;
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
