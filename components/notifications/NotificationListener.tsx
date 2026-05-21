"use client";

import { useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Aquest component escolta esdeveniments a la taula "notifications"
// i pot disparar un toast o una alerta global a la interf?cie.

export function NotificationListener({ userId }: { userId?: string }) {
    const supabase = useMemo(() => createClient(), []);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!userId) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        let isSubscribed = true;

        const channel = supabase.channel(`realtime:notifications:user_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (!isSubscribed) return;
                    // Aquí en el futur pots afegir lògica per mostrar un toast
                    // toast(payload.new.message)
                    void payload;
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            isSubscribed = false;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId, supabase]);

    // El componente en sí no renderiza nada visible directamente,
    // su propósito es inyectar funcionalidad o mostrar toasts.
    // Si decideixes fer un panell de notificacions flotant, pots usar l'estat `notifications` aquí.
    return null;
}
