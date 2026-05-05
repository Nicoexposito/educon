import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Newspaper,
  PanelTop,
  Settings,
  Upload,
  Users,
} from "lucide-react";

const teacherStats = [
  { label: "Entrega de trabajos", icon: ClipboardCheck },
  { label: "Horario", icon: CalendarDays },
  { label: "Asignaturas", icon: BookOpen },
  { label: "La clase actual", icon: Clock3 },
];

const studentStats = [
  { label: "Entrega de trabajos", icon: Upload },
  { label: "Horario", icon: CalendarDays },
  { label: "Asignaturas", icon: BookOpen },
  { label: "La clase actual", icon: Clock3 },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Materias", icon: BookOpen },
  { label: "Trabajos", icon: FileText },
  { label: "Horario", icon: CalendarDays },
  { label: "Eventos", icon: Megaphone },
  { label: "Noticias", icon: Newspaper },
  { label: "Notificaciones", icon: Bell },
  { label: "Configuración", icon: Settings },
];

const categories = ["Categoría A", "Categoría B", "Categoría C"];

export default function MockupsPage() {
  return (
    <main className="min-h-screen bg-neutral-200 text-neutral-950">
      <section className="border-b border-neutral-300 bg-neutral-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">Educon · wireframes</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-neutral-950 sm:text-4xl">
              Estructura de pantallas
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              Mockups en grises con placeholders para revisar layout, jerarquía y navegación.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-neutral-400 bg-neutral-50 px-4 py-2 text-sm font-bold text-neutral-800"
          >
            Volver
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <MockupFrame title="Dashboard profesor">
          <DashboardWireframe role="teacher" stats={teacherStats} />
        </MockupFrame>

        <MockupFrame title="Dashboard alumno">
          <DashboardWireframe role="student" stats={studentStats} />
        </MockupFrame>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <MockupFrame title="Página de materias">
            <SubjectsWireframe />
          </MockupFrame>

          <MockupFrame title="Dentro de una materia">
            <SubjectDetailWireframe />
          </MockupFrame>
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <MockupFrame title="Trabajos">
            <ListPageWireframe title="Listado de trabajos" icon={FileText} />
          </MockupFrame>
          <MockupFrame title="Horario">
            <ScheduleWireframe />
          </MockupFrame>
          <MockupFrame title="Contenidos / comunidad">
            <ContentWireframe />
          </MockupFrame>
        </div>
      </div>
    </main>
  );
}

function MockupFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-neutral-300 bg-neutral-50 p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-neutral-200 px-1 pb-3">
        <div>
          <h2 className="text-base font-black text-neutral-900">{title}</h2>
          <SkeletonLine className="mt-2 h-2 w-52" />
        </div>
        <span className="rounded border border-neutral-300 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Frame
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-neutral-300 bg-neutral-100">{children}</div>
    </section>
  );
}

