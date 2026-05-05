import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewsClient } from "./NewsClient";

async function getNews(userId: string, role: string) {
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('users')
        .select('institute_id')
        .eq('id', userId)
        .single();

    if (!profile?.institute_id) return [];

    const audiences = role === 'teacher'
        ? ['all', 'teachers']
        : role === 'student'
            ? ['all', 'students']
            : ['all', 'teachers', 'students'];

    const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('institute_id', profile.institute_id)
        .in('audience', audiences)
        .order('created_at', { ascending: false });
    return data || [];
}

export default async function NewsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const news = await getNews(session.userId as string, session.role as string);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <NewsClient initialNews={news} />
        </div>
    );
}
