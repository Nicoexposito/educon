"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Bell,
    BookOpen,
    Building2,
    CalendarDays,
    Check,
    ClipboardCheck,
    FileText,
    GraduationCap,
    Loader2,
    Lock,
    Mail,
    School,
    ShieldCheck,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";
import { authenticateUser, checkInstituteExists, searchInstitutes } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

type Lang = "ca" | "es";
type InstituteOption = { id: string; name: string };
type SavedInstitute = { id?: string; name: string; savedAt: number };

const savedInstituteStorageKey = "educon:last-institute";

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
            eyebrow: "Plataforma acadèmica per a centres educatius",
            title: "Educon",
            lead: "Gestió acadèmica clara per a horaris, tasques, assistència, notes i comunicacions del centre.",
            primary: "Accedir al centre",
            secondary: "Veure el sistema",
        },
        accessStrip: [
            ["01", "Institut", "Accés per centre"],
            ["02", "Rol", "Professorat i alumnat"],
            ["03", "Dades", "Informació real"],
        ],
        sections: {
            productTitle: "Un panell directe per al dia a dia.",
            productText: "Sense pantalles decoratives. Només el que cal veure, fer i comunicar.",
            modulesTitle: "Mòduls essencials",
            rolesTitle: "Cada rol veu el que necessita",
            rhythmTitle: "Del matí a la darrera notificació",
            mediaTitle: "Un entorn visual més net",
            ctaTitle: "Accés al teu centre",
            ctaText: "Tria l'institut i entra amb el teu usuari.",
        },
        modules: [
            ["Horari", "Classes actuals i properes."],
            ["Treballs", "Entregues pendents i correccions."],
            ["Assistència", "Llistes del dia i històric."],
            ["Assignatures", "Alumnes, materials i anuncis."],
            ["Notes", "Qualificacions i feedback."],
            ["Avisos", "Notificacions i correu."],
        ],
        roles: {
            teacher: {
                title: "Professorat",
                text: "Preparar classe, passar llista, publicar treballs i corregir sense sortir del mateix espai.",
                items: ["Classe actual", "Treballs per corregir", "Continguts de l'assignatura"],
            },
            student: {
                title: "Alumnat",
                text: "Veure què toca avui, entregar tasques, consultar notes i entendre l'assistència per classe.",
                items: ["Tasques pendents", "Horari personal", "Assistència i notes"],
            },
        },
        rhythm: [
            ["08:00", "Horari del dia"],
            ["Classe", "Passar llista"],
            ["Entrega", "Treballs i materials"],
            ["Avisos", "Notificacions configurables"],
        ],
        media: [
            ["Aula", "La informació important al davant."],
            ["Equip", "Professorat i alumnat connectats."],
            ["Centre", "Comunicacions ordenades."],
        ],
        login: {
            title: "Accés al centre",
            intro: "Primer selecciona l'institut. Després inicia sessió amb el teu compte.",
            instituteLabel: "Nom de l'institut",
            institutePlaceholder: "Escriu el teu centre",
            next: "Continuar",
            emailLabel: "Correu electrònic",
            passwordLabel: "Contrasenya",
            loginButton: "Entrar al panell",
            google: "Entrar amb Google",
            change: "Canviar",
            savedInstitute: "Darrer centre",
            useSavedInstitute: "Utilitzar aquest centre",
            forgetSavedInstitute: "Oblidar",
            invalidInstitute: "Aquest institut no existeix a la base de dades.",
            invalidCredentials: "Usuari o contrasenya incorrectes.",
            googleError: "Error en l'autenticació amb Google.",
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
        footer: "Plataforma acadèmica per a centres educatius.",
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
            eyebrow: "Plataforma académica para centros educativos",
            title: "Educon",
            lead: "Gestión académica clara para horarios, tareas, asistencia, notas y comunicaciones del centro.",
            primary: "Acceder al centro",
            secondary: "Ver el sistema",
        },
        accessStrip: [
            ["01", "Instituto", "Acceso por centro"],
            ["02", "Rol", "Profesorado y alumnado"],
            ["03", "Datos", "Información real"],
        ],
        sections: {
            productTitle: "Un panel directo para el día a día.",
            productText: "Sin pantallas decorativas. Solo lo que hay que ver, hacer y comunicar.",
            modulesTitle: "Módulos esenciales",
            rolesTitle: "Cada rol ve lo que necesita",
            rhythmTitle: "De la mañana a la última notificación",
            mediaTitle: "Un entorno visual más limpio",
            ctaTitle: "Acceso a tu centro",
            ctaText: "Elige el instituto y entra con tu usuario.",
        },
        modules: [
            ["Horario", "Clases actuales y próximas."],
            ["Trabajos", "Entregas pendientes y correcciones."],
            ["Asistencia", "Listas del día e histórico."],
            ["Asignaturas", "Alumnos, materiales y anuncios."],
            ["Notas", "Calificaciones y feedback."],
            ["Avisos", "Notificaciones y correo."],
        ],
        roles: {
            teacher: {
                title: "Profesorado",
                text: "Preparar clase, pasar lista, publicar trabajos y corregir sin salir del mismo espacio.",
                items: ["Clase actual", "Trabajos por corregir", "Contenidos de la asignatura"],
            },
            student: {
                title: "Alumnado",
                text: "Ver qué toca hoy, entregar tareas, consultar notas y entender la asistencia por clase.",
                items: ["Tareas pendientes", "Horario personal", "Asistencia y notas"],
            },
        },
        rhythm: [
            ["08:00", "Horario del día"],
            ["Clase", "Pasar lista"],
            ["Entrega", "Trabajos y materiales"],
            ["Avisos", "Notificaciones configurables"],
        ],
        media: [
            ["Aula", "La información importante delante."],
            ["Equipo", "Profesorado y alumnado conectados."],
            ["Centro", "Comunicaciones ordenadas."],
        ],
        login: {
            title: "Acceso al centro",
            intro: "Primero selecciona el instituto. Después inicia sesión con tu cuenta.",
            instituteLabel: "Nombre del instituto",
            institutePlaceholder: "Escribe tu centro",
            next: "Continuar",
            emailLabel: "Correo electrónico",
            passwordLabel: "Contraseña",
            loginButton: "Entrar al panel",
            google: "Entrar con Google",
            change: "Cambiar",
            savedInstitute: "Último centro",
            useSavedInstitute: "Usar este centro",
            forgetSavedInstitute: "Olvidar",
            invalidInstitute: "Este instituto no existe en la base de datos.",
            invalidCredentials: "Usuario o contraseña incorrectos.",
            googleError: "Error en la autenticación con Google.",
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
        footer: "Plataforma académica para centros educativos.",
    },
} as const;