function DashboardWireframe({ role, stats }: { role: "teacher" | "student"; stats: typeof teacherStats }) {
  const isTeacher = role === "teacher";

  return (
    <div className="grid min-h-[720px] bg-neutral-100 lg:grid-cols-[232px_1fr]">
      <aside className="hidden border-r border-neutral-300 bg-neutral-800 p-4 text-neutral-100 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-500">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-20 bg-neutral-500" />
            <SkeletonLine className="h-2 w-14 bg-neutral-600" />
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, icon: Icon }, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-md px-3 py-2 ${index === 0 ? "bg-neutral-600" : "bg-neutral-700/60"}`}
            >
              <Icon className="h-4 w-4 text-neutral-300" />
              <SkeletonLine className="h-2.5 w-28 bg-neutral-500" />
            </div>
          ))}
        </nav>
      </aside>

      <div className="p-4 sm:p-6">
        <header className="mb-5 flex flex-col gap-4 border-b border-neutral-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
              {isTeacher ? "Dashboard profesor" : "Dashboard alumno"}
            </p>
            <SkeletonLine className="h-8 w-72" />
            <SkeletonLine className="h-3 w-96 max-w-full" />
          </div>
          <button className="inline-flex h-10 w-44 items-center justify-center gap-2 rounded-md border border-neutral-400 bg-neutral-200 text-sm font-bold text-neutral-700">
            {isTeacher ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            <SkeletonLine className="h-2 w-24" />
          </button>
        </header>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, icon: Icon }) => (
            <article key={label} className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-700">{label}</span>
                <Icon className="h-4 w-4 text-neutral-500" />
              </div>
              <SkeletonLine className="h-9 w-16" />
              <SkeletonLine className="mt-3 h-2.5 w-32" />
            </article>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
            <SectionHeader title="Entrega de trabajos" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <PlaceholderRow key={index} actionWidth={index === 0 ? "w-24" : "w-16"} />
              ))}
            </div>
          </section>

          <section className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
            <SectionHeader title="Horario" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[64px_1fr] gap-3">
                  <SkeletonLine className="mt-4 h-2.5 w-12" />
                  <div className={`rounded-md border p-3 ${index === 1 ? "border-neutral-500 bg-neutral-200" : "border-neutral-300 bg-neutral-100"}`}>
                    <SkeletonLine className="h-3 w-32" />
                    <SkeletonLine className="mt-3 h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SubjectsWireframe() {
  return (
    <div className="bg-neutral-100 p-5">
      <PageTop title="Materias" button />

      <div className="space-y-6">
        {categories.map((category, categoryIndex) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded bg-neutral-500" />
              <span className="text-sm font-black text-neutral-700">{category}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: categoryIndex === 2 ? 1 : 2 }).map((_, index) => (
                <article key={index} className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
                  <SkeletonLine className="h-5 w-24 rounded-full" />
                  <SkeletonLine className="mt-4 h-4 w-3/4" />
                  <div className="mt-4 grid gap-2">
                    <IconLine icon={Clock3} width="w-36" />
                    <IconLine icon={Users} width="w-28" />
                  </div>
                  <button className="mt-4 inline-flex h-9 w-20 items-center justify-center rounded-md border border-neutral-400 bg-neutral-100">
                    <SkeletonLine className="h-2 w-8" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SubjectDetailWireframe() {
  return (
    <div className="bg-neutral-100 p-5">
      <div className="mb-5 rounded-md border border-neutral-400 bg-neutral-700 p-5">
        <SkeletonLine className="h-2.5 w-20 bg-neutral-500" />
        <SkeletonLine className="mt-4 h-7 w-72 bg-neutral-400" />
        <SkeletonLine className="mt-3 h-2.5 w-52 bg-neutral-500" />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Entregas de trabajos", FileText],
          ["Pasar lista", ListChecks],
          ["Contenidos", PanelTop],
        ].map(([title, Icon]) => (
          <button key={title as string} className="rounded-md border border-neutral-300 bg-neutral-50 p-4 text-left">
            <Icon className="mb-4 h-5 w-5 text-neutral-500" />
            <span className="text-sm font-bold text-neutral-700">{title as string}</span>
            <SkeletonLine className="mt-3 h-2.5 w-full" />
            <SkeletonLine className="mt-2 h-2.5 w-2/3" />
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
          <SectionHeader title="Alumnos" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <PlaceholderRow key={index} actionWidth="w-14" />
            ))}
          </div>
        </section>

        <section className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
          <SectionHeader title="Contenidos" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-100 p-3">
                <div className="h-9 w-9 rounded bg-neutral-300" />
                <div className="flex-1">
                  <SkeletonLine className="h-3 w-3/4" />
                  <SkeletonLine className="mt-2 h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ListPageWireframe({ title, icon: Icon }: { title: string; icon: typeof FileText }) {
  return (
    <div className="min-h-[470px] bg-neutral-100 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-md border border-neutral-400 bg-neutral-300 p-3">
          <Icon className="h-5 w-5 text-neutral-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-neutral-800">{title}</h3>
          <SkeletonLine className="mt-2 h-2.5 w-40" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <PlaceholderRow key={index} actionWidth="w-14" />
        ))}
      </div>
    </div>
  );
}

function ScheduleWireframe() {
  return (
    <div className="min-h-[470px] bg-neutral-100 p-5">
      <PageTop title="Horario" />
      <div className="grid grid-cols-5 gap-2">
        {["L", "M", "X", "J", "V"].map((day) => (
          <div key={day} className="rounded-md border border-neutral-300 bg-neutral-50 p-2 text-center text-xs font-black text-neutral-600">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="min-h-20 rounded-md border border-neutral-300 bg-neutral-50 p-2">
            {index % 4 === 0 && (
              <>
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="mt-2 h-2.5 w-1/2" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentWireframe() {
  return (
    <div className="min-h-[470px] bg-neutral-100 p-5">
      <PageTop title="Contenidos y comunidad" />
      <div className="space-y-2">
        {[PanelTop, CalendarDays, CheckCircle2, Newspaper, Bell].map((Icon, index) => (
          <div key={index} className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-neutral-500" />
                <div className="flex-1">
                  <SkeletonLine className="h-2.5 w-20" />
                  <SkeletonLine className="mt-3 h-3.5 w-3/4" />
                  <SkeletonLine className="mt-2 h-2.5 w-1/2" />
                </div>
              </div>
              <button className="h-8 w-14 rounded-md border border-neutral-400 bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageTop({ title, button = false }: { title: string; button?: boolean }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">Página</p>
        <h3 className="text-xl font-black text-neutral-800">{title}</h3>
        <SkeletonLine className="mt-2 h-2.5 w-56" />
      </div>
      {button && <button className="h-9 w-24 rounded-md border border-neutral-400 bg-neutral-200" />}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h4 className="font-black text-neutral-800">{title}</h4>
      <SkeletonLine className="h-6 w-20 rounded-full" />
    </div>
  );
}

function PlaceholderRow({ actionWidth }: { actionWidth: string }) {
  return (
    <div className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-100 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <SkeletonLine className="h-3.5 w-3/4" />
        <SkeletonLine className="mt-2 h-2.5 w-1/2" />
      </div>
      <button className={`h-8 rounded-md border border-neutral-400 bg-neutral-50 ${actionWidth}`} />
    </div>
  );
}

function IconLine({ icon: Icon, width }: { icon: typeof Clock3; width: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-neutral-500" />
      <SkeletonLine className={`h-2.5 ${width}`} />
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`block rounded bg-neutral-300 ${className}`} />;
}
