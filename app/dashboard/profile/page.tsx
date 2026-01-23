import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { User, Mail, School, Shield, Bell, Lock, LogOut } from "lucide-react";
import { logout } from "@/app/actions";

async function getUserProfile(userId: string) {
    const { data } = await supabase
        .from('users')
        .select('*, institute:institutes(name)')
        .eq('id', userId)
        .single();
    return data;
}

export default async function ProfilePage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const user = await getUserProfile(session.userId as string);

    if (!user) return <div>Usuario no encontrado</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Configuración de Cuenta</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Navigation (Mock) */}
                <div className="space-y-2">
                     <button className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 font-medium text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                        <User className="w-4 h-4" />
                        Perfil
                     </button>
                     <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-3 transition-colors">
                        <Bell className="w-4 h-4" />
                        Notificaciones
                     </button>
                     <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-3 transition-colors">
                        <Shield className="w-4 h-4" />
                        Seguridad
                     </button>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {/* Public Profile Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6">Información Personal</h2>
                        
                        <div className="flex items-start gap-6 mb-8">
                            <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/30">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <button className="text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                                    Cambiar Avatar
                                </button>
                                <p className="text-xs text-zinc-400 mt-2">JPG, GIF o PNG. Max 2MB.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rol</label>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 capitalize">
                                        <Shield className="w-4 h-4" />
                                        {user.role}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Instituto</label>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                                        <School className="w-4 h-4" />
                                        {user.institute?.name || "No asignado"}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Contraseña y Autenticación</h2>
                            <Lock className="w-5 h-5 text-zinc-400" />
                        </div>
                        <p className="text-sm text-zinc-500 mb-6">Gestiona tu acceso y seguridad.</p>
                        
                        <button className="w-full py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                            Cambiar Contraseña
                        </button>
                    </div>

                    <div className="flex justify-end pt-4">
                         <form action={async () => {
                             "use server";
                             await logout();
                             redirect('/');
                         }}>
                            <button className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                         </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
