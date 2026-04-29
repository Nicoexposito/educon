"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    User, Mail, School, Shield, Lock, LogOut,
    Camera, Star, BookOpen, TrendingUp, CheckCircle2, Award,
    Eye, EyeOff, Loader2, Check, X, AlertCircle, Bell
} from "lucide-react";
import { changePassword, updateEmailPreferences, updateProfile, logout } from "@/app/actions";

interface ProfileClientProps {
    user: any;
    userId: string;
    stats: {
        avgGrade: string;
        totalSubjects: number;
        submittedAssignments: number;
        pendingAssignments: number;
    };
    recentGrades: Array<{
        subject: string;
        grade: number | null;
        date: string;
        assignmentTitle: string;
    }>;
}

function getGradeStatus(grade: number | null): { label: string; style: string } {
    if (grade === null) return { label: "Pendiente", style: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" };
    if (grade >= 9) return { label: "Excelente", style: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    if (grade >= 7) return { label: "Notable", style: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    if (grade >= 5) return { label: "Aprobado", style: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    return { label: "Suspensa", style: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };
}

export default function ProfileClient({ user, userId, stats, recentGrades }: ProfileClientProps) {
    const router = useRouter();
    const initialEmailPreferences = {
        assignment_submitted: user.preferences?.email?.assignment_submitted ?? true,
        grade_posted: user.preferences?.email?.grade_posted ?? true,
        attendance_absence: user.preferences?.email?.attendance_absence ?? true,
        assignment_created: user.preferences?.email?.assignment_created ?? true,
        event_created: user.preferences?.email?.event_created ?? true,
        news_created: user.preferences?.email?.news_created ?? true,
        assignment_due_soon: user.preferences?.email?.assignment_due_soon ?? true,
        assignment_overdue: user.preferences?.email?.assignment_overdue ?? true,
    };

    // Profile form
    const [fullName, setFullName] = useState(user.full_name || "");
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isPendingProfile, startProfileTransition] = useTransition();
    const [emailNotifications, setEmailNotifications] = useState(user.preferences?.emailNotifications ?? true);
    const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>(initialEmailPreferences);
    const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isPendingEmail, startEmailTransition] = useTransition();

    // Password form
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isPendingPwd, startPwdTransition] = useTransition();

    const handleProfileSave = () => {
        setProfileMsg(null);
        startProfileTransition(async () => {
            const result = await updateProfile(userId, fullName);
            if (result.success) {
                setProfileMsg({ type: "success", text: "Perfil actualizado correctamente." });
                router.refresh();
            } else {
                setProfileMsg({ type: "error", text: result.error || "Error desconocido." });
            }
        });
    };

    const handlePasswordChange = () => {
        setPwdMsg(null);
        if (newPwd !== confirmPwd) {
            setPwdMsg({ type: "error", text: "Las contraseñas no coinciden." });
            return;
        }
        if (newPwd.length < 6) {
            setPwdMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
            return;
        }
        startPwdTransition(async () => {
            const result = await changePassword(userId, currentPwd, newPwd);
            if (result.success) {
                setPwdMsg({ type: "success", text: "Contraseña actualizada correctamente." });
                setCurrentPwd("");
                setNewPwd("");
                setConfirmPwd("");
            } else {
                setPwdMsg({ type: "error", text: result.error || "Error desconocido." });
            }
        });
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const handleEmailPreferenceSave = () => {
        setEmailMsg(null);
        startEmailTransition(async () => {
            const result = await updateEmailPreferences(userId, emailPrefs, emailNotifications);
            if (result.success) {
                setEmailMsg({ type: "success", text: "Preferencias de correo actualizadas." });
                router.refresh();
            } else {
                setEmailMsg({ type: "error", text: result.error || "Error desconocido." });
            }
        });
    };

    const toggleEmailPref = (key: string) => {
        setEmailPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const statCards = [
        { label: "Promedio Global", value: stats.avgGrade, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Asignaturas", value: String(stats.totalSubjects), icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { label: "Trabajos Entregados", value: String(stats.submittedAssignments), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Trabajos Pendientes", value: String(stats.pendingAssignments), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];
    const emailPreferenceItems = [
        { key: "assignment_submitted", label: "Entregas realizadas", description: "Avisar al profesor cuando un alumno entrega una tarea." },
        { key: "grade_posted", label: "Notas publicadas", description: "Avisar al alumno cuando recibe una calificación." },
        { key: "attendance_absence", label: "Faltas de asistencia", description: "Avisar cuando se registra una falta." },
        { key: "assignment_created", label: "Tareas nuevas", description: "Avisar al alumno cuando se publica una tarea." },
        { key: "event_created", label: "Eventos nuevos", description: "Avisar cuando se publica un evento." },
        { key: "news_created", label: "Noticias nuevas", description: "Avisar cuando se publica una noticia." },
        { key: "assignment_due_soon", label: "Tarea termina en 1 hora", description: "Recordatorio si aún no está entregada." },
        { key: "assignment_overdue", label: "Tarea vencida sin entregar", description: "Avisar cuando vence y sigue pendiente." },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 md:p-8 max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Gestiona tu información personal y tus credenciales.</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-rose-600 hover:text-white px-4 py-2 hover:bg-rose-500 rounded-xl transition-all font-medium border border-rose-200 dark:border-rose-900 shadow-sm self-start"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ─── LEFT COLUMN: User Card & Stats ─── */}
                <div className="space-y-6">
                    {/* User Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col items-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize">
                                <Shield className="w-3.5 h-3.5" />
                                {user.role === "teacher" ? "Profesor" : "Alumno"}
                            </span>
                        </div>

                        <div className="relative mt-4 mb-3">
                            <div className="w-28 h-28 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-indigo-500/30 ring-4 ring-white dark:ring-zinc-900 transition-transform group-hover:scale-105">
                                {user.full_name
                                    ? user.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                                    : user.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <button
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-50 dark:border-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm hover:scale-110 transition-all cursor-pointer"
                                title="Cambiar foto de perfil"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold">{user.full_name || "Usuario Educon"}</h2>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                            <School className="w-4 h-4" />
                            <span>{user.institute?.name || "Sin instituto asignado"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{user.email}</span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-5">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            Estadísticas
                        </h3>
                        <div className="space-y-4">
                            {statCards.map((stat, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{stat.label}</span>
                                    </div>
                                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN: Forms & Grades ─── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Personal Data Form */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <User className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold">Datos Personales</h2>
                        </div>

                        {profileMsg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${profileMsg.type === "success"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                }`}>
                                {profileMsg.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                {profileMsg.text}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Tu nombre"
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Email
                                        <span className="ml-2 text-xs text-zinc-400 font-normal">(no editable)</span>
                                    </label>
                                    <div className="relative group/email">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            type="email"
                                            value={user.email || ""}
                                            readOnly
                                            disabled
                                            title="No puedes cambiar tu dirección de correo electrónico."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 cursor-not-allowed outline-none select-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rol</label>
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 capitalize cursor-not-allowed">
                                        <Shield className="w-4 h-4" />
                                        {user.role === "teacher" ? "Profesor" : "Alumno"}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instituto</label>
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 cursor-not-allowed">
                                        <School className="w-4 h-4" />
                                        {user.institute?.name || "No asignado"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleProfileSave}
                                    disabled={isPendingProfile}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                                >
                                    {isPendingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Lock className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-lg font-semibold">Seguridad de la Cuenta</h2>
                        </div>

                        {pwdMsg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${pwdMsg.type === "success"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                }`}>
                                {pwdMsg.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                {pwdMsg.text}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contraseña Actual</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPwd ? "text" : "password"}
                                        value={currentPwd}
                                        onChange={(e) => setCurrentPwd(e.target.value)}
                                        placeholder="Introduce tu contraseña actual"
                                        className="w-full px-4 py-2.5 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                    >
                                        {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPwd ? "text" : "password"}
                                            value={newPwd}
                                            onChange={(e) => setNewPwd(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full px-4 py-2.5 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPwd(!showNewPwd)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmPwd}
                                        onChange={(e) => setConfirmPwd(e.target.value)}
                                        placeholder="Repite la nueva contraseña"
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            {/* Password strength hint */}
                            {newPwd.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${newPwd.length >= 10 ? "w-full bg-emerald-500" :
                                                newPwd.length >= 6 ? "w-2/3 bg-amber-500" :
                                                    "w-1/3 bg-rose-500"
                                                }`}
                                        />
                                    </div>
                                    <span className={`text-xs font-medium ${newPwd.length >= 10 ? "text-emerald-500" :
                                        newPwd.length >= 6 ? "text-amber-500" :
                                            "text-rose-500"
                                        }`}>
                                        {newPwd.length >= 10 ? "Fuerte" : newPwd.length >= 6 ? "Aceptable" : "Débil"}
                                    </span>
                                </div>
                            )}

                            {/* Match indicator */}
                            {confirmPwd.length > 0 && (
                                <div className={`flex items-center gap-2 text-xs font-medium ${newPwd === confirmPwd ? "text-emerald-500" : "text-rose-500"
                                    }`}>
                                    {newPwd === confirmPwd ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                    {newPwd === confirmPwd ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={isPendingPwd || !currentPwd || !newPwd || !confirmPwd}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                                >
                                    {isPendingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    Actualizar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Email notifications */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-indigo-500" />
                                <div>
                                    <h2 className="text-lg font-semibold">Notificaciones por correo</h2>
                                    <p className="text-sm text-zinc-500">Configura qué avisos quieres recibir en tu email.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEmailNotifications((value: boolean) => !value)}
                                className={`relative h-7 w-12 rounded-full transition-colors ${emailNotifications ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
                                aria-pressed={emailNotifications}
                                aria-label="Activar notificaciones por correo"
                            >
                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {emailMsg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${emailMsg.type === "success"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                }`}>
                                {emailMsg.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                {emailMsg.text}
                            </div>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${emailNotifications ? "" : "opacity-50"}`}>
                            {emailPreferenceItems.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    disabled={!emailNotifications}
                                    onClick={() => toggleEmailPref(item.key)}
                                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 p-4 text-left hover:border-indigo-200 dark:hover:border-indigo-800 disabled:cursor-not-allowed"
                                >
                                    <span>
                                        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.label}</span>
                                        <span className="block text-xs text-zinc-500 mt-1 leading-relaxed">{item.description}</span>
                                    </span>
                                    <span className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${emailPrefs[item.key] ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"}`}>
                                        {emailPrefs[item.key] && <Check className="w-3.5 h-3.5" />}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end pt-5">
                            <button
                                onClick={handleEmailPreferenceSave}
                                disabled={isPendingEmail}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                {isPendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Guardar preferencias
                            </button>
                        </div>
                    </div>

                    {/* Grades Table — only for students */}
                    {user.role === "student" && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-indigo-500" />
                                    <h2 className="text-lg font-semibold">Calificaciones Recientes</h2>
                                </div>
                            </div>

                            {recentGrades.length === 0 ? (
                                <div className="text-center py-10 text-zinc-400">
                                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">Sin calificaciones todavía</p>
                                    <p className="text-sm mt-1">Las notas aparecerán aquí cuando tus profesores califiquen tus trabajos.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-sm">
                                                <th className="pb-3 text-zinc-500 font-medium whitespace-nowrap">Asignatura</th>
                                                <th className="pb-3 text-zinc-500 font-medium whitespace-nowrap">Trabajo</th>
                                                <th className="pb-3 text-zinc-500 font-medium whitespace-nowrap">Fecha</th>
                                                <th className="pb-3 text-zinc-500 font-medium whitespace-nowrap px-4 w-28">Estado</th>
                                                <th className="pb-3 text-right text-zinc-500 font-medium whitespace-nowrap">Nota</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentGrades.map((grade, idx) => {
                                                const status = getGradeStatus(grade.grade);
                                                return (
                                                    <tr key={idx} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group/row">
                                                        <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors pr-4">
                                                            {grade.subject}
                                                        </td>
                                                        <td className="py-3 text-sm text-zinc-500 pr-4 max-w-[200px] truncate">
                                                            {grade.assignmentTitle}
                                                        </td>
                                                        <td className="py-3 text-sm text-zinc-500 whitespace-nowrap pr-4">
                                                            {grade.date}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium min-w-[80px] text-center ${status.style}`}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                            {grade.grade !== null ? grade.grade.toFixed(1) : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* For teachers: show pending to grade count */}
                    {user.role === "teacher" && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-semibold">Resumen Académico</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalSubjects}</p>
                                    <p className="text-sm text-zinc-500 mt-1">Asignaturas impartidas</p>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingAssignments}</p>
                                    <p className="text-sm text-zinc-500 mt-1">Trabajos por corregir</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
