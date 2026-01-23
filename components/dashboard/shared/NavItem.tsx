import React from 'react';

export function NavItem({ icon, label, isOpen, active = false, onClick }: { icon: any, label: string, isOpen: boolean, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
        >
            {icon}
            <span className={`${!isOpen && 'hidden'} whitespace-nowrap`}>{label}</span>
        </button>
    );
}
