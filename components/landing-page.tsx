"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    Users,
    Calendar,
    CheckCircle2,
    FileText,
    BarChart3,
    BellRing,
    ArrowRight,
    School,
    Quote,
    MessageCircle,
    Plus,
    LayoutDashboard,
    BookOpen,
    Settings,
    LogOut
} from "lucide-react";
import { translations, Language } from "@/lib/translations";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Building2, Mail, Lock, ArrowLeft, Loader2, Search } from "lucide-react";
import { searchInstitutes, checkInstituteExists, authenticateUser } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
    const [lang, setLang] = useState<Language>('ca');
    const [activeRole, setActiveRole] = useState<'teacher' | 'student'>('teacher');
    const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
    const t = translations[lang];
    const router = useRouter();


    // Login State
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginStep, setLoginStep] = useState<'institute' | 'credentials'>('institute');
    const [instituteName, setInstituteName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Search State
    const [searchResults, setSearchResults] = useState<{ id: string, name: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasPickedInstitute, setHasPickedInstitute] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (instituteName.length > 0 && loginStep === 'institute' && !hasPickedInstitute) {
                setIsSearching(true);
                const results = await searchInstitutes(instituteName);
                // @ts-ignore
                setSearchResults(results);
                setIsSearching(false);
                setShowSuggestions(true);
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [instituteName, loginStep, hasPickedInstitute]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isLoginOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isLoginOpen]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await authenticateUser(email, password, instituteName);

        if (result.success) {
            router.push('/dashboard');
        } else {
            // @ts-ignore
            setError(t.login_modal.error_creds);
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        const supabase = createClient();

        const { error } = await supabase!.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError('Error en l\'autenticació amb Google.');
            setIsLoading(false);
        }
    };

    const handleInstituteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowSuggestions(false);

        if (instituteName.trim().length === 0) return;

        setIsLoading(true);
        const exists = await checkInstituteExists(instituteName);
        setIsLoading(false);

        if (exists) {
            setLoginStep('credentials');
        } else {
            setError("L'institut no existeix a la base de dades.");
        }
    };

    const features = [
        { icon: <GraduationCap className="h-6 w-6" />, key: 'grades', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        { icon: <CheckCircle2 className="h-6 w-6" />, key: 'attendance', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
        { icon: <Calendar className="h-6 w-6" />, key: 'calendar', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        { icon: <FileText className="h-6 w-6" />, key: 'tasks', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
        { icon: <BellRing className="h-6 w-6" />, key: 'notifications', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
        { icon: <BarChart3 className="h-6 w-6" />, key: 'analytics', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    ];

    const stats = [
        { value: "10k+", label: 'users' },
        { value: "50+", label: 'schools' },
        { value: "99.9%", label: 'uptime' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--accent)]/20">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 transition-transform hover:scale-105">
                                <Image
                                    src="/logo-transparent.png"
                                    alt="Logotip d'Educon"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span
                                className="text-2xl font-bold tracking-tight text-[var(--primary)] dark:text-white"
                                style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                            >
                                Educon
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            {/* Language Switcher */}
                            <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-full p-1.5 border border-zinc-200 dark:border-zinc-700">
                                {(['ca', 'es', 'en'] as Language[]).map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLang(l)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${lang === l
                                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400 scale-105'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                            }`}
                                    >
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800"></div>


                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="bg-[var(--primary)] hover:opacity-90 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-opacity shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                {t.nav.login}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-left z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--primary)] dark:text-[var(--accent)] text-sm font-bold mb-8 border border-[var(--accent)]/20"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            {t.hero.tagline}
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]"
                            style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                        >
                            {t.hero.title.split(' ').map((word, i) => (
                                <span key={i} className="inline-block mr-3">
                                    {i > 1 ? (
                                        <span className="text-[var(--accent)]">
                                            {word}
                                        </span>
                                    ) : word}
                                </span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                        >
                            {t.hero.description}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                            <button className="h-14 px-8 rounded-2xl bg-[var(--primary)] hover:opacity-90 text-white font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                                {t.hero.cta_primary}
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button className="h-14 px-8 rounded-2xl bg-card border border-border hover:bg-secondary text-foreground font-bold text-lg transition-colors duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                                {t.hero.cta_secondary}
                            </button>
                        </motion.div>
                    </div>

                    {/* Hero Visual - 3D Tauler */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                        animate={{ opacity: 1, scale: 1, rotate: -3 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                        className="flex-1 relative z-10 w-full max-w-2xl"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[80px] -z-10" style={{ background: 'var(--accent)', opacity: 0.2 }} aria-hidden="true" />
                        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-[80px] -z-10" style={{ background: 'var(--primary)', opacity: 0.15 }} aria-hidden="true" />

                        {/* Main Tauler Card */}
                        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 z-20 hidden md:block animate-bounce">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-zinc-500">TASCA COMPLETADA</div>
                                        <div className="font-bold text-sm">Matemàtiques: Examen</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-hidden">
                                {/* Header */}
                                <div className="h-8 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                    </div>
                                </div>
                                {/* Body */}
                                <div className="p-6 grid gap-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="h-2 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                                            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                                        ))}
                                    </div>
                                    <div className="h-32 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="border-y border-border bg-card/60 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-3 gap-8 text-center divide-x divide-border">
                        {stats.map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="px-4"
                            >
                                <div
                                    className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-[var(--accent)]"
                                    style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                                >
                                    {stat.value}
                                </div>
                                <div className="text-sm md:text-base text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                                    {/* @ts-ignore */}
                                    {t.stats[stat.label]}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roles Section (LMS Tauler Style) */}
            <section className="py-32 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{t.roles.title}</h2>
                        <div className="flex justify-center p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-fit mx-auto">
                            <button
                                onClick={() => setActiveRole('teacher')}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeRole === 'teacher'
                                    ? 'bg-white dark:bg-zinc-950 shadow-sm text-zinc-900 dark:text-white'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                <span>{t.roles.teacher}</span>
                            </button>
                            <button
                                onClick={() => setActiveRole('student')}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeRole === 'student'
                                    ? 'bg-white dark:bg-zinc-950 shadow-sm text-zinc-900 dark:text-white'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <GraduationCap className="h-4 w-4" />
                                <span>{t.roles.student}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeRole}
                                initial={{ opacity: 0, x: -50, rotateY: 10 }}
                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                exit={{ opacity: 0, x: 50, rotateY: -10 }}
                                transition={{ duration: 0.5, type: 'spring' }}
                                className="perspective-1000"
                            >
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mx-auto max-w-xl lg:max-w-none transform transition-transform hover:scale-[1.02]">
                                    {/* Fake Browser Toolbar */}
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                            <div className="w-3 h-3 rounded-full bg-green-400" />
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-md py-1 px-3 text-xs text-zinc-400 text-center mx-4 font-mono">
                                            app.educon.com/dashboard/{activeRole}
                                        </div>
                                    </div>

                                    {/* Tauler Content */}
                                    <div className="flex h-[400px]">
                                        {/* Sidebar */}
                                        <div className="w-16 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 gap-4">
                                            <div className="p-2 rounded-lg bg-indigo-600 text-white"><School className="h-5 w-5" /></div>
                                            <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
                                            <LayoutDashboard className="h-5 w-5 text-zinc-400" />
                                            <BookOpen className="h-5 w-5 text-zinc-400" />
                                            <Calendar className="h-5 w-5 text-zinc-400" />
                                            <div className="flex-1" />
                                            <Settings className="h-5 w-5 text-zinc-400" />
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 p-6 bg-zinc-50/50 dark:bg-zinc-950">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-xl">{activeRole === 'teacher' ? 'Panell del Professor' : 'Espai de l\'Alumne'}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                                                        <BellRing className="h-4 w-4" />
                                                    </div>
                                                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                    <div className="text-zinc-500 text-xs font-semibold mb-1">
                                                        {activeRole === 'teacher' ? 'ALUMNES ACTIUS' : 'MITJANA ACTUAL'}
                                                    </div>
                                                    <div className="text-2xl font-bold">
                                                        {activeRole === 'teacher' ? '124' : '8.4'}
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                    <div className="text-zinc-500 text-xs font-semibold mb-1">
                                                        {activeRole === 'teacher' ? 'CLASSE SEGÜENT' : 'TASQUES PENDENTS'}
                                                    </div>
                                                    <div className="text-2xl font-bold">
                                                        {activeRole === 'teacher' ? 'MAT 101' : '3'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 shadow-sm p-4 h-32 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50">
                                                <div className="text-center">
                                                    {activeRole === 'teacher' ? (
                                                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                                                            <BarChart3 className="h-8 w-8" />
                                                            <span className="text-xs">Estadístiques d'Assistència</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                                                            <FileText className="h-8 w-8" />
                                                            <span className="text-xs">Lliuraments recents</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeRole}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    <h3 className="text-3xl font-bold leading-tight">
                                        {activeRole === 'teacher' ? t.roles.teacher : t.roles.student}
                                    </h3>
                                    <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-4 border-indigo-500 pl-6">
                                        {activeRole === 'teacher' ? t.roles.teacher_desc : t.roles.student_desc}
                                    </p>

                                    <div className="space-y-4">
                                        {[1, 2, 3].map((_, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                key={i}
                                                className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
                                            >
                                                <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                    {activeRole === 'teacher'
                                                        ? [<CheckCircle2 key="1" />, <BarChart3 key="2" />, <MessageCircle key="3" />][i]
                                                        : [<BarChart3 key="1" />, <Calendar key="2" />, <FileText key="3" />][i]
                                                    }
                                                </div>
                                                <span className="font-semibold text-lg">
                                                    {activeRole === 'teacher'
                                                        ? ["Avaluar alumnes", "Gestió d'assistència", "Comunicació directa"][i]
                                                        : ["Consultar notes", "Veure calendari", "Lliurar tasques"][i]}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Bento Grid (Innovux style) */}
            <section className="py-32 bg-white dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-6 tracking-tight">{t.features.title}</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto text-lg mb-20">
                        Una suite completa d'eines dissenyada per modernitzar cada aspecte de la teva institució educativa.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.key}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all group hover:shadow-2xl hover:-translate-y-1"
                            >
                                <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-3 tracking-tight">
                                    {/* @ts-ignore */}
                                    {t.features[feature.key].title}
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {/* @ts-ignore */}
                                    {t.features[feature.key].desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-32 bg-zinc-50 dark:bg-zinc-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-black text-center mb-16">{t.testimonials.title}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {['director', 'teacher', 'student'].map((role, i) => (
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="bg-white dark:bg-zinc-900 p-8 rounded-3xl relative shadow-lg border border-zinc-100 dark:border-zinc-800"
                            >
                                <Quote className="absolute top-8 right-8 h-10 w-10 text-indigo-100 dark:text-indigo-900/30" />
                                <div className="mb-6 flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-yellow-400">★</span>)}
                                </div>
                                <p className="text-zinc-700 dark:text-zinc-300 mb-8 relative z-10 text-lg font-medium leading-relaxed">
                                    {/* @ts-ignore */}
                                    "{t.testimonials[`desc_${role}`]}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-linear-to-br from-indigo-400 to-violet-400 ring-4 ring-indigo-50 dark:ring-indigo-900/20" />
                                    <div>
                                        <h4 className="font-bold text-base">
                                            {/* @ts-ignore */}
                                            {t.testimonials[`role_${role}`]}
                                        </h4>
                                        <span className="text-sm text-zinc-500">Educon User</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-32 bg-white dark:bg-zinc-950">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-black text-center mb-16">{t.faq.title}</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
                                <button
                                    onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                                    className="flex items-center justify-between w-full p-8 text-left font-bold text-lg"
                                >
                                    {/* @ts-ignore */}
                                    <span>{t.faq[`q${i}`]}</span>
                                    <Plus className={`h-6 w-6 transition-transform duration-300 text-indigo-600 ${activeAccordion === i ? 'rotate-45' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeAccordion === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-8 pt-0 text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
                                                {/* @ts-ignore */}
                                                {t.faq[`a${i}`]}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-zinc-900 dark:bg-white rounded-[3rem] p-12 md:p-24 text-center text-white dark:text-zinc-900 relative overflow-hidden shadow-2xl">
                        {/* Decorative Gradients */}
                        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] opacity-50" />
                        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-violet-500 rounded-full blur-[100px] opacity-50" />

                        <h2 className="text-4xl md:text-7xl font-black mb-8 relative z-10 tracking-tight">{t.cta.title}</h2>
                        <p className="text-zinc-300 dark:text-zinc-600 text-xl md:text-2xl mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">{t.cta.desc}</p>
                        <div className="relative z-10">
                            <button className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-12 py-5 rounded-full text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all shadow-xl">
                                {t.cta.button}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8">
                            <Image src="/logo-transparent.png" alt="Logotip d'Educon" fill className="object-contain" />
                        </div>
                        <span className="font-bold text-xl">Educon</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-500">
                        © {new Date().getFullYear()} Educon. {t.footer.rights}
                    </p>
                </div>
            </footer>


            {/* Login Modal */}
            <AnimatePresence>
                {isLoginOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-11 w-11 rounded-xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
                                            <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain p-1" sizes="44px" />
                                        </div>
                                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                                            Educon
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsLoginOpen(false);
                                            setLoginStep('institute');
                                            setError('');
                                            setInstituteName('');
                                            setEmail('');
                                            setPassword('');
                                        }}
                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                    >
                                        <X className="h-5 w-5 text-zinc-500" />
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {loginStep === 'institute' ? (
                                        <motion.form
                                            key="institute"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleInstituteSubmit}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-2 relative" ref={wrapperRef}>
                                                {/* @ts-ignore */}
                                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">{t.login_modal.institute_label}</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                    <input
                                                        type="text"
                                                        name="organization"
                                                        autoComplete="organization"
                                                        required
                                                        value={instituteName}
                                                        onChange={(e) => {
                                                            setInstituteName(e.target.value);
                                                            setHasPickedInstitute(false);
                                                            setError('');
                                                        }}
                                                        onFocus={() => {
                                                            if (instituteName.length > 0 && !hasPickedInstitute) setShowSuggestions(true);
                                                        }}
                                                        // @ts-ignore
                                                        placeholder={t.login_modal.institute_placeholder}
                                                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-2 transition-all outline-none ${error ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900'}`}
                                                    />
                                                    {isSearching && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Suggestions Dropdown */}
                                                <AnimatePresence>
                                                    {showSuggestions && searchResults.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute w-full z-50 mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-60 overflow-y-auto"
                                                        >
                                                            {searchResults.map((result) => (
                                                                <button
                                                                    key={result.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setInstituteName(result.name);
                                                                        setHasPickedInstitute(true);
                                                                        setSearchResults([]);
                                                                        setShowSuggestions(false);
                                                                        setError('');
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                                                                >
                                                                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                                                        <School className="h-4 w-4" />
                                                                    </div>
                                                                    <span className="font-medium text-sm">{result.name}</span>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="pt-2"
                                                    >
                                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                                            {error}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                {/* @ts-ignore */}
                                                {t.login_modal.next}
                                                <ArrowRight className="h-5 w-5" />
                                            </button>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="credentials"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            onSubmit={handleLogin}
                                            autoComplete="on"
                                            className="space-y-6"
                                        >
                                            <div className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-6">
                                                <Building2 className="h-4 w-4" />
                                                {instituteName}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHasPickedInstitute(false);
                                                        setLoginStep('institute');
                                                    }}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                                                >
                                                    {/* @ts-ignore */}
                                                    {t.login_modal.change_institute}
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    {/* @ts-ignore */}
                                                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">{t.login_modal.email_label}</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            autoComplete="username"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {/* @ts-ignore */}
                                                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 ml-1">{t.login_modal.password_label}</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                        <input
                                                            type="password"
                                                            name="password"
                                                            autoComplete="current-password"
                                                            required
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                                    {error}
                                                </div>
                                            )}

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHasPickedInstitute(false);
                                                        setLoginStep('institute');
                                                    }}
                                                    className="px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <ArrowLeft className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                                >
                                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                        <>
                                                            {/* @ts-ignore */}
                                                            {t.login_modal.login_btn}
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">O</span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleGoogleLogin}
                                                disabled={isLoading}
                                                className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                    <path
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                        fill="#4285F4"
                                                    />
                                                    <path
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                        fill="#34A853"
                                                    />
                                                    <path
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                        fill="#FBBC05"
                                                    />
                                                    <path
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                        fill="#EA4335"
                                                    />
                                                </svg>
                                                {/* @ts-ignore */}
                                                {t.login_modal.google_login}
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
