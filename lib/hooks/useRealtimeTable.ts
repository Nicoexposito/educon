import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeTableProps<T> {
  table: string;
  initialData?: T[];
  filter?: string;
  enabled?: boolean;
  schema?: string;
  pk?: keyof T; // Primary key for matching updates/deletes, defaults to 'id'
}

export function useRealtimeTable<T extends Record<string, unknown>>({
  table,
  initialData = [],
  filter,
  enabled = true,
  schema = 'public',
  pk = 'id' as keyof T,
}: UseRealtimeTableProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Evitar memory leaks e inicializaciones duplicadas
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!enabled) return;

    const channelName = `realtime:${schema}:${table}${filter ? `:${filter}` : ''}`;

    let isSubscribed = true;

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: schema,
          table: table,
          filter: filter,
        },
        (payload) => {
          if (!isSubscribed) return;

          setData((currentData) => {
            switch (payload.eventType) {
              case 'INSERT':
                // Evitar duplicados si ya está en la lista (por si acaso llegó en initialData justo antes)
                const exists = currentData.some(item => item[pk] === payload.new[pk as string]);
                if (exists) return currentData;
                return [...currentData, payload.new as T];

              case 'UPDATE':
                return currentData.map((item) =>
                  item[pk] === payload.new[pk as string] ? { ...item, ...payload.new } : item
                );

              case 'DELETE':
                return currentData.filter((item) => item[pk] !== payload.old[pk as string]);

              default:
                return currentData;
            }
          });
        }
      )
      .subscribe((status, err) => {
        if (!isSubscribed) return;

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        }

        if (status === 'CLOSED') {
          setIsConnected(false);
        }

        if (status === 'CHANNEL_ERROR') {
          const errorMessage = err?.message || 'Error de canal desconegut (possiblement cal habilitar Realtime o permisos RLS)';
          console.error(`[Realtime ${table}] Error de canal:`, errorMessage, err);
          setIsConnected(false);
          setError(err || new Error(errorMessage));
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe on unmount
    return () => {
      isSubscribed = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter, schema, pk, supabase, enabled]);

  return { data, isConnected: enabled ? isConnected : false, error: enabled ? error : null };
}
