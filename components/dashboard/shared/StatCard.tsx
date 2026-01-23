import React from 'react';

export function StatCard({ title, value, trend, trendDown, sub }: { title: string, value: string, trend?: string, trendDown?: boolean, sub?: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full opacity-50" />

            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 relative z-10">{title}</h3>
            <div className="flex items-end justify-between relative z-10">
                <div>
                    <div className="text-3xl font-bold mb-1">{value}</div>
                    {sub && <div className="text-sm text-zinc-500">{sub}</div>}
                </div>
                {trend && (
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${trendDown ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}
