import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { NewsClient } from "./NewsClient";

async function getNews() {
    const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
    return data || [];
}

export default async function NewsPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const news = await getNews();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <NewsClient initialNews={news} />
        </div>
    );
}
