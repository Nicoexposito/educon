import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIPlaceholderProps {
    label?: string;
    description?: string;
    onClick?: () => void;
}

export function AIPlaceholder({ label = "Assistent IA", description, onClick }: AIPlaceholderProps) {
    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden rounded-xl bg-linear-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 p-4 cursor-pointer hover:border-violet-500/40 transition-all"
        >
            <div className="absolute top-0 right-0 p-2 opacity-50">
                 <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                     <h3 className="font-bold text-violet-700 dark:text-violet-300 text-sm">{label}</h3>
                     {description && <p className="text-xs text-violet-600/70 dark:text-violet-400/70">{description}</p>}
                </div>
            </div>
        </div>
    );
}
