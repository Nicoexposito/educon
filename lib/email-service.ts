"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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

    const supabase = createAdminClient();
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
    const logoUrl = getEmailLogoUrl();
    const escapedSubject = escapeHtml(subject);
    const escapedBody = escapeHtml(body).replaceAll("\n", "<br />");

    return `
        <!doctype html>
        <html lang="ca">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${escapedSubject}</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f7fb;color:#15223a;font-family:Arial,Helvetica,sans-serif;">
            <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
                ${escapedBody}
            </span>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;margin:0;padding:32px 16px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e3e8f2;box-shadow:0 18px 45px rgba(21,34,58,0.10);">
                            <tr>
                                <td style="background:#10294b;padding:28px 32px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="vertical-align:middle;">
                                                <img src="${logoUrl}" width="72" height="72" alt="Educon" style="display:block;width:72px;height:72px;object-fit:contain;background:#ffffff;border-radius:18px;padding:6px;" />
                                            </td>
                                            <td align="right" style="vertical-align:middle;">
                                                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9dd7ff;font-weight:700;">Educon</div>
                                                <div style="font-size:13px;color:#d8e7f8;margin-top:4px;">Notificació acadèmica</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:34px 32px 12px;">
                                    <h1 style="font-size:26px;line-height:1.2;margin:0;color:#10294b;font-weight:800;">${escapedSubject}</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 32px 30px;">
                                    <div style="font-size:16px;line-height:1.7;color:#334155;margin:0;">${escapedBody}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 32px 34px;">
                                    <a href="${getAppUrl()}/dashboard" style="display:inline-block;background:#f47b20;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;padding:13px 18px;">
                                        Obrir Educon
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#f8fafc;border-top:1px solid #e3e8f2;padding:20px 32px;">
                                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                                        Has rebut aquest correu perquè tens les notificacions d'Educon activades. Pots canviar-ho des del teu perfil.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

function getAppUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "https://educon.cat";
}

function getEmailLogoUrl() {
    if (process.env.EMAIL_LOGO_URL) return process.env.EMAIL_LOGO_URL;
    return `${getAppUrl()}/logo-transparent.png`;
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
