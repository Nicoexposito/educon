"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    Award,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    ExternalLink,
    MessageSquareText,
    Send,
    X,
} from "lucide-react";

export type StudentGradeDetail = {
    id: string;
    kind: "submission" | "manual";
    subject: string;
    title: string;
    score: number;
    max: number;
    feedback: string;
    date: string | null;
    submittedAt: string | null;
    dueDate: string | null;
    assignmentId: string | null;
    submissionId: string | null;
    submissionStatus: string | null;
    submittedFileUrl: string;
    submittedComment: string;
    assignmentFileUrl: string;
    weight?: number | null;
};

export function GradesClient({ grades }: { grades: StudentGradeDetail[] }) {
    const [selectedGrade, setSelectedGrade] = useState<StudentGradeDetail | null>(grades[0] || null);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

    const average = useMemo(() => {
        if (grades.length === 0) return "—";
        return (grades.reduce((sum, grade) => sum + normalizedScore(grade), 0) / grades.length).toFixed(1);
    }, [grades]);

    const passedCount = grades.filter((grade) => normalizedScore(grade) >= 5).length;

    return (
        <main className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">
            <header className="mb-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Finestra de qualificacions
                    </p>
                    <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">Qualificacions</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Consulta cada nota amb el feedback complet del professorat, el teu lliurament i els adjunts associats.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-y border-border py-2 md:min-w-96">
                    <Stat label="Mitjana" value={average} highlight />
                    <Stat label="Notes" value={grades.length} />
                    <Stat label="Superades" value={passedCount} />
                </div>
            </header>

            {grades.length > 0 ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="hidden grid-cols-[170px_minmax(0,1fr)_130px_110px_120px] gap-4 border-b border-border bg-secondary/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground lg:grid">
                            <span>Assignatura</span>
                            <span>Elemento</span>
                            <span>Data</span>
                            <span>Nota</span>
                            <span className="text-right">Detall</span>
                        </div>

                        <div className="divide-y divide-border">
                            {grades.map((grade) => (
                                <GradeRow
                                    key={grade.id}
                                    grade={grade}
                                    active={selectedGrade?.id === grade.id}
                                    onSelect={() => {
                                        setSelectedGrade(grade);
                                        setMobileDetailOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </section>

                    <GradeDetailPanel
                        grade={selectedGrade}
                        mobileOpen={mobileDetailOpen}
                        onMobileClose={() => setMobileDetailOpen(false)}
                    />
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
                    <Award className="mx-auto mb-3 h-10 w-10 opacity-45" aria-hidden="true" />
                    <p className="font-semibold text-foreground">Encara no hi ha qualificacions publicades.</p>
                </div>
            )}
        </main>
    );
}

function GradeRow({
    grade,
    active,
    onSelect,
}: {
    grade: StudentGradeDetail;
    active: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`grid w-full gap-3 px-5 py-5 text-left transition-colors hover:bg-secondary/70 lg:grid-cols-[170px_minmax(0,1fr)_130px_110px_120px] lg:items-center ${active ? "bg-secondary/80" : "bg-card"}`}
        >
            <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{grade.subject}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {grade.kind === "submission" ? "Treball corregit" : "Nota manual"}
                </p>
            </div>

            <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{grade.title}</p>
                {grade.feedback ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{grade.feedback}</p>
                ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Sense comentari publicat.</p>
                )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span suppressHydrationWarning>{formatDate(grade.date)}</span>
            </div>

            <ScorePill grade={grade} />

            <span className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-foreground">
                Veure detall
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
        </button>
    );
}

function GradeDetailPanel({
    grade,
    mobileOpen,
    onMobileClose,
}: {
    grade: StudentGradeDetail | null;
    mobileOpen: boolean;
    onMobileClose: () => void;
}) {
    if (!grade) return null;

    return (
        <>
            <aside className="hidden xl:block">
                <GradeDetailCard grade={grade} />
            </aside>

            <div className="xl:hidden">
                {mobileOpen && (
                    <div className="fixed inset-0 z-40 bg-black/40 p-3 backdrop-blur-sm">
                        <div className="ml-auto flex h-full max-w-xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <p className="font-semibold text-foreground">Detall de la qualificació</p>
                                <button
                                    type="button"
                                    onClick={onMobileClose}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    aria-label="Tancar detall"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="min-h-0 overflow-y-auto p-4">
                                <GradeDetailCard grade={grade} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function GradeDetailCard({ grade }: { grade: StudentGradeDetail }) {
    return (
        <section className="rounded-xl border border-border bg-card shadow-xs xl:sticky xl:top-6">
            <div className="border-b border-border bg-secondary/60 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{grade.subject}</p>
                        <h2 className="mt-2 text-xl font-bold leading-tight text-foreground">{grade.title}</h2>
                    </div>
                    <ScorePill grade={grade} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <Meta label={grade.kind === "submission" ? "Entregat" : "Publicat"} value={formatDate(grade.date)} />
                    <Meta label="Tipus" value={grade.kind === "submission" ? "Treball" : "Qualificació"} />
                </div>
            </div>

            <div className="space-y-5 p-5">
                <DetailBlock icon={MessageSquareText} title="Comentari del professor">
                    {grade.feedback ? (
                        <p className="whitespace-pre-line text-sm leading-6 text-foreground">{grade.feedback}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">El professor encara no ha afegit cap comentari.</p>
                    )}
                </DetailBlock>

                {grade.kind === "submission" ? (
                    <>
                        <DetailBlock icon={Send} title="El teu lliurament">
                            <div className="space-y-3">
                                {grade.submittedFileUrl ? (
                                    <a
                                        href={grade.submittedFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                                    >
                                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                        Veure fitxer lliurat
                                    </a>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hi ha fitxer lliurat.</p>
                                )}

                                {grade.submittedComment ? (
                                    <div className="rounded-lg border border-border bg-background p-3 text-sm leading-6 text-foreground">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Comentari enviat</p>
                                        <p className="whitespace-pre-line">{grade.submittedComment}</p>
                                    </div>
                                ) : null}
                            </div>
                        </DetailBlock>

                        <DetailBlock icon={ClipboardList} title="Treball">
                            <div className="space-y-3 text-sm">
                                <Meta label="Data límit" value={formatDate(grade.dueDate)} />
                                <Meta label="Estat" value={statusLabel(grade.submissionStatus)} />
                                {grade.assignmentFileUrl && (
                                    <a
                                        href={grade.assignmentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-semibold text-foreground transition-colors hover:bg-secondary"
                                    >
                                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                        Veure material del treball
                                    </a>
                                )}
                                {grade.assignmentId && (
                                    <Link
                                        href={`/dashboard/assignments/${grade.assignmentId}`}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                                    >
                                        Obrir pàgina del treball
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                )}
                            </div>
                        </DetailBlock>
                    </>
                ) : (
                    <DetailBlock icon={CheckCircle2} title="Detalls de la nota">
                        <div className="space-y-2">
                            <Meta label="Puntuació màxima" value={String(formatNumber(grade.max))} />
                            {typeof grade.weight === "number" && Number.isFinite(grade.weight) && (
                                <Meta label="Pes" value={`${formatNumber(grade.weight)}`} />
                            )}
                        </div>
                    </DetailBlock>
                )}
            </div>
        </section>
    );
}

function DetailBlock({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof MessageSquareText;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            {children}
        </section>
    );
}

function ScorePill({ grade }: { grade: StudentGradeDetail }) {
    const score = normalizedScore(grade);
    const positive = score >= 5;

    return (
        <span className={`inline-flex w-fit min-w-20 justify-center rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${positive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"}`}>
            {formatNumber(grade.score)}/{formatNumber(grade.max)}
        </span>
    );
}

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
    return (
        <div className="px-2 text-center">
            <p className={`text-xl font-bold tabular-nums ${highlight ? "text-[var(--primary)] dark:text-[var(--accent)]" : "text-foreground"}`}>{value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
    );
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
            <p suppressHydrationWarning className="mt-1 font-semibold text-foreground">{value}</p>
        </div>
    );
}

function normalizedScore(grade: StudentGradeDetail) {
    return (grade.score / grade.max) * 10;
}

function formatNumber(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function statusLabel(status?: string | null) {
    if (status === "graded") return "Qualificat";
    if (status === "returned") return "Retornat";
    if (status === "submitted") return "Entregat";
    return status || "—";
}
