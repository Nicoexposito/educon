import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="h-8 w-56 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex">
                        <Loader2 className="h-4 w-4 animate-spin text-[#f47b20]" />
                        Carregant
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
                    ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
                    <div className="grid gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