type LandingCopy = (typeof copy)[Lang];

const photos = {
    teacher: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1600&q=82",
    student: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=82",
    classroom: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=82",
    corridor: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=82",
    desk: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=82",
    access: "https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?auto=format&fit=crop&w=1600&q=82",
};

const moduleIcons = [CalendarDays, FileText, ClipboardCheck, BookOpen, GraduationCap, Bell] satisfies LucideIcon[];
const currentYear = 2026;

function readSavedInstitute(): SavedInstitute | null {
    if (typeof window === "undefined") return null;

    try {
        const rawValue = window.localStorage.getItem(savedInstituteStorageKey);
        if (!rawValue) return null;

        const parsed = JSON.parse(rawValue) as Partial<SavedInstitute>;
        if (!parsed.name || typeof parsed.name !== "string") return null;

        return {
            id: typeof parsed.id === "string" ? parsed.id : undefined,
            name: parsed.name,
            savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
        };
    } catch {
        return null;
    }
}

function writeSavedInstitute(institute: SavedInstitute) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(savedInstituteStorageKey, JSON.stringify(institute));
}

function removeSavedInstitute() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(savedInstituteStorageKey);
}

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
    const [searchResults, setSearchResults] = useState<InstituteOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasPickedInstitute, setHasPickedInstitute] = useState(false);
    const [savedInstitute, setSavedInstitute] = useState<SavedInstitute | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchCacheRef = useRef(new Map<string, InstituteOption[]>());
    const searchRequestRef = useRef(0);
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
        const storedInstitute = readSavedInstitute();
        if (storedInstitute) {
            setSavedInstitute(storedInstitute);
            setInstituteName(storedInstitute.name);
            setHasPickedInstitute(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoginOpen) return;

        const storedInstitute = readSavedInstitute();
        setSavedInstitute(storedInstitute);

        if (storedInstitute && instituteName.trim().length === 0) {
            setInstituteName(storedInstitute.name);
            setHasPickedInstitute(true);
            setSearchResults([]);
            setShowSuggestions(false);
        }
    }, [isLoginOpen]);

    useEffect(() => {
        const query = instituteName.trim();
        const requestId = searchRequestRef.current + 1;
        searchRequestRef.current = requestId;

        if (loginStep !== "institute" || hasPickedInstitute || query.length < 2) {
            setIsSearching(false);
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        const cacheKey = query.toLocaleLowerCase("ca");
        const cachedResults = searchCacheRef.current.get(cacheKey);
        if (cachedResults) {
            setSearchResults(cachedResults);
            setShowSuggestions(cachedResults.length > 0);
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchInstitutes(query);
                const nextResults = results as InstituteOption[];

                if (searchRequestRef.current === requestId) {
                    searchCacheRef.current.set(cacheKey, nextResults);
                    setSearchResults(nextResults);
                    setShowSuggestions(nextResults.length > 0);
                }
            } finally {
                if (searchRequestRef.current === requestId) {
                    setIsSearching(false);
                }
            }
        }, 320);

        return () => clearTimeout(timer);
    }, [instituteName, loginStep, hasPickedInstitute]);

    useEffect(() => {
        document.body.style.overflow = isLoginOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isLoginOpen]);

    useEffect(() => {
        const updateHeader = () => setIsScrolled(window.scrollY > 32);
        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });
        return () => window.removeEventListener("scroll", updateHeader);
    }, []);

    const rememberInstitute = (institute: Pick<InstituteOption, "name"> & Partial<Pick<InstituteOption, "id">>) => {
        const nextInstitute = {
            id: institute.id,
            name: institute.name.trim(),
            savedAt: Date.now(),
        };

        if (!nextInstitute.name) return;

        writeSavedInstitute(nextInstitute);
        setSavedInstitute(nextInstitute);
    };

    const forgetSavedInstitute = () => {
        removeSavedInstitute();
        setSavedInstitute(null);

        if (savedInstitute?.name === instituteName) {
            setInstituteName("");
            setHasPickedInstitute(false);
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const useSavedInstitute = () => {
        if (!savedInstitute) return;

        setInstituteName(savedInstitute.name);
        setHasPickedInstitute(true);
        setSearchResults([]);
        setShowSuggestions(false);
        setError("");
    };

    const selectInstitute = (institute: InstituteOption) => {
        setInstituteName(institute.name);
        setHasPickedInstitute(true);
        setSearchResults([]);
        setShowSuggestions(false);
        setError("");
        rememberInstitute(institute);
    };

    const resetLogin = () => {
        setIsLoginOpen(false);
        setLoginStep("institute");
        setError("");
        setInstituteName("");
        setEmail("");
        setPassword("");
        setSearchResults([]);
        setShowSuggestions(false);
        setHasPickedInstitute(false);
    };

    const handleInstituteSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setShowSuggestions(false);

        const cleanInstituteName = instituteName.trim();
        if (cleanInstituteName.length === 0) return;

        setIsLoading(true);
        const exists = await checkInstituteExists(cleanInstituteName);
        setIsLoading(false);

        if (exists) {
            setInstituteName(cleanInstituteName);
            setHasPickedInstitute(true);
            rememberInstitute({ name: cleanInstituteName });
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
            rememberInstitute({ name: instituteName });
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
        <div className="min-h-screen bg-[#f6f4ee] text-[#141a22] selection:bg-[#d89a3d]/25">
            <header
                className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
                    isScrolled
                        ? "border-[#e2ddd2] bg-[#fbfaf7]/95 text-[#141a22] shadow-sm backdrop-blur-xl"
                        : "border-white/15 bg-transparent text-white"
                }`}
            >
                <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 md:px-8">
                    <a href="#top" className="flex items-center gap-3" aria-label="Educon">
                        <span className="relative h-10 w-10 shrink-0">
                            <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-sm" priority sizes="40px" />
                        </span>
                        <span className="text-xl font-semibold tracking-tight">Educon</span>
                    </a>

                    <nav className={`hidden items-center gap-8 text-sm font-semibold md:flex ${isScrolled ? "text-[#596171]" : "text-white/75"}`}>
                        <a href="#product" className="transition hover:text-current">{t.nav.product}</a>
                        <a href="#teachers" className="transition hover:text-current">{t.nav.teachers}</a>
                        <a href="#students" className="transition hover:text-current">{t.nav.students}</a>
                        <a href="#modules" className="transition hover:text-current">{t.nav.modules}</a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className={`flex rounded-md border p-0.5 ${isScrolled ? "border-[#e2ddd2] bg-white" : "border-white/20 bg-white/10"}`}>
                            {(["ca", "es"] as Lang[]).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setLang(item)}
                                    className={`rounded px-2.5 py-1.5 text-xs font-bold transition ${
                                        lang === item
                                            ? isScrolled
                                                ? "bg-[#101b2d] text-white"
                                                : "bg-white text-[#101b2d]"
                                            : isScrolled
                                                ? "text-[#6d7480] hover:text-[#141a22]"
                                                : "text-white/70 hover:text-white"
                                    }`}
                                >
                                    {item.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLoginOpen(true)}
                            className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition ${
                                isScrolled
                                    ? "bg-[#101b2d] text-white hover:bg-[#1b2b45]"
                                    : "bg-white text-[#101b2d] hover:bg-[#f2eee6]"
                            }`}
                        >
                            {t.nav.login}
                        </button>
                    </div>
                </div>
            </header>

            <main id="top">
                <section className="relative min-h-[92svh] overflow-hidden bg-[#101b2d] px-5 pt-28 text-white md:px-8 md:pt-32">
                    <div
                        className="absolute inset-0 bg-[#c9c5bb]"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(16,27,45,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,27,45,0.08) 1px, transparent 1px)",
                            backgroundSize: "48px 48px",
                        }}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-[#101b2d]/34" />
                    <div className="absolute inset-y-0 left-0 w-full bg-[#101b2d]/48 md:w-[70%] lg:w-[58%]" />
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#101b2d]/50 to-transparent" />
                    <div className="relative mx-auto flex min-h-[calc(92svh-8rem)] max-w-7xl flex-col justify-end pb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="max-w-4xl pb-10 lg:pr-16"
                        >
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e7bb7d]">{t.hero.eyebrow}</p>
                            <h1 className="mt-5 text-6xl font-semibold leading-none tracking-tight md:text-8xl lg:text-9xl">{t.hero.title}</h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 md:text-xl">{t.hero.lead}</p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setIsLoginOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#d89a3d] px-5 py-3.5 text-sm font-bold text-[#101b2d] transition hover:bg-[#e4ad5b]"
                                >
                                    {t.hero.primary}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <a
                                    href="#product"
                                    className="inline-flex items-center justify-center rounded-md border border-white/25 px-5 py-3.5 text-sm font-bold text-white transition hover:border-white/45 hover:bg-white/10"
                                >
                                    {t.hero.secondary}
                                </a>
                            </div>
                        </motion.div>

                        <div className="grid border-t border-white/20 md:grid-cols-3">
                            {t.accessStrip.map(([number, title, text]) => (
                                <div key={number} className="border-b border-white/15 py-5 md:border-b-0 md:border-r md:px-6 first:md:pl-0 last:md:border-r-0">
                                    <p className="text-xs font-bold text-[#e7bb7d]">{number}</p>
                                    <h2 className="mt-2 text-lg font-semibold">{title}</h2>
                                    <p className="mt-1 text-sm text-white/62">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="product" className="px-5 py-20 md:px-8 md:py-28">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeader
                            label="Educon"
                            title={t.sections.productTitle}
                            text={t.sections.productText}
                        />

                        <div id="modules" className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[#e2ddd2] bg-[#e2ddd2] md:grid-cols-2 lg:grid-cols-3">
                            {t.modules.map(([title, text], index) => {
                                const Icon = moduleIcons[index] ?? ShieldCheck;
                                return <ModuleCard key={title} icon={Icon} title={title} text={text} index={index + 1} />;
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-[#fbfaf7] px-5 py-20 md:px-8 md:py-28">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeader label={lang === "ca" ? "Rols" : "Roles"} title={t.sections.rolesTitle} />
                        <div className="mt-12 grid gap-6 lg:grid-cols-2">
                            <RolePanel
                                id="teachers"
                                title={t.roles.teacher.title}
                                text={t.roles.teacher.text}
                                items={t.roles.teacher.items}
                                photo={photos.teacher}
                                icon={Users}
                            />
                            <RolePanel
                                id="students"
                                title={t.roles.student.title}
                                text={t.roles.student.text}
                                items={t.roles.student.items}
                                photo={photos.student}
                                icon={GraduationCap}
                            />
                        </div>
                    </div>
                </section>

                <section className="px-5 py-20 md:px-8 md:py-28">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                        <div
                            className="min-h-[420px] rounded-lg bg-[#101b2d]"
                            style={{ backgroundImage: `url(${photos.classroom})`, backgroundPosition: "center", backgroundSize: "cover" }}
                            aria-hidden="true"
                        />
                        <div>
                            <SectionHeader label={lang === "ca" ? "Ritme" : "Ritmo"} title={t.sections.rhythmTitle} />
                            <div className="mt-10 divide-y divide-[#e2ddd2] border-y border-[#e2ddd2]">
                                {t.rhythm.map(([time, text], index) => (
                                    <div key={`${time}-${text}`} className="grid grid-cols-[5rem_1fr] gap-5 py-5 sm:grid-cols-[7rem_1fr]">
                                        <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#9d7a4d]">
                                            {String(index + 1).padStart(2, "0")} / {time}
                                        </span>
                                        <p className="text-lg font-semibold text-[#141a22]">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#101b2d] px-5 py-20 text-white md:px-8 md:py-28">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e7bb7d]">Visual</p>
                                <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">{t.sections.mediaTitle}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLoginOpen(true)}
                                className="inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-[#101b2d] transition hover:bg-[#f2eee6]"
                            >
                                {t.hero.primary}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-12 grid gap-4 md:grid-cols-3">
                            {[photos.desk, photos.corridor, photos.access].map((photo, index) => (
                                <PhotoTile
                                    key={photo}
                                    photo={photo}
                                    title={t.media[index][0]}
                                    text={t.media[index][1]}
                                    tall={index === 1}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-5 py-20 md:px-8 md:py-24">
                    <div className="mx-auto grid max-w-7xl gap-8 border-y border-[#d8d1c4] py-12 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9d7a4d]">Educon</p>
                            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#141a22] md:text-6xl">{t.sections.ctaTitle}</h2>
                            <p className="mt-4 max-w-xl text-base leading-7 text-[#697282]">{t.sections.ctaText}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLoginOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#101b2d] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#1b2b45]"
                        >
                            {t.hero.primary}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#e2ddd2] bg-[#fbfaf7] px-5 py-10 md:px-8">
                <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr]">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3">
                            <span className="relative h-10 w-10 shrink-0">
                                <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain" sizes="40px" />
                            </span>
                            <span className="text-xl font-semibold tracking-tight text-[#101b2d]">Educon</span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-[#697282]">{t.footer}</p>
                        <p className="mt-6 text-xs font-semibold text-[#8b8173]">© {currentYear} Educon. {t.footerLinks.copyright}</p>
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
                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#101b2d]">{t.footerLinks.contact}</h3>
                        <a href={`mailto:${t.footerLinks.email}`} className="mt-4 block text-sm font-semibold text-[#697282] transition hover:text-[#101b2d]">
                            {t.footerLinks.email}
                        </a>
                        <button
                            type="button"
                            onClick={() => setIsLoginOpen(true)}
                            className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#d8d1c4] px-4 py-2.5 text-sm font-bold text-[#101b2d] transition hover:bg-white"
                        >
                            {t.footerLinks.access}
                            <ArrowRight className="h-4 w-4" />
                        </button>
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
                savedInstitute={savedInstitute}
                hasPickedInstitute={hasPickedInstitute}
                setHasPickedInstitute={setHasPickedInstitute}
                onUseSavedInstitute={useSavedInstitute}
                onForgetSavedInstitute={forgetSavedInstitute}
                onSelectInstitute={selectInstitute}
                wrapperRef={wrapperRef}
                handleInstituteSubmit={handleInstituteSubmit}
                handleLogin={handleLogin}
                handleGoogleLogin={handleGoogleLogin}
            />
        </div>
    );
}

function SectionHeader({ label, title, text }: { label: string; title: string; text?: string }) {
    return (
        <div className="grid gap-4 md:grid-cols-[0.92fr_1fr] md:items-end">
            <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9d7a4d]">{label}</p>
                <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#141a22] md:text-6xl">{title}</h2>
            </div>
            {text && <p className="max-w-xl text-base leading-7 text-[#697282] md:justify-self-end">{text}</p>}
        </div>
    );
}

function ModuleCard({ icon: Icon, title, text, index }: { icon: LucideIcon; title: string; text: string; index: number }) {
    return (
        <article className="bg-[#fbfaf7] p-6 transition hover:bg-white">
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#101b2d] text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs font-bold text-[#b2a798]">{String(index).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[#141a22]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#697282]">{text}</p>
        </article>
    );
}

function RolePanel({
    id,
    title,
    text,
    items,
    photo,
    icon: Icon,
}: {
    id: string;
    title: string;
    text: string;
    items: readonly string[];
    photo: string;
    icon: LucideIcon;
}) {
    return (
        <article id={id} className="overflow-hidden rounded-lg border border-[#e2ddd2] bg-white">
            <div
                className="relative min-h-72 bg-[#101b2d]"
                style={{ backgroundImage: `url(${photo})`, backgroundPosition: "center", backgroundSize: "cover" }}
            >
                <div className="absolute inset-0 bg-[#101b2d]/38" />
            </div>
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f4eadb] text-[#9d6a2d]">
                        <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-3xl font-semibold tracking-tight text-[#141a22]">{title}</h3>
                </div>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#697282]">{text}</p>
                <div className="mt-7 grid gap-3">
                    {items.map((item) => (
                        <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#141a22]">
                            <Check className="h-4 w-4 text-[#9d7a4d]" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </article>
    );
}

function PhotoTile({ photo, title, text, tall }: { photo: string; title: string; text: string; tall?: boolean }) {
    return (
        <article className={`overflow-hidden rounded-lg border border-white/10 bg-white/5 ${tall ? "md:translate-y-8" : ""}`}>
            <div
                className="min-h-72 bg-white/10"
                style={{ backgroundImage: `url(${photo})`, backgroundPosition: "center", backgroundSize: "cover" }}
            />
            <div className="p-5">
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/64">{text}</p>
            </div>
        </article>
    );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#101b2d]">{title}</h3>
            <div className="mt-4 grid gap-3">
                {links.map(([label, href]) => (
                    <Link key={`${label}-${href}`} href={href} className="text-sm font-semibold text-[#697282] transition hover:text-[#101b2d]">
                        {label}
                    </Link>
                ))}
            </div>
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
    searchResults: InstituteOption[];
    showSuggestions: boolean;
    setShowSuggestions: (value: boolean) => void;
    savedInstitute: SavedInstitute | null;
    hasPickedInstitute: boolean;
    setHasPickedInstitute: (value: boolean) => void;
    onUseSavedInstitute: () => void;
    onForgetSavedInstitute: () => void;
    onSelectInstitute: (institute: InstituteOption) => void;
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
        savedInstitute,
        hasPickedInstitute,
        setHasPickedInstitute,
        onUseSavedInstitute,
        onForgetSavedInstitute,
        onSelectInstitute,
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
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#101b2d]/78 p-3 backdrop-blur-md md:p-6"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 18 }}
                        transition={{ duration: 0.22 }}
                        className="relative my-auto grid max-h-[94svh] w-full max-w-5xl overflow-hidden rounded-lg bg-[#fbfaf7] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]"
                    >
                        <div
                            className="relative hidden min-h-[620px] bg-[#101b2d] lg:block"
                            style={{ backgroundImage: `url(${photos.access})`, backgroundPosition: "center", backgroundSize: "cover" }}
                        >
                            <div className="absolute inset-0 bg-[#101b2d]/52" />
                            <div className="absolute inset-x-8 bottom-8 text-white">
                                <div className="flex items-center gap-3">
                                    <span className="relative h-11 w-11 shrink-0">
                                        <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain" sizes="44px" />
                                    </span>
                                    <span className="text-2xl font-semibold tracking-tight">Educon</span>
                                </div>
                                <p className="mt-6 max-w-sm text-sm font-medium leading-6 text-white/72">{t.hero.lead}</p>
                            </div>
                        </div>

                        <div className="min-h-0 overflow-y-auto p-5 md:p-8">
                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-6 flex items-center gap-3 lg:hidden">
                                        <span className="relative h-10 w-10 shrink-0">
                                            <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain" sizes="40px" />
                                        </span>
                                        <span className="text-xl font-semibold tracking-tight text-[#101b2d]">Educon</span>
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9d7a4d]">{t.nav.login}</p>
                                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#141a22]">{t.login.title}</h2>
                                    <p className="mt-3 max-w-md text-sm leading-6 text-[#697282]">{t.login.intro}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetLogin}
                                    aria-label="Cerrar"
                                    className="rounded-md border border-[#e2ddd2] bg-white p-2.5 text-[#697282] transition hover:text-[#141a22]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-8 grid grid-cols-2 rounded-lg border border-[#e2ddd2] bg-white p-1">
                                <div className={`rounded-md px-3 py-2 text-center text-xs font-bold ${loginStep === "institute" ? "bg-[#101b2d] text-white" : "text-[#697282]"}`}>
                                    01 {t.login.instituteLabel}
                                </div>
                                <div className={`rounded-md px-3 py-2 text-center text-xs font-bold ${loginStep === "credentials" ? "bg-[#101b2d] text-white" : "text-[#697282]"}`}>
                                    02 {t.login.emailLabel}
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {loginStep === "institute" ? (
                                    <motion.form
                                        key="institute"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        onSubmit={handleInstituteSubmit}
                                        className="space-y-5"
                                    >
                                        <div className="relative space-y-2" ref={wrapperRef}>
                                            <label className="text-sm font-bold text-[#141a22]">{t.login.instituteLabel}</label>
                                            {savedInstitute && (
                                                <div className="flex flex-col gap-3 rounded-md border border-[#e2ddd2] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={onUseSavedInstitute}
                                                        className="flex min-w-0 items-center gap-3 text-left"
                                                    >
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f4eadb] text-[#9d7a4d]">
                                                            <School className="h-4 w-4" />
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[#9d7a4d]">{t.login.savedInstitute}</span>
                                                            <span className="block truncate text-sm font-semibold text-[#141a22]">{savedInstitute.name}</span>
                                                        </span>
                                                    </button>
                                                    <div className="flex shrink-0 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={onUseSavedInstitute}
                                                            className="rounded-md bg-[#101b2d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1b2b45]"
                                                        >
                                                            {t.login.useSavedInstitute}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={onForgetSavedInstitute}
                                                            className="rounded-md border border-[#d8d1c4] px-3 py-2 text-xs font-bold text-[#697282] transition hover:bg-[#f6f4ee] hover:text-[#141a22]"
                                                        >
                                                            {t.login.forgetSavedInstitute}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9d7a4d]" />
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
                                                        if (instituteName.length > 0 && !hasPickedInstitute) setShowSuggestions(true);
                                                    }}
                                                    placeholder={t.login.institutePlaceholder}
                                                    className="w-full rounded-md border border-[#d8d1c4] bg-white py-3.5 pl-12 pr-12 text-base font-semibold text-[#141a22] outline-none transition placeholder:text-[#a5a09a] focus:border-[#9d7a4d] focus:ring-4 focus:ring-[#d89a3d]/15"
                                                />
                                                {isSearching && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#9d7a4d]" />}
                                            </div>

                                            {showSuggestions && searchResults.length > 0 && (
                                                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-[#e2ddd2] bg-white p-2 shadow-xl">
                                                    {searchResults.map((result) => (
                                                        <button
                                                            key={result.id}
                                                            type="button"
                                                            onClick={() => {
                                                                onSelectInstitute(result);
                                                            }}
                                                            className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-[#141a22] transition hover:bg-[#f6f4ee]"
                                                        >
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f4eadb] text-[#9d7a4d]">
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
                                            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#101b2d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#1b2b45] disabled:opacity-60"
                                        >
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.login.next}
                                            {!isLoading && <ArrowRight className="h-4 w-4" />}
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        key="credentials"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        onSubmit={handleLogin}
                                        autoComplete="on"
                                        className="space-y-5"
                                    >
                                        <div className="flex items-center justify-between gap-3 rounded-md border border-[#e2ddd2] bg-white px-4 py-3 text-sm font-semibold text-[#596171]">
                                            <span className="flex min-w-0 items-center gap-2">
                                                <Building2 className="h-4 w-4 shrink-0 text-[#9d7a4d]" />
                                                <span className="truncate">{instituteName}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHasPickedInstitute(false);
                                                    setLoginStep("institute");
                                                }}
                                                className="rounded-md bg-[#f6f4ee] px-3 py-1.5 text-xs font-bold text-[#101b2d] transition hover:bg-[#eee8dd]"
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
                                                className="rounded-md border border-[#d8d1c4] bg-white px-4 text-[#101b2d] transition hover:bg-[#f6f4ee]"
                                                aria-label={t.login.change}
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#101b2d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#1b2b45] disabled:opacity-60"
                                            >
                                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.login.loginButton}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGoogleLogin}
                                            disabled={isLoading}
                                            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white px-5 py-3.5 text-sm font-bold text-[#101b2d] transition hover:bg-[#f6f4ee] disabled:opacity-60"
                                        >
                                            <GraduationCap className="h-4 w-4 text-[#9d7a4d]" />
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
            <label className="text-sm font-bold text-[#141a22]">{label}</label>
            <div className="relative">
                <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9d7a4d]" />
                <input
                    type={type}
                    name={name}
                    autoComplete={autoComplete}
                    required
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full rounded-md border border-[#d8d1c4] bg-white py-3.5 pl-12 pr-4 text-base font-semibold text-[#141a22] outline-none transition placeholder:text-[#a5a09a] focus:border-[#9d7a4d] focus:ring-4 focus:ring-[#d89a3d]/15"
                />
            </div>
        </div>
    );
}

function ErrorMessage({ error }: { error: string }) {
    if (!error) return null;
    return (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
            {error}
        </div>
    );
}
