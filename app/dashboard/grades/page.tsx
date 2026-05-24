import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getGradesData } from "@/lib/data-service";
import { GradesClient, type StudentGradeDetail } from "./GradesClient";

export default async function GradesPage() {
    const session = await getSession();
    if (!session) redirect("/");
    if (session.role !== "student") redirect("/dashboard");

    const { submissions, gradeRows } = await getGradesData(session.userId as string);
    const allGrades: StudentGradeDetail[] = [
        ...submissions.map((row: any) => {
            const assignment = firstRelation(row.assignment);
            const subject = firstRelation(assignment?.subject);
            return {
                id: `submission-${row.id}`,
                kind: "submission" as const,
                subject: subject?.name || "Sense assignatura",
                title: assignment?.title || "Treball",
                score: Number(row.grade),
                max: 10,
                feedback: row.feedback || "",
                date: row.submitted_at || assignment?.due_date || null,
                submittedAt: row.submitted_at || null,
                dueDate: assignment?.due_date || null,
                assignmentId: row.assignment_id || assignment?.id || null,
                submissionId: row.id,
                submissionStatus: row.status || null,
                submittedFileUrl: getHttpUrl(row.file_url),
                submittedComment: getSubmissionComment(row),
                assignmentFileUrl: getHttpUrl(assignment?.content_url),
            };
        }),
        ...gradeRows.map((row: any) => {
            const gradeItem = firstRelation(row.grade_item);
            const subject = firstRelation(gradeItem?.subject);
            return {
                id: `grade-${row.id}`,
                kind: "manual" as const,
                subject: subject?.name || "Sense assignatura",
                title: gradeItem?.name || "Qualificació",
                score: Number(row.score),
                max: Number(gradeItem?.max_score || 10),
                feedback: row.feedback || "",
                date: row.created_at || null,
                submittedAt: null,
                dueDate: null,
                assignmentId: null,
                submissionId: null,
                submissionStatus: null,
                submittedFileUrl: "",
                submittedComment: "",
                assignmentFileUrl: "",
                weight: gradeItem?.weight ? Number(gradeItem.weight) : null,
            };
        }),
    ]
        .filter((grade) => Number.isFinite(grade.score) && Number.isFinite(grade.max) && grade.max > 0)
        .sort((a, b) => toTime(b.date) - toTime(a.date));

    return <GradesClient grades={allGrades} />;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function getSubmissionComment(row: any) {
    const explicitComment = typeof row.student_comment === "string" ? row.student_comment.trim() : "";
    if (explicitComment) return explicitComment;

    const legacyContent = typeof row.file_url === "string" ? row.file_url.trim() : "";
    if (!legacyContent || getHttpUrl(legacyContent)) return "";
    return legacyContent;
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

function toTime(value?: string | null) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}
