import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ZipFile = {
    name: string;
    bytes: Uint8Array;
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
        return NextResponse.json({ success: false, error: "No autoritzat." }, { status: 401 });
    }

    const { id: assignmentId } = await Promise.resolve(context.params);
    const body = await request.json().catch(() => ({}));
    const submissionIds: string[] = Array.isArray(body.submissionIds)
        ? body.submissionIds.filter((id: unknown): id is string => typeof id === "string")
        : [];

    if (!submissionIds.length) {
        return NextResponse.json({ success: false, error: "No has seleccionat cap lliurament." }, { status: 400 });
    }

    const service = createAdminClient();
    const { data: assignment, error: assignmentError } = await service
        .from("assignments")
        .select("id, title, teacher_id")
        .eq("id", assignmentId)
        .single();

    if (assignmentError || !assignment) {
        return NextResponse.json({ success: false, error: "Tasca no trobada." }, { status: 404 });
    }

    if (assignment.teacher_id !== session.userId) {
        return NextResponse.json({ success: false, error: "No pots descarregar lliuraments d'una tasca que no és teva." }, { status: 403 });
    }

    const { data: submissions, error: submissionsError } = await service
        .from("submissions")
        .select("id, file_url, submitted_at, student:users(full_name, email)")
        .eq("assignment_id", assignmentId)
        .in("id", submissionIds);

    if (submissionsError) {
        return NextResponse.json({ success: false, error: "No s'han pogut llegir els lliuraments." }, { status: 500 });
    }

    const submissionOrder = new Map<string, number>(submissionIds.map((id, index) => [id, index]));
    const selectedSubmissions = (submissions || [])
        .slice()
        .sort((a, b) => (submissionOrder.get(a.id) ?? 0) - (submissionOrder.get(b.id) ?? 0));

    const downloadedFiles = await mapWithConcurrency(selectedSubmissions, 4, async (submission, index): Promise<ZipFile | null> => {
        const fileUrl = getHttpUrl(submission.file_url);
        if (!fileUrl) return null;

        const downloaded = await downloadSubmissionFile(fileUrl, service);
        if (!downloaded.success) return null;

        const student = Array.isArray(submission.student) ? submission.student[0] : submission.student;
        const studentName = student?.full_name || student?.email || "alumne";
        const fileName = buildSubmissionFileName(index + 1, studentName, fileUrl, downloaded.mimeType);
        return { name: fileName, bytes: downloaded.bytes };
    });
    const files = downloadedFiles.filter((file): file is ZipFile => Boolean(file));

    if (!files.length) {
        return NextResponse.json({ success: false, error: "No s'ha pogut descarregar cap fitxer seleccionat." }, { status: 400 });
    }

    const zip = createZip(files);
    const safeTitle = sanitizeFileName(assignment.title || "tasca");

    return new Response(new Uint8Array(zip), {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${safeTitle}-lliuraments.zip"`,
            "Cache-Control": "no-store",
        },
    });
}

function getHttpUrl(value?: string | null) {
    if (!value) return "";
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";
        return url.toString();
    } catch {
        return "";
    }
}

async function downloadSubmissionFile(url: string, service: ReturnType<typeof createAdminClient>): Promise<{ success: true; bytes: Uint8Array; mimeType: string } | { success: false; error: string }> {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            return {
                success: true,
                bytes: new Uint8Array(buffer),
                mimeType: normalizeMimeType(response.headers.get("content-type") || inferMimeTypeFromUrl(url)),
            };
        }
    } catch {
        // Fall back to Supabase Storage below.
    }

    const storagePath = parseSupabaseStoragePath(url);
    if (!storagePath) {
        return { success: false, error: "URL no compatible." };
    }

    const { data, error } = await service.storage
        .from(storagePath.bucket)
        .download(storagePath.path);

    if (error || !data) {
        return { success: false, error: error?.message || "No s'ha pogut descarregar del bucket." };
    }

    const buffer = await data.arrayBuffer();
    return {
        success: true,
        bytes: new Uint8Array(buffer),
        mimeType: normalizeMimeType(data.type || inferMimeTypeFromUrl(url)),
    };
}

async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
) {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(Math.max(limit, 1), items.length);

    await Promise.all(Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }));

    return results;
}

function parseSupabaseStoragePath(url: string) {
    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split("/").filter(Boolean);
        const objectIndex = parts.findIndex((part) => part === "object");
        if (objectIndex === -1) return null;

        const visibility = parts[objectIndex + 1];
        if (visibility !== "public" && visibility !== "sign" && visibility !== "authenticated") return null;

        const bucket = parts[objectIndex + 2];
        const path = parts.slice(objectIndex + 3).map(decodeURIComponent).join("/");
        if (!bucket || !path) return null;

        return { bucket, path };
    } catch {
        return null;
    }
}

function buildSubmissionFileName(index: number, studentName: string, sourceUrl: string, mimeType: string) {
    const extension = inferExtension(sourceUrl, mimeType);
    const prefix = String(index).padStart(2, "0");
    return `${prefix}-${sanitizeFileName(studentName)}${extension}`;
}

function sanitizeFileName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "fitxer";
}

function normalizeMimeType(mimeType: string) {
    return mimeType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function inferMimeTypeFromUrl(url: string) {
    const pathname = safePathname(url);
    if (pathname.endsWith(".pdf")) return "application/pdf";
    if (pathname.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (pathname.endsWith(".doc")) return "application/msword";
    if (pathname.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (pathname.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (pathname.endsWith(".zip")) return "application/zip";
    if (pathname.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
}

function inferExtension(url: string, mimeType: string) {
    const pathname = safePathname(url);
    const match = pathname.match(/\.([a-z0-9]{1,8})$/i);
    if (match) return `.${match[1].toLowerCase()}`;

    if (mimeType === "application/pdf") return ".pdf";
    if (mimeType.includes("wordprocessingml")) return ".docx";
    if (mimeType === "application/msword") return ".doc";
    if (mimeType.includes("presentationml")) return ".pptx";
    if (mimeType.includes("spreadsheetml")) return ".xlsx";
    if (mimeType === "application/zip") return ".zip";
    if (mimeType.startsWith("text/")) return ".txt";
    return ".bin";
}

function safePathname(url: string) {
    try {
        return decodeURIComponent(new URL(url).pathname).toLowerCase();
    } catch {
        return "";
    }
}

function createZip(files: ZipFile[]) {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;
    const { dosTime, dosDate } = getDosTimestamp(new Date());

    for (const file of files) {
        const name = Buffer.from(file.name, "utf8");
        const data = Buffer.from(file.bytes);
        const crc = crc32(data);

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0x0800, 6);
        localHeader.writeUInt16LE(0, 8);
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(data.length, 18);
        localHeader.writeUInt32LE(data.length, 22);
        localHeader.writeUInt16LE(name.length, 26);
        localHeader.writeUInt16LE(0, 28);

        localParts.push(localHeader, name, data);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0x0800, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(data.length, 20);
        centralHeader.writeUInt32LE(data.length, 24);
        centralHeader.writeUInt16LE(name.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        centralParts.push(centralHeader, name);

        offset += localHeader.length + name.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const localData = Buffer.concat(localParts);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(localData.length, 16);
    end.writeUInt16LE(0, 20);

    return Buffer.concat([localData, centralDirectory, end]);
}

function getDosTimestamp(date: Date) {
    const year = Math.max(1980, date.getFullYear());
    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { dosTime, dosDate };
}

function crc32(buffer: Buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let bit = 0; bit < 8; bit++) {
        crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
});
