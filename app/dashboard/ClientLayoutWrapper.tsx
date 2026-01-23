"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/teacher/DashboardHeader";

export function ClientLayoutWrapper({ children, session, profile }: { children: React.ReactNode, session: any, profile?: any }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans text-zinc-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
            <Sidebar 
                role={session.role} 
                isMobileOpen={isMobileOpen} 
                setIsMobileOpen={setIsMobileOpen} 
            />
            
            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <DashboardHeader 
                    role={session.role} 
                    isSidebarOpen={true} // Sidebar is always visible in desktop
                    toggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
                    user={profile}
                />
                
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
