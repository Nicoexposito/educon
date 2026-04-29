"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Bell,
    BookOpen,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    GraduationCap,
    Loader2,
    Lock,
    Mail,
    MessageSquare,
    School,
    ShieldCheck,
    Sparkles,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";
import { authenticateUser, checkInstituteExists, searchInstitutes } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

type Lang = "ca" | "es";

const copy = {
    ca: {
        nav: {
            product: "Producte",
            teachers: "Professorat",
            students: "Alumnat",
            modules: "Mòduls",
            login: "Entrar",
        },
        hero: {
            eyebrow: "Plataforma academica per centres educatius",
            title: "La vida del centre, ordenada al minut.",
            lead: "Horaris, tasques, assistencia i avisos. Tot sincronitzat.",
            primary: "Accedir al centre",
            secondary: "Veure com funciona",
        },
        stats: [
            ["Temps real", "Canvis al moment"],
            ["Per rols", "Professorat i alumnat"],
            ["Connectat", "Dades i correu reals"],
        ],
        dashboard: {
            title: "Panell del professor",
            current: "Classe actual",
            className: "Programacio - 2n BAT",
            attendance: "Assistencia d'avui",
            tasks: "Treballs per corregir",
            news: "Avisos enviats",
        },
        sections: {
            productTitle: "Cada pantalla respon a una pregunta concreta.",
            productText: "Una vista clara del dia academic.",
            modulesTitle: "El que mes es fa servir",
            dayTitle: "El dia, sense perdre el fil",
            teachersTitle: "Per al professorat",
            studentsTitle: "Per a l'alumnat",
            flowTitle: "Del treball publicat a la nota final",
            trustTitle: "Pensat per al ritme real d'un centre",
            ctaTitle: "Entra al teu centre",
            ctaText: "Institut, usuari i dades reals.",
        },
        productCards: [
            ["Horari viu", "Ara, despres i setmana."],
            ["Treballs", "Pendents i correccions."],
            ["Assistencia", "Llista per assignatura."],
            ["Comunicacio", "Avisos i correu."],
        ],
        modules: [
            ["Horari", "Classes actuals"],
            ["Assignatures", "Materials i alumnat"],
            ["Treballs", "Entregar i corregir"],
            ["Assistencia", "Passar llista"],
            ["Notes", "Qualificacions"],
            ["Avisos", "Notificacions"],
        ],
        day: [
            ["08:00", "Horari"],
            ["Classe", "Assistencia"],
            ["Entrega", "Treballs"],
            ["Final", "Notes i avisos"],
        ],
        teacherCards: [
            ["Passar llista", "Avui i historic."],
            ["Crear tasques", "Dates i entregues."],
            ["Corregir", "Notes i avisos."],
        ],
        studentCards: [
            ["Tasques", "Que falta per entregar."],
            ["Notes", "Resultats i feedback."],
            ["Assistencia", "Faltes per classe."],
        ],
        flow: [
            "Publicar",
            "Entregar",
            "Corregir",
            "Notificar",
        ],
        trust: [
            "Base de dades real.",
            "Notificacions configurables.",
            "Interficie directa.",
        ],
        login: {
            title: "Acces al centre",
            instituteLabel: "Nom de l'institut",
            institutePlaceholder: "Escriu el teu centre",
            next: "Continuar",
            emailLabel: "Correu electronic",
            passwordLabel: "Contrasenya",
            loginButton: "Entrar al panell",
            google: "Entrar amb Google",
            change: "Canviar",
            invalidInstitute: "Aquest institut no existeix a la base de dades.",
            invalidCredentials: "Usuari o contrasenya incorrectes.",
            googleError: "Error en l'autenticacio amb Google.",
        },
        footerLinks: {
            product: "Producte",
            legal: "Legal",
            contact: "Contacte",
            privacy: "Privacitat",
            cookies: "Cookies",
            terms: "Termes",
            notice: "Avís legal",
            access: "Accés al centre",
            email: "notificaciones@educon.cat",
            copyright: "Tots els drets reservats.",
        },
        footer: "Gestio academica clara per al dia a dia.",
    },
    es: {
        nav: {
            product: "Producto",
            teachers: "Profesorado",
            students: "Alumnado",
            modules: "Módulos",
            login: "Entrar",
        },
        hero: {
            eyebrow: "Plataforma academica para centros educativos",
            title: "La vida del centro, ordenada al minuto.",
            lead: "Horarios, tareas, asistencia y avisos. Todo sincronizado.",
            primary: "Acceder al centro",
            secondary: "Ver como funciona",
        },
        stats: [
            ["Tiempo real", "Cambios al momento"],
            ["Por roles", "Profesorado y alumnado"],
            ["Conectado", "Datos y correo reales"],
        ],
        dashboard: {
            title: "Panel del profesor",
            current: "Clase actual",
            className: "Programacion - 2º BAT",
            attendance: "Asistencia de hoy",
            tasks: "Trabajos por corregir",
            news: "Avisos enviados",
        },
        sections: {
            productTitle: "Cada pantalla responde a una pregunta concreta.",
            productText: "Una vista clara del dia academico.",
            modulesTitle: "Lo que mas se usa",
            dayTitle: "El dia, sin perder el hilo",
            teachersTitle: "Para el profesorado",
            studentsTitle: "Para el alumnado",
            flowTitle: "Del trabajo publicado a la nota final",
            trustTitle: "Pensado para el ritmo real de un centro",
            ctaTitle: "Entra a tu centro",
            ctaText: "Instituto, usuario y datos reales.",
        },
        productCards: [
            ["Horario vivo", "Ahora, despues y semana."],
            ["Trabajos", "Pendientes y correcciones."],
            ["Asistencia", "Lista por asignatura."],
            ["Comunicacion", "Avisos y correo."],
        ],
        modules: [
            ["Horario", "Clases actuales"],
            ["Asignaturas", "Materiales y alumnado"],
            ["Trabajos", "Entregar y corregir"],
            ["Asistencia", "Pasar lista"],
            ["Notas", "Calificaciones"],
            ["Avisos", "Notificaciones"],
        ],
        day: [
            ["08:00", "Horario"],
            ["Clase", "Asistencia"],
            ["Entrega", "Trabajos"],
            ["Final", "Notas y avisos"],
        ],
        teacherCards: [
            ["Pasar lista", "Hoy e historico."],
            ["Crear tareas", "Fechas y entregas."],
            ["Corregir", "Notas y avisos."],
        ],
        studentCards: [
            ["Tareas", "Que falta por entregar."],
            ["Notas", "Resultados y feedback."],
            ["Asistencia", "Faltas por clase."],
        ],
        flow: [
            "Publicar",
            "Entregar",
            "Corregir",
            "Notificar",
        ],
        trust: [
            "Base de datos real.",
            "Notificaciones configurables.",
            "Interfaz directa.",
        ],
        login: {
            title: "Acceso al centro",
            instituteLabel: "Nombre del instituto",
            institutePlaceholder: "Escribe tu centro",
            next: "Continuar",
            emailLabel: "Correo electronico",
            passwordLabel: "Contraseña",
            loginButton: "Entrar al panel",
            google: "Entrar con Google",
            change: "Cambiar",
            invalidInstitute: "Este instituto no existe en la base de datos.",
            invalidCredentials: "Usuario o contraseña incorrectos.",
            googleError: "Error en la autenticacion con Google.",
        },
        footerLinks: {
            product: "Producto",
            legal: "Legal",
            contact: "Contacto",
            privacy: "Privacidad",
            cookies: "Cookies",
            terms: "Términos",
            notice: "Aviso legal",
            access: "Acceso al centro",
            email: "notificaciones@educon.cat",
            copyright: "Todos los derechos reservados.",
        },
        footer: "Gestion academica clara para el dia a dia.",
    },
} as const;

