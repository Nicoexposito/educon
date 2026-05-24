"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CalendarDays,
    Check,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    Megaphone,
    Paperclip,
    Pin,
    Search,
    Trash2,
    Upload,
    Users,
    Video,
} from "lucide-react";
import { createSuroItem, deleteSuroItem } from "@/lib/actions";

type Person = { full_name?: string | null; email?: string | null };
type Relation<T> = T | T[] | null | undefined;

type SuroSubject = {
    id: string;
    name?: string | null;
    category?: string | null;
    color?: string | null;
    schedule?: string | null;
    student_count?: number | null;
    students_count?: number | null;
    course?: { name?: string | null; code?: string | null } | null;
    teacher?: Relation<Person>;
};

type SuroItem = {
    id: string;
    subject_id: string;
    teacher_id: string;
    item_type: "note" | "pdf" | "book" | "image" | "video" | "link" | "event";
    title: string;
    description?: string | null;
    attachment_url?: string | null;
    event_start?: string | null;
    event_end?: string | null;
    created_at: string;
    subject?: Relation<SuroSubject>;
    teacher?: Relation<Person>;
};

type SuroData = {
    subjects: SuroSubject[];
    items: SuroItem[];
    stats: {
        subjects: number;
        items: number;
        attachments: number;
        events: number;
    };
};

type FilterType = "all" | SuroItem["item_type"];

const TYPE_OPTIONS: { value: SuroItem["item_type"]; label: string }[] = [
    { value: "note", label: "Nota" },
    { value: "pdf", label: "PDF" },
    { value: "book", label: "Llibre" },
    { value: "image", label: "Foto" },
    { value: "video", label: "Vídeo" },
    { value: "link", label: "Enllaç" },
    { value: "event", label: "Event" },
];

const FILTERS: { value: FilterType; label: string }[] = [
    { value: "all", label: "Tot" },
    ...TYPE_OPTIONS,
];

