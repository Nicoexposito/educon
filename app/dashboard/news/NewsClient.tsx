"use client";

import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Newspaper, ChevronRight, User } from "lucide-react";

export function NewsClient({ initialNews }: { initialNews: any[] }) {
    const { data: news } = useRealtimeTable({ table: 'posts', initialData: initialNews });

    const sortedNews = [...news].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
             <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">Notícies i anuncis</h1>
                    <p className="text-zinc-500">Últimes novetats del centre educatiu.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
                {/* Featured / Hero News */}
                {sortedNews.length > 0 && (
                    <div className="group relative h-80 cursor-pointer overflow-hidden rounded-3xl shadow-sm transition-shadow hover:shadow-xl md:col-span-2 md:h-96">
                        <div className="absolute inset-0 bg-zinc-900/40 group-hover:bg-zinc-900/30 transition-colors z-10" />
                        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/90 via-zinc-900/20 to-transparent z-10" />

                        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                           <Newspaper className="w-20 h-20 text-indigo-300 opacity-20" />
                        </div>

                        <div className="absolute bottom-0 left-0 z-20 max-w-3xl p-5 sm:p-8">
                             <div className="flex items-center gap-3 mb-4">
                                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Destacado</span>
                                <span suppressHydrationWarning className="text-zinc-300 text-sm">{formatDate(sortedNews[0].created_at)}</span>
                             </div>
                             <h2 className="mb-4 text-2xl font-bold text-white underline-offset-4 decoration-2 group-hover:underline md:text-4xl">{sortedNews[0].title}</h2>
                             <p className="line-clamp-2 text-base text-zinc-200 md:line-clamp-3 md:text-lg">{sortedNews[0].content}</p>
                        </div>
                    </div>
                )}

                {/* Secondary News Grid */}
                {sortedNews.slice(1).map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group">
                        <div className="flex items-center gap-3 mb-4 text-sm text-zinc-500">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                                    <User className="w-3 h-3 text-zinc-400" />
                                </div>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">Dirección</span>
                             </div>
                             <span>•</span>
                             <span suppressHydrationWarning>{formatDate(item.created_at)}</span>
                        </div>

                        <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-6 flex-1">
                            {item.content}
                        </p>

                        <button className="flex items-center gap-2 text-indigo-600 font-medium text-sm group/btn self-start">
                            Leer más
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ))}

                 {sortedNews.length === 0 && (
                     <div className="col-span-full py-20 text-center text-zinc-500">
                         No hi ha notícies publicades.
                     </div>
                 )}
            </div>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("ca-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(value));
}