type LandingCopy = (typeof copy)[Lang];

const landingPhotos = {
    hero: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2400&q=82",
    product: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=82",
    modules: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1800&q=82",
    day: "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?auto=format&fit=crop&w=1800&q=82",
    teachers: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1400&q=82",
    students: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82",
    trust: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1800&q=82",
    cta: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2200&q=82",
    login: "https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?auto=format&fit=crop&w=1600&q=82",
};

const productIcons = [CalendarDays, BarChart3, Users, Bell] satisfies LucideIcon[];
const moduleIcons = [CalendarDays, BookOpen, FileText, ClipboardCheck, BarChart3, MessageSquare] satisfies LucideIcon[];
const currentYear = 2026;

export default function LandingPage() {
    const [lang, setLang] = useState<Lang>("ca");
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [loginStep, setLoginStep] = useState<"institute" | "credentials">("institute");
    const [instituteName, setInstituteName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasPickedInstitute, setHasPickedInstitute] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = copy[lang];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (instituteName.length > 0 && loginStep === "institute" && !hasPickedInstitute) {
                setIsSearching(true);
                const results = await searchInstitutes(instituteName);
                setSearchResults(results as { id: string; name: string }[]);
                setIsSearching(false);
                setShowSuggestions(true);
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [instituteName, loginStep, hasPickedInstitute]);

    useEffect(() => {
        document.body.style.overflow = isLoginOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isLoginOpen]);

    useEffect(() => {
        const updateHeader = () => setIsScrolled(window.scrollY > 36);
        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });
        return () => window.removeEventListener("scroll", updateHeader);
    }, []);

    const resetLogin = () => {
        setIsLoginOpen(false);
        setLoginStep("institute");
        setError("");
        setInstituteName("");
        setEmail("");
        setPassword("");
        setSearchResults([]);
        setHasPickedInstitute(false);
    };

    const handleInstituteSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setShowSuggestions(false);

        if (instituteName.trim().length === 0) return;

        setIsLoading(true);
        const exists = await checkInstituteExists(instituteName.trim());
        setIsLoading(false);

        if (exists) {
            setLoginStep("credentials");
        } else {
            setError(t.login.invalidInstitute);
        }
    };

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await authenticateUser(email, password, instituteName);

        if (result.success) {
            router.push("/dashboard");
        } else {
            setError(t.login.invalidCredentials);
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");
        const supabase = createClient();

        const { error: googleError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (googleError) {
            setError(t.login.googleError);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-[#102033] selection:bg-[#ff8a24]/20">
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                    isScrolled
                        ? "border-b border-[#dce5ef] bg-white/92 shadow-sm backdrop-blur-xl"
                        : "border-b border-white/10 bg-[#071522]/22 backdrop-blur-md"
                }`}
            >
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
                    <a href="#top" className="flex items-center gap-3">
                        <span className="relative h-12 w-12 shrink-0">
                            <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-md" priority sizes="48px" />
                        </span>
                        <span className={`text-2xl font-black tracking-tight ${isScrolled ? "text-[#10294b]" : "text-white"}`}>Educon</span>
                    </a>

                    <nav className={`hidden items-center gap-7 text-sm font-semibold md:flex ${isScrolled ? "text-[#43546b]" : "text-white/76"}`}>
                        <a href="#product" className={isScrolled ? "hover:text-[#10294b]" : "hover:text-white"}>{t.nav.product}</a>
                        <a href="#teachers" className={isScrolled ? "hover:text-[#10294b]" : "hover:text-white"}>{t.nav.teachers}</a>
                        <a href="#students" className={isScrolled ? "hover:text-[#10294b]" : "hover:text-white"}>{t.nav.students}</a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className={`rounded-full border p-1 ${isScrolled ? "border-[#dce5ef] bg-[#f6f8fb]" : "border-white/16 bg-white/10"}`}>
                            {(["ca", "es"] as Lang[]).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setLang(item)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                        lang === item
                                            ? isScrolled
                                                ? "bg-[#10294b] text-white shadow-sm"
                                                : "bg-white text-[#10294b] shadow-sm"
                                            : isScrolled
                                                ? "text-[#64748b] hover:text-[#10294b]"
                                                : "text-white/68 hover:text-white"
                                    }`}
                                >
                                    {item.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsLoginOpen(true)}
                            className="rounded-full bg-[#f47b20] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#df690e] md:px-5"
                        >
                            {t.nav.login}
                        </button>
                    </div>
                </div>
            </header>

            <main id="top">
                <section
                    className="relative flex min-h-[100svh] overflow-hidden px-5 pb-10 pt-28 text-white md:px-8 md:pb-12 md:pt-32"
                    style={{ backgroundImage: `url(${landingPhotos.hero})`, backgroundPosition: "center", backgroundSize: "cover" }}
                >
                    <div className="absolute inset-0 bg-[#071522]/72" />
                    <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#f6f8fb] via-[#f6f8fb]/18 to-transparent" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,34,0.92)_0%,rgba(7,21,34,0.74)_45%,rgba(7,21,34,0.2)_100%)]" />

                    <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-end gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55 }}
                            className="max-w-4xl pb-2 md:pb-8"
                        >
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-2xl shadow-black/20 backdrop-blur-md">
                                <Sparkles className="h-4 w-4 text-[#ffb15f]" />
                                {t.hero.eyebrow}
                            </div>
                            <h1 className="text-5xl font-black leading-[0.94] tracking-tight text-white drop-shadow-2xl md:text-7xl lg:text-8xl">
                                {t.hero.title}
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/82 md:text-xl">
                                {t.hero.lead}
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => setIsLoginOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f47b20] px-6 py-4 text-sm font-black text-white shadow-2xl shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#ff8a24]"
                                >
                                    {t.hero.primary}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <a
                                    href="#product"
                                    className="inline-flex items-center justify-center rounded-2xl border border-white/22 bg-white/12 px-6 py-4 text-sm font-black text-white shadow-2xl shadow-black/10 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/18"
                                >
                                    {t.hero.secondary}
                                </a>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/72">
                                <a href="#product" className="border border-white/16 bg-white/8 px-3 py-2 backdrop-blur-md transition hover:bg-white/14 hover:text-white">01 {t.nav.product}</a>
                                <a href="#teachers" className="border border-white/16 bg-white/8 px-3 py-2 backdrop-blur-md transition hover:bg-white/14 hover:text-white">02 {t.nav.teachers}</a>
                                <a href="#students" className="border border-white/16 bg-white/8 px-3 py-2 backdrop-blur-md transition hover:bg-white/14 hover:text-white">03 {t.nav.students}</a>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.12 }}
                            className="grid gap-3 pb-4 sm:grid-cols-3 lg:w-[78%]"
                        >
                            {t.stats.map(([title, text]) => (
                                <div key={title} className="border-l border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/10 backdrop-blur-md">
                                    <p className="text-sm font-black text-white">{title}</p>
                                    <p className="mt-1 text-xs font-medium leading-5 text-white/68">{text}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                <section id="product" className="px-5 py-24 md:px-8 md:py-28">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid items-end gap-10 lg:grid-cols-[0.82fr_1fr]">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#f47b20]">Educon</p>
                                <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#102033] md:text-6xl">{t.sections.productTitle}</h2>
                            </div>
                            <p className="text-lg leading-8 text-[#52647a] lg:max-w-xl lg:justify-self-end">{t.sections.productText}</p>
                        </div>

                        <div className="mt-14 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                            <div
                                className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#10294b] p-6 text-white shadow-2xl shadow-slate-900/14 md:p-8"
                                style={{ backgroundImage: `url(${landingPhotos.product})`, backgroundPosition: "center", backgroundSize: "cover" }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,28,45,0.18)_0%,rgba(10,28,45,0.82)_100%)]" />
                                <div className="relative flex h-full min-h-[370px] flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="relative h-14 w-14 shrink-0">
                                            <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-md" sizes="56px" />
                                        </span>
                                        <span className="border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] backdrop-blur-md">Live</span>
                                    </div>

                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffbf77]">{t.dashboard.current}</p>
                                        <h3 className="mt-3 max-w-xl text-3xl font-black tracking-tight md:text-5xl">{t.dashboard.className}</h3>
                                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                            {[
                                                [t.dashboard.attendance, "26 / 28"],
                                                [t.dashboard.tasks, "14"],
                                                [t.dashboard.news, "8"],
                                            ].map(([label, value]) => (
                                                <div key={label} className="border-t border-white/20 pt-3">
                                                    <p className="text-2xl font-black">{value}</p>
                                                    <p className="mt-1 text-xs font-semibold text-white/68">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {t.productCards.map(([title, text], index) => {
                                    const Icon = productIcons[index] ?? ShieldCheck;
                                    return <FeatureCard key={title} icon={Icon} title={title} text={text} />;
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white px-5 py-24 md:px-8 md:py-28">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 max-w-3xl">
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#f47b20]">Educon</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#102033] md:text-6xl">
                                {t.sections.teachersTitle} / {t.sections.studentsTitle}
                            </h2>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-2">
                            <RoleBlock id="teachers" title={t.sections.teachersTitle} items={t.teacherCards} accent="#10294b" photo={landingPhotos.teachers} />
                            <RoleBlock id="students" title={t.sections.studentsTitle} items={t.studentCards} accent="#f47b20" photo={landingPhotos.students} />
                        </div>
                    </div>
                </section>

                <section id="modules" className="px-5 py-24 md:px-8 md:py-28">
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                        <div
                            className="relative min-h-[430px] overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-900/14 md:p-8"
                            style={{ backgroundImage: `url(${landingPhotos.modules})`, backgroundPosition: "center", backgroundSize: "cover" }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,34,0.1)_0%,rgba(7,21,34,0.86)_100%)]" />
                            <div className="relative flex h-full min-h-[370px] flex-col justify-end">
                                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffbf77]">{lang === "ca" ? "Mòduls" : "Módulos"}</p>
                                <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight md:text-6xl">{t.sections.modulesTitle}</h2>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {t.modules.map(([title, text], index) => {
                                const Icon = moduleIcons[index] ?? ShieldCheck;
                                return <ModuleTile key={title} icon={Icon} title={title} text={text} index={index + 1} />;
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-white px-5 py-24 md:px-8 md:py-28">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#f47b20]">{lang === "ca" ? "Ritme" : "Ritmo"}</p>
                                <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#102033] md:text-6xl">{t.sections.dayTitle}</h2>
                            </div>
                        </div>

                        <div
                            className="relative min-h-[480px] overflow-hidden rounded-[2rem] p-5 text-white shadow-2xl shadow-slate-900/12 md:p-8"
                            style={{ backgroundImage: `url(${landingPhotos.day})`, backgroundPosition: "center", backgroundSize: "cover" }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,34,0.18)_0%,rgba(7,21,34,0.86)_100%)]" />
                            <div className="relative flex min-h-[420px] items-end">
                                <div className="grid w-full gap-3 md:grid-cols-4">
                                    {t.day.map(([time, label], index) => (
                                        <DaySlice key={`${time}-${label}`} time={time} label={label} index={index + 1} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className="relative overflow-hidden px-5 py-24 text-white md:px-8 md:py-28"
                    style={{ backgroundImage: `url(${landingPhotos.trust})`, backgroundPosition: "center", backgroundSize: "cover" }}
                >
                    <div className="absolute inset-0 bg-[#071522]/82" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,34,0.94)_0%,rgba(7,21,34,0.76)_55%,rgba(7,21,34,0.46)_100%)]" />
                    <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr]">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffbf77]">Workflow</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">{t.sections.flowTitle}</h2>
                            <div className="mt-8 grid gap-4">
                                {t.trust.map((item) => (
                                    <div key={item} className="flex gap-3 border-l border-white/20 bg-white/8 p-4 backdrop-blur-md">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#46d39a]" />
                                        <p className="text-sm font-semibold leading-6 text-white/78">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid content-center gap-3">
                            {t.flow.map((item, index) => (
                                <ProcessStep key={item} index={index + 1} text={item} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-5 py-20 md:px-8 md:py-24">
                    <div
                        className="relative mx-auto overflow-hidden rounded-[2rem] px-6 py-16 text-white shadow-2xl shadow-slate-900/16 md:max-w-7xl md:px-10 md:py-20"
                        style={{ backgroundImage: `url(${landingPhotos.cta})`, backgroundPosition: "center", backgroundSize: "cover" }}
                    >
                        <div className="absolute inset-0 bg-[#071522]/76" />
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,34,0.92)_0%,rgba(7,21,34,0.62)_64%,rgba(7,21,34,0.28)_100%)]" />
                        <div className="relative max-w-3xl">
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffbf77]">Educon</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">{t.sections.ctaTitle}</h2>
                            <p className="mt-4 text-lg font-semibold text-white/74">{t.sections.ctaText}</p>
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#f47b20] px-6 py-4 text-sm font-black text-white shadow-2xl shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#ff8a24]"
                            >
                                {t.hero.primary}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#dce5ef] bg-white px-5 py-8 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-10 border-b border-[#dce5ef] pb-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-3">
                                <span className="relative h-12 w-12 shrink-0">
                                    <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-sm" sizes="48px" />
                                </span>
                                <span className="text-2xl font-black tracking-tight text-[#10294b]">Educon</span>
                            </Link>
                            <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-[#64748b]">{t.footer}</p>
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#10294b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#18395f]"
                            >
                                {t.footerLinks.access}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <FooterColumn
                            title={t.footerLinks.product}
                            links={[
                                [t.nav.product, "/#product"],
                                [t.nav.teachers, "/#teachers"],
                                [t.nav.students, "/#students"],
                                [t.nav.modules, "/#modules"],
                            ]}
                        />
                        <FooterColumn
                            title={t.footerLinks.legal}
                            links={[
                                [t.footerLinks.notice, "/legal/aviso-legal"],
                                [t.footerLinks.privacy, "/legal/privacidad"],
                                [t.footerLinks.cookies, "/legal/cookies"],
                                [t.footerLinks.terms, "/legal/terminos"],
                            ]}
                        />
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#10294b]">{t.footerLinks.contact}</h3>
                            <a href={`mailto:${t.footerLinks.email}`} className="mt-5 block text-sm font-bold text-[#64748b] transition hover:text-[#f47b20]">
                                {t.footerLinks.email}
                            </a>
                            <p className="mt-3 text-sm font-semibold text-[#94a3b8]">educon.cat</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6 text-xs font-bold text-[#94a3b8] sm:flex-row sm:items-center sm:justify-between">
                        <p>© {currentYear} Educon. {t.footerLinks.copyright}</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/legal/privacidad" className="transition hover:text-[#10294b]">{t.footerLinks.privacy}</Link>
                            <Link href="/legal/cookies" className="transition hover:text-[#10294b]">{t.footerLinks.cookies}</Link>
                            <Link href="/legal/terminos" className="transition hover:text-[#10294b]">{t.footerLinks.terms}</Link>
                        </div>
                    </div>
                </div>
            </footer>

            <LoginModal
                isOpen={isLoginOpen}
                loginStep={loginStep}
                setLoginStep={setLoginStep}
                resetLogin={resetLogin}
                t={t}
                instituteName={instituteName}
                setInstituteName={setInstituteName}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                setError={setError}
                isLoading={isLoading}
                isSearching={isSearching}
                searchResults={searchResults}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                setHasPickedInstitute={setHasPickedInstitute}
                setSearchResults={setSearchResults}
                wrapperRef={wrapperRef}
                handleInstituteSubmit={handleInstituteSubmit}
                handleLogin={handleLogin}
                handleGoogleLogin={handleGoogleLogin}
            />
        </div>
    );
}

function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
    return (
        <div className="group border border-[#dce5ef] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#f47b20]/35 hover:shadow-xl hover:shadow-slate-900/8">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff2e8] text-[#f47b20] transition group-hover:bg-[#f47b20] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-[#102033]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{text}</p>
                </div>
            </div>
        </div>
    );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
    return (
        <div>
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#10294b]">{title}</h3>
            <div className="mt-5 grid gap-3">
                {links.map(([label, href]) => (
                    <Link key={`${label}-${href}`} href={href} className="text-sm font-bold text-[#64748b] transition hover:text-[#f47b20]">
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

function ModuleTile({ icon: Icon, title, text, index }: { icon: LucideIcon; title: string; text: string; index: number }) {
    return (
        <div className="group min-h-40 border border-[#dce5ef] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#f47b20]/40 hover:shadow-xl hover:shadow-slate-900/8">
            <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10294b] text-white">
                    <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-black text-[#94a3b8]">{String(index).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-6 text-xl font-black text-[#102033]">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">{text}</p>
        </div>
    );
}

function DaySlice({ time, label, index }: { time: string; label: string; index: number }) {
    return (
        <div className="border border-white/18 bg-white/12 p-5 shadow-2xl shadow-black/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/48">{String(index).padStart(2, "0")}</span>
                <span className="h-2 w-2 rounded-full bg-[#ffbf77]" />
            </div>
            <p className="mt-10 text-3xl font-black tracking-tight">{time}</p>
            <p className="mt-2 text-sm font-semibold text-white/70">{label}</p>
        </div>
    );
}

function RoleBlock({
    id,
    title,
    items,
    accent,
    photo,
}: {
    id: string;
    title: string;
    items: readonly (readonly [string, string])[];
    accent: string;
    photo: string;
}) {
    return (
        <article id={id} className="overflow-hidden rounded-[2rem] border border-[#dce5ef] bg-[#f8fafc] shadow-sm">
            <div
                className="relative min-h-64 p-6 text-white md:p-8"
                style={{ backgroundImage: `url(${photo})`, backgroundPosition: "center", backgroundSize: "cover" }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,34,0.16)_0%,rgba(7,21,34,0.8)_100%)]" />
                <div className="relative flex min-h-52 flex-col justify-end">
                    <span className="mb-4 h-1 w-16" style={{ backgroundColor: accent }} />
                    <h2 className="text-4xl font-black tracking-tight md:text-5xl">{title}</h2>
                </div>
            </div>
            <div className="divide-y divide-[#dce5ef]">
                {items.map(([itemTitle, text]) => (
                    <div key={itemTitle} className="flex gap-4 bg-white/70 p-5 md:p-6">
                        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                        <div>
                            <h3 className="font-black text-[#102033]">{itemTitle}</h3>
                            <p className="mt-1 text-sm leading-6 text-[#64748b]">{text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </article>
    );
}

function ProcessStep({ index, text }: { index: number; text: string }) {
    return (
        <div className="grid grid-cols-[3.5rem_1fr] items-center gap-4 border border-white/14 bg-white/10 p-4 shadow-2xl shadow-black/10 backdrop-blur-md">
            <span className="flex h-14 w-14 items-center justify-center bg-white text-lg font-black text-[#10294b]">{String(index).padStart(2, "0")}</span>
            <p className="text-sm font-semibold leading-6 text-white/82">{text}</p>
        </div>
    );
}

function LoginModal(props: {
    isOpen: boolean;
    loginStep: "institute" | "credentials";
    setLoginStep: (step: "institute" | "credentials") => void;
    resetLogin: () => void;
    t: LandingCopy;
    instituteName: string;
    setInstituteName: (value: string) => void;
    email: string;
    setEmail: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    error: string;
    setError: (value: string) => void;
    isLoading: boolean;
    isSearching: boolean;
    searchResults: { id: string; name: string }[];
    showSuggestions: boolean;
    setShowSuggestions: (value: boolean) => void;
    setHasPickedInstitute: (value: boolean) => void;
    setSearchResults: (value: { id: string; name: string }[]) => void;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    handleInstituteSubmit: (event: React.FormEvent) => void;
    handleLogin: (event: React.FormEvent) => void;
    handleGoogleLogin: () => void;
}) {
    const {
        isOpen,
        loginStep,
        setLoginStep,
        resetLogin,
        t,
        instituteName,
        setInstituteName,
        email,
        setEmail,
        password,
        setPassword,
        error,
        setError,
        isLoading,
        isSearching,
        searchResults,
        showSuggestions,
        setShowSuggestions,
        setHasPickedInstitute,
        setSearchResults,
        wrapperRef,
        handleInstituteSubmit,
        handleLogin,
        handleGoogleLogin,
    } = props;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#071522]/78 p-3 backdrop-blur-xl md:p-6"
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-30"
                        style={{ backgroundImage: `url(${landingPhotos.login})`, backgroundPosition: "center", backgroundSize: "cover" }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(7,21,34,0.92)_0%,rgba(7,21,34,0.64)_48%,rgba(244,123,32,0.18)_100%)]" />

                    <motion.div
                        initial={{ opacity: 0, y: 22, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 22, scale: 0.96 }}
                        transition={{ duration: 0.22 }}
                        className="relative my-auto grid max-h-[94svh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/16 bg-white shadow-2xl shadow-black/35 lg:grid-cols-[0.92fr_1.08fr]"
                    >
                        <div
                            className="relative hidden min-h-[640px] overflow-hidden p-8 text-white lg:block"
                            style={{ backgroundImage: `url(${landingPhotos.login})`, backgroundPosition: "center", backgroundSize: "cover" }}
                        >
                            <div className="absolute inset-0 bg-[#071522]/58" />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,34,0.16)_0%,rgba(7,21,34,0.92)_100%)]" />
                            <div className="relative flex h-full flex-col justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="relative h-14 w-14 shrink-0">
                                        <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-md" sizes="56px" />
                                    </span>
                                    <span className="text-2xl font-black tracking-tight">Educon</span>
                                </div>

                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffbf77]">{t.hero.eyebrow}</p>
                                    <h2 className="mt-4 text-5xl font-black leading-[0.94] tracking-tight">{t.hero.title}</h2>
                                    <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-white/70">{t.hero.lead}</p>
                                    <div className="mt-8 grid gap-3">
                                        {t.stats.map(([title, text]) => (
                                            <div key={title} className="border-l border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                                <p className="text-sm font-black">{title}</p>
                                                <p className="mt-1 text-xs font-semibold text-white/64">{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-0 overflow-y-auto bg-white p-5 md:p-8">
                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-5 flex items-center gap-3 lg:hidden">
                                        <span className="relative h-12 w-12 shrink-0">
                                            <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-sm" sizes="48px" />
                                        </span>
                                        <span className="text-2xl font-black tracking-tight text-[#10294b]">Educon</span>
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f47b20]">{t.nav.login}</p>
                                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[#102033] md:text-4xl">{t.login.title}</h2>
                                </div>
                                <button
                                    onClick={resetLogin}
                                    aria-label="Cerrar"
                                    className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] p-3 text-[#64748b] transition hover:border-[#f47b20]/40 hover:bg-white hover:text-[#10294b]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#dce5ef] bg-[#f8fafc] p-1">
                                <div className={`rounded-xl px-3 py-2 text-center text-xs font-black ${loginStep === "institute" ? "bg-[#10294b] text-white shadow-sm" : "text-[#64748b]"}`}>
                                    01 {t.login.instituteLabel}
                                </div>
                                <div className={`rounded-xl px-3 py-2 text-center text-xs font-black ${loginStep === "credentials" ? "bg-[#10294b] text-white shadow-sm" : "text-[#64748b]"}`}>
                                    02 {t.login.emailLabel}
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {loginStep === "institute" ? (
                                    <motion.form
                                        key="institute"
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16 }}
                                        onSubmit={handleInstituteSubmit}
                                        className="space-y-6"
                                    >
                                        <div className="relative space-y-2" ref={wrapperRef}>
                                            <label className="text-sm font-black text-[#102033]">{t.login.instituteLabel}</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#f47b20]" />
                                                <input
                                                    type="text"
                                                    name="organization"
                                                    autoComplete="organization"
                                                    required
                                                    value={instituteName}
                                                    onChange={(event) => {
                                                        setInstituteName(event.target.value);
                                                        setHasPickedInstitute(false);
                                                        setError("");
                                                    }}
                                                    onFocus={() => {
                                                        if (instituteName.length > 0) setShowSuggestions(true);
                                                    }}
                                                    placeholder={t.login.institutePlaceholder}
                                                    className="w-full rounded-[1.35rem] border border-[#dce5ef] bg-[#f8fafc] py-4 pl-14 pr-12 text-base font-bold text-[#102033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#f47b20] focus:bg-white focus:shadow-xl focus:shadow-orange-500/10"
                                                />
                                                {isSearching && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#94a3b8]" />}
                                            </div>

                                            {showSuggestions && searchResults.length > 0 && (
                                                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[1.35rem] border border-[#dce5ef] bg-white p-2 shadow-2xl shadow-slate-900/16">
                                                    {searchResults.map((result) => (
                                                        <button
                                                            key={result.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setInstituteName(result.name);
                                                                setHasPickedInstitute(true);
                                                                setSearchResults([]);
                                                                setShowSuggestions(false);
                                                                setError("");
                                                            }}
                                                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-[#102033] transition hover:bg-[#fff2e8]"
                                                        >
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff2e8] text-[#f47b20]">
                                                                <School className="h-4 w-4" />
                                                            </span>
                                                            <span className="truncate">{result.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <ErrorMessage error={error} />

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-[#10294b] px-5 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/14 transition hover:-translate-y-0.5 hover:bg-[#18395f] disabled:translate-y-0 disabled:opacity-60"
                                        >
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.login.next}
                                            {!isLoading && <ArrowRight className="h-4 w-4" />}
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        key="credentials"
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        onSubmit={handleLogin}
                                        autoComplete="on"
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-[#dce5ef] bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#43546b]">
                                            <span className="flex min-w-0 items-center gap-2">
                                                <Building2 className="h-4 w-4 shrink-0 text-[#f47b20]" />
                                                <span className="truncate">{instituteName}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHasPickedInstitute(false);
                                                    setLoginStep("institute");
                                                }}
                                                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#f47b20] shadow-sm transition hover:text-[#10294b]"
                                            >
                                                {t.login.change}
                                            </button>
                                        </div>

                                        <InputField icon={Mail} label={t.login.emailLabel} type="email" name="email" autoComplete="username" value={email} onChange={setEmail} />
                                        <InputField icon={Lock} label={t.login.passwordLabel} type="password" name="password" autoComplete="current-password" value={password} onChange={setPassword} />

                                        <ErrorMessage error={error} />

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setLoginStep("institute")}
                                                className="rounded-[1.35rem] border border-[#dce5ef] bg-white px-4 text-[#10294b] transition hover:border-[#f47b20]/40 hover:bg-[#fff2e8]"
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-[1.35rem] bg-[#10294b] px-5 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/14 transition hover:-translate-y-0.5 hover:bg-[#18395f] disabled:translate-y-0 disabled:opacity-60"
                                            >
                                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.login.loginButton}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGoogleLogin}
                                            disabled={isLoading}
                                            className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[#dce5ef] bg-white px-5 py-3.5 text-sm font-black text-[#10294b] transition hover:border-[#f47b20]/40 hover:bg-[#fff2e8] disabled:opacity-60"
                                        >
                                            <GraduationCap className="h-4 w-4 text-[#f47b20]" />
                                            {t.login.google}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function InputField({
    icon: Icon,
    label,
    type,
    name,
    autoComplete,
    value,
    onChange,
}: {
    icon: LucideIcon;
    label: string;
    type: string;
    name: string;
    autoComplete: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-black text-[#102033]">{label}</label>
            <div className="relative">
                <Icon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#f47b20]" />
                <input
                    type={type}
                    name={name}
                    autoComplete={autoComplete}
                    required
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full rounded-[1.35rem] border border-[#dce5ef] bg-[#f8fafc] py-4 pl-14 pr-4 text-base font-bold text-[#102033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#f47b20] focus:bg-white focus:shadow-xl focus:shadow-orange-500/10"
                />
            </div>
        </div>
    );
}

function ErrorMessage({ error }: { error: string }) {
    if (!error) return null;
    return (
        <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
            {error}
        </div>
    );
}