export function SuroClient({ data, role }: { data: SuroData; role: "teacher" | "student" }) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState<SuroItem["item_type"]>("note");
    const [fileName, setFileName] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isSaving, startSaving] = useTransition();
    const [isDeleting, startDeleting] = useTransition();

    const items = useMemo(() => {
        return [...data.items].sort((a, b) => cardTime(b) - cardTime(a));
    }, [data.items]);

    const countsBySubject = useMemo(() => {
        return items.reduce((map, item) => {
            map.set(item.subject_id, (map.get(item.subject_id) || 0) + 1);
            return map;
        }, new Map<string, number>());
    }, [items]);

    const selectedSubject = useMemo(() => {
        if (!selectedSubjectId) return null;
        return data.subjects.find((subject) => subject.id === selectedSubjectId) || null;
    }, [data.subjects, selectedSubjectId]);

    const subjectItems = useMemo(() => {
        if (!selectedSubjectId) return [];
        return items.filter((item) => item.subject_id === selectedSubjectId);
    }, [items, selectedSubjectId]);

    const filteredItems = useMemo(() => {
        const query = normalize(search);
        return subjectItems.filter((item) => {
            const subject = firstRelation(item.subject) || selectedSubject;
            const teacher = firstRelation(item.teacher) || firstRelation(subject?.teacher);
            const matchesType = typeFilter === "all" || item.item_type === typeFilter;
            const matchesSearch = !query || normalize([
                item.title,
                item.description,
                subject?.name,
                teacher?.full_name,
                teacher?.email,
            ].filter(Boolean).join(" ")).includes(query);

            return matchesType && matchesSearch;
        });
    }, [search, selectedSubject, subjectItems, typeFilter]);

    const openSubject = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        setTypeFilter("all");
        setSearch("");
        setMessage(null);
    };

    const closeSubject = () => {
        setSelectedSubjectId(null);
        setTypeFilter("all");
        setSearch("");
        setMessage(null);
    };

    const handleCreate = (formData: FormData) => {
        if (!selectedSubjectId) return;
        formData.set("subject_id", selectedSubjectId);
        setMessage(null);
        startSaving(async () => {
            const result = await createSuroItem(formData);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Publicació penjada al suro." : result.error || "No s'ha pogut publicar.",
            });
            if (result.success) {
                formRef.current?.reset();
                setSelectedType("note");
                setFileName("");
                router.refresh();
            }
        });
    };

    const handleDelete = (itemId: string) => {
        setMessage(null);
        startDeleting(async () => {
            const result = await deleteSuroItem(itemId);
            setMessage({
                type: result.success ? "success" : "error",
                text: result.success ? "Publicació eliminada." : result.error || "No s'ha pogut eliminar.",
            });
            if (result.success) router.refresh();
        });
    };

    return (
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">
            <header className="mb-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Suro de les assignatures
                    </p>
                    <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                        {selectedSubject ? selectedSubject.name || "Suro" : "Tria una assignatura"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {selectedSubject
                            ? "Aquest és el suro propi de l'assignatura: avisos, apunts, fitxers i materials en un únic tauler."
                            : "Primer escull una assignatura. Després veuràs només el suro d'aquella classe, sense barrejar-lo amb la resta."}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-y border-border py-2 md:min-w-80">
                    <Stat label="Assignatures" value={data.stats.subjects} />
                    <Stat label="Publicacions" value={data.stats.items} />
                    <Stat label="Adjunts" value={data.stats.attachments} />
                </div>
            </header>

            {message && (
                <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>
                    {message.text}
                </div>
            )}

            {!selectedSubject ? (
                <SubjectPicker
                    subjects={data.subjects}
                    countsBySubject={countsBySubject}
                    role={role}
                    onOpenSubject={openSubject}
                />
            ) : (
                <section className="space-y-5">
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={closeSubject}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-secondary"
                                aria-label="Canviar assignatura"
                            >
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{selectedSubject.name || "Assignatura"}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {subjectMeta(selectedSubject, role)} · {subjectItems.length} publicacions
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={closeSubject}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                        >
                            Canviar assignatura
                        </button>
                    </div>

                    {role === "teacher" && (
                        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                            <div className="flex items-center gap-3 border-b border-border bg-secondary/70 px-5 py-4">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-primary-foreground">
                                    <Pin className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="font-semibold text-foreground">Penjar al suro</h2>
                                    <p className="text-sm text-muted-foreground">La publicació quedarà dins de {selectedSubject.name || "aquesta assignatura"}.</p>
                                </div>
                            </div>

                            <form ref={formRef} action={handleCreate} className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-[160px_minmax(0,1fr)_auto]">
                                <input type="hidden" name="subject_id" value={selectedSubject.id} />
                                <select
                                    name="item_type"
                                    value={selectedType}
                                    onChange={(event) => setSelectedType(event.target.value as SuroItem["item_type"])}
                                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                                >
                                    {TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <input name="title" required placeholder="Títol" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                                <button disabled={isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Penjar
                                </button>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-3">
                                    <label className="flex h-11 min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary focus-within:border-ring">
                                        <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        <span className="truncate">{fileName || "Pujar fitxer al bucket"}</span>
                                        <input
                                            name="file"
                                            type="file"
                                            className="sr-only"
                                            onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name || "")}
                                        />
                                    </label>
                                    <input name="attachment_url" placeholder="O enganxa una URL del fitxer, imatge o enllaç" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
                                </div>
                                <textarea name="description" placeholder="Text que quedarà penjat al suro" rows={3} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring lg:col-span-3" />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-3">
                                    <input name="event_start" type="datetime-local" disabled={selectedType !== "event"} className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:opacity-40 focus:border-ring" />
                                    <input name="event_end" type="datetime-local" disabled={selectedType !== "event"} className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:opacity-40 focus:border-ring" />
                                </div>
                            </form>
                        </section>
                    )}

                    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="grid gap-3 border-b border-border bg-secondary/60 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <label className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground focus-within:border-ring">
                                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar dins d'aquest suro"
                                    className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70"
                                />
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {FILTERS.map((filter) => (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        onClick={() => setTypeFilter(filter.value)}
                                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${typeFilter === filter.value ? "bg-[var(--primary)] text-primary-foreground" : "bg-background text-foreground ring-1 ring-border hover:bg-accent/20"}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div
                            className="min-h-[32rem] bg-[#fbfaf6] p-4 dark:bg-zinc-950 sm:p-6"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 1px 1px, rgba(15,27,45,.08) 1px, transparent 0)",
                                backgroundSize: "22px 22px",
                            }}
                        >
                            {filteredItems.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {filteredItems.map((item, index) => (
                                        <SuroNote
                                            key={item.id}
                                            item={item}
                                            subject={selectedSubject}
                                            index={index}
                                            role={role}
                                            isDeleting={isDeleting}
                                            onDelete={() => handleDelete(item.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex min-h-[24rem] items-center justify-center">
                                    <div className="max-w-sm rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground shadow-xs">
                                        <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-45" aria-hidden="true" />
                                        <p className="font-semibold text-foreground">No hi ha res penjat en aquest suro.</p>
                                        <p className="mt-1 text-sm">Quan el professorat publiqui material, apareixerà aquí.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </section>
            )}
        </main>
    );
}

function SubjectPicker({
    subjects,
    countsBySubject,
    role,
    onOpenSubject,
}: {
    subjects: SuroSubject[];
    countsBySubject: Map<string, number>;
    role: "teacher" | "student";
    onOpenSubject: (subjectId: string) => void;
}) {
    if (subjects.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
                <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-45" aria-hidden="true" />
                <p className="font-semibold text-foreground">No tens assignatures assignades.</p>
            </div>
        );
    }

    return (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => {
                const count = countsBySubject.get(subject.id) || 0;
                const teacher = firstRelation(subject.teacher);
                const students = subject.student_count ?? subject.students_count;

                return (
                    <button
                        key={subject.id}
                        type="button"
                        onClick={() => onOpenSubject(subject.id)}
                        className="group flex min-h-52 flex-col rounded-xl border border-border bg-card p-5 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-base font-black text-foreground ring-1 ring-border">
                                {(subject.name || "SU").slice(0, 2).toUpperCase()}
                            </span>
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                                {count} publicacions
                            </span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="line-clamp-2 text-xl font-bold leading-tight text-foreground">
                                {subject.name || "Assignatura"}
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {subjectMeta(subject, role)}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                                {teacher?.full_name && (
                                    <span className="rounded-lg bg-secondary px-2.5 py-1">{teacher.full_name}</span>
                                )}
                                {typeof students === "number" && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1">
                                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                        {students} alumnes
                                    </span>
                                )}
                            </div>
                        </div>

                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            Obrir suro
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                    </button>
                );
            })}
        </section>
    );
}

function SuroNote({
    item,
    subject,
    index,
    role,
    isDeleting,
    onDelete,
}: {
    item: SuroItem;
    subject?: SuroSubject | null;
    index: number;
    role: "teacher" | "student";
    isDeleting: boolean;
    onDelete: () => void;
}) {
    const teacher = firstRelation(item.teacher) || firstRelation(subject?.teacher);
    const Icon = iconForType(item.item_type);
    const tone = noteTone(item.item_type);
    const rotation = ["rotate-[-0.5deg]", "rotate-[0.35deg]", "rotate-[-0.2deg]", "rotate-[0.55deg]"][index % 4];
    const isImage = item.item_type === "image" && item.attachment_url;

    return (
        <article className={`relative min-h-56 rounded-sm border p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${tone.paper} ${tone.border} ${rotation}`}>
            <span className={`absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full shadow-sm ring-4 ${tone.pinRing} ${tone.pin}`} aria-hidden="true" />
            <div className="mb-4 flex items-start justify-between gap-3 pt-4">
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 text-right">
                    <p className="truncate text-xs font-bold uppercase tracking-[0.1em] opacity-60">{typeLabel(item.item_type)}</p>
                    <p suppressHydrationWarning className="truncate text-xs opacity-55">{formatDate(item.created_at)}</p>
                </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-black/5 px-2.5 py-1 text-xs font-bold dark:bg-white/10">
                    {subject?.name || "Assignatura"}
                </span>
                <span className="rounded-md bg-black/5 px-2.5 py-1 text-xs font-semibold opacity-70 dark:bg-white/10">
                    {teacher?.full_name || teacher?.email || "Professorat"}
                </span>
            </div>

            <h3 className="text-lg font-bold leading-snug">{item.title}</h3>
            {item.description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 opacity-75">{item.description}</p>
            )}

            {item.item_type === "event" && item.event_start && (
                <div className="mt-4 rounded-lg border border-black/10 bg-white/45 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10">
                    <div className="flex items-center gap-2 font-bold">
                        <CalendarDays className="h-4 w-4 text-[var(--primary)] dark:text-[var(--accent)]" aria-hidden="true" />
                        <span suppressHydrationWarning>{formatDate(item.event_start)}</span>
                    </div>
                    {item.event_end && (
                        <p suppressHydrationWarning className="mt-1 text-xs opacity-65">Fins {formatDate(item.event_end)}</p>
                    )}
                </div>
            )}

            {isImage && (
                <a href={item.attachment_url || "#"} target="_blank" rel="noopener noreferrer" className="mt-4 block overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                    <img src={item.attachment_url || ""} alt="" className="h-40 w-full object-cover" />
                </a>
            )}

            {item.attachment_url && !isImage && (
                <a
                    href={item.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white/45 px-3 py-2 text-sm font-bold transition-colors hover:bg-white/75 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Obrir adjunt
                </a>
            )}

            {role === "teacher" && (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg opacity-50 transition-colors hover:bg-rose-100 hover:text-rose-700 hover:opacity-100 disabled:opacity-30 dark:hover:bg-rose-950/40"
                    aria-label="Eliminar publicació"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </article>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="px-2 text-center">
            <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
    );
}

function iconForType(type: SuroItem["item_type"]) {
    const icons = {
        note: Pin,
        pdf: FileText,
        book: BookOpen,
        image: ImageIcon,
        video: Video,
        link: LinkIcon,
        event: CalendarDays,
    };
    return icons[type] || Paperclip;
}

function noteTone(type: SuroItem["item_type"]) {
    const tones = {
        note: {
            paper: "bg-[#fff9d6] text-amber-950",
            border: "border-amber-200",
            pin: "bg-slate-700",
            pinRing: "ring-[#fff9d6]",
            icon: "bg-amber-100 text-amber-800",
        },
        pdf: {
            paper: "bg-[#fff1f2] text-rose-950",
            border: "border-rose-200",
            pin: "bg-rose-600",
            pinRing: "ring-[#fff1f2]",
            icon: "bg-rose-100 text-rose-700",
        },
        book: {
            paper: "bg-[#fffbeb] text-stone-950",
            border: "border-orange-200",
            pin: "bg-orange-500",
            pinRing: "ring-[#fffbeb]",
            icon: "bg-orange-100 text-orange-800",
        },
        image: {
            paper: "bg-[#ecfdf5] text-emerald-950",
            border: "border-emerald-200",
            pin: "bg-emerald-600",
            pinRing: "ring-[#ecfdf5]",
            icon: "bg-emerald-100 text-emerald-800",
        },
        video: {
            paper: "bg-[#eef2ff] text-indigo-950",
            border: "border-indigo-200",
            pin: "bg-indigo-600",
            pinRing: "ring-[#eef2ff]",
            icon: "bg-indigo-100 text-indigo-800",
        },
        link: {
            paper: "bg-[#f0f9ff] text-sky-950",
            border: "border-sky-200",
            pin: "bg-sky-600",
            pinRing: "ring-[#f0f9ff]",
            icon: "bg-sky-100 text-sky-800",
        },
        event: {
            paper: "bg-[#fef3c7] text-amber-950",
            border: "border-amber-300",
            pin: "bg-[var(--accent)]",
            pinRing: "ring-[#fef3c7]",
            icon: "bg-white/65 text-amber-800",
        },
    };
    return tones[type] || tones.note;
}

function typeLabel(type: SuroItem["item_type"]) {
    const labels = {
        note: "Nota",
        pdf: "PDF",
        book: "Llibre",
        image: "Foto",
        video: "Vídeo",
        link: "Enllaç",
        event: "Event",
    };
    return labels[type] || "Suro";
}

function cardTime(item: SuroItem) {
    return toTime(item.created_at);
}

function firstRelation<T>(value: Relation<T>) {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function subjectMeta(subject: SuroSubject, role: "teacher" | "student") {
    if (role === "student") {
        return subject.course?.name || subject.course?.code || subject.category || "Sense curs";
    }

    return subject.category || subject.schedule || "General";
}

function toTime(value?: string | null) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}

function formatDate(value?: string | null) {
    if (!value) return "Sense data";
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}

function normalize(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
