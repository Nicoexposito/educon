import LandingPage from "@/components/landing-page";
import { redirect } from "next/navigation";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {};
  const code = getSingleParam(params.code);

  if (code) {
    const callbackParams = new URLSearchParams({ code });
    const next = getSingleParam(params.next);

    if (next) {
      callbackParams.set("next", next);
    }

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return <LandingPage />;
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}
