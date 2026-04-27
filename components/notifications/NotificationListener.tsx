"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Este componente escucha eventos en la tabla "notifications"
// y puede disparar un toast o un alert global en la interfaz.

export function NotificationListener({ userId }: { userId?: string }) {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<any[]>([]);
    const channelRef = useRef<any>(null);

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
                    console.log("[Notification] Nueva notificación recibida:", payload.new);
                    // Aquí en el futuro puedes agregar lógica para mostrar un Toast
                    // toast(payload.new.message)
                    setNotifications((prev) => [...prev, payload.new]);
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
    // Si decides hacer un panel de notificaciones flotante, puedes usar el estado `notifications` aquí.
    return null;
}
