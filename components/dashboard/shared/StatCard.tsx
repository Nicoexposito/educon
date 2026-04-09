import React from 'react';

export function StatCard({ title, value, trend, trendDown, sub }: {
    title: string;
    value: string;
    trend?: string;
    trendDown?: boolean;
    sub?: string;
}) {
    return (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-xs hover:shadow-sm transition-shadow duration-200 relative overflow-hidden">
            {/* Subtle top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-60 rounded-t-2xl" />

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
            <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                    <div
                        className="text-3xl font-bold text-foreground leading-none tabular-nums"
                        style={{ fontFamily: 'var(--font-display, var(--font-geist-sans))' }}
                    >
                        {value}
                    </div>
                    {sub && <div className="text-sm text-muted-foreground mt-1 truncate">{sub}</div>}
                </div>
                {trend && (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                        trendDown
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    }`}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
