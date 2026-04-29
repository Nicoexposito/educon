import { processEmailQueue } from "@/lib/email-service";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return handleProcess(request);
}

export async function POST(request: NextRequest) {
    return handleProcess(request);
}

async function handleProcess(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret && process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "CRON_SECRET no configurat" }, { status: 503 });
    }

    if (cronSecret) {
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ success: false, error: "No autoritzat" }, { status: 401 });
        }
    }

    await supabase.rpc("queue_assignment_deadline_emails");
    const result = await processEmailQueue({ limit: 50 });
    const status = result.success ? 200 : 503;
    return NextResponse.json(result, { status });
}
