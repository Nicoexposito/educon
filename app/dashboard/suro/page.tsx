import { getSession } from "@/lib/session";
import { getSuroData } from "@/lib/data-service";
import { redirect } from "next/navigation";
import { SuroClient } from "./SuroClient";

export default async function SuroPage() {
    const session = await getSession();

    if (!session) {
        redirect("/");
    }

    if (session.role === "admin") {
        redirect("/dashboard/admin");
    }

    const data = await getSuroData(session.userId as string, session.role as string);

    return <SuroClient data={data} role={session.role as "teacher" | "student"} />;
}
