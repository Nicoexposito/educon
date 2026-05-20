"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/teacher/DashboardHeader";

export function ClientLayoutWrapper({ children, session, profile }: { children: React.ReactNode, session: any, profile?: any }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-zinc-50 font-sans text-zinc-900 selection:bg-indigo-100 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-indigo-900/30">
            <Sidebar
                role={session.role}
                profile={profile}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            <main className="flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300">
                <DashboardHeader
                    role={session.role}
                    isSidebarOpen={true} // Sidebar is always visible in desktop
                    toggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
                    user={profile}
                />

                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
