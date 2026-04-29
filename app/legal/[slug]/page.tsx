import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Mail, ShieldCheck } from "lucide-react";

type LegalSlug = "aviso-legal" | "privacidad" | "cookies" | "terminos";

type LegalSection = {
    title: string;
    text: string;
};

type LegalPage = {
    title: string;
    kicker: string;
    summary: string;
    caTitle: string;
    esTitle: string;
    sectionsCa: LegalSection[];
    sectionsEs: LegalSection[];
};

const updatedAt = "29 de abril de 2026";
const updatedAtCa = "29 d'abril de 2026";
const contactEmail = "notificaciones@educon.cat";

const legalPages: Record<LegalSlug, LegalPage> = {
    "aviso-legal": {
        title: "Aviso legal",
        kicker: "Legal",
        summary: "Informacion general sobre Educon, el uso del sitio y sus contenidos.",
        caTitle: "Avís legal",
        esTitle: "Aviso legal",
        sectionsCa: [
            {
                title: "Titularitat",
                text: "Aquest lloc web pertany a Educon, plataforma de gestio academica accessible a educon.cat. Per a comunicacions legals pots escriure a notificaciones@educon.cat.",
            },
            {
                title: "Ús del servei",
                text: "L'acces al panell esta reservat a usuaris autoritzats pel seu centre educatiu. Cada usuari ha de mantenir les seves credencials protegides i utilitzar la plataforma d'acord amb la normativa del centre.",
            },
            {
                title: "Continguts",
                text: "Els textos, logotips, interfícies i elements visuals d'Educon formen part de la identitat del servei. No es permet copiar-los o reutilitzar-los sense autoritzacio.",
            },
            {
                title: "Responsabilitat",
                text: "Educon treballa per mantenir la informacio disponible i actualitzada, pero les dades academiques son responsabilitat del centre i dels usuaris que les introdueixen.",
            },
        ],
        sectionsEs: [
            {
                title: "Titularidad",
                text: "Este sitio web pertenece a Educon, plataforma de gestion academica accesible en educon.cat. Para comunicaciones legales puedes escribir a notificaciones@educon.cat.",
            },
            {
                title: "Uso del servicio",
                text: "El acceso al panel esta reservado a usuarios autorizados por su centro educativo. Cada usuario debe mantener sus credenciales protegidas y utilizar la plataforma de acuerdo con la normativa del centro.",
            },
            {
                title: "Contenidos",
                text: "Los textos, logotipos, interfaces y elementos visuales de Educon forman parte de la identidad del servicio. No se permite copiarlos o reutilizarlos sin autorizacion.",
            },
            {
                title: "Responsabilidad",
                text: "Educon trabaja para mantener la informacion disponible y actualizada, pero los datos academicos son responsabilidad del centro y de los usuarios que los introducen.",
            },
        ],
    },
    privacidad: {
        title: "Privacidad",
        kicker: "Datos",
        summary: "Como tratamos la informacion academica y de usuario dentro de Educon.",
        caTitle: "Privacitat",
        esTitle: "Privacidad",
        sectionsCa: [
            {
                title: "Dades tractades",
                text: "Educon pot tractar nom, correu, rol, institut, assignatures, tasques, entregues, assistencia, qualificacions, avisos i preferencies de notificacio.",
            },
            {
                title: "Finalitat",
                text: "Utilitzem les dades per autenticar usuaris, gestionar l'activitat academica, mostrar el panell, enviar notificacions i mantenir l'historic del centre.",
            },
            {
                title: "Proveidors",
                text: "El servei utilitza proveidors tecnics com Supabase per a base de dades i autenticacio, i Resend per a l'enviament de correus transaccionals.",
            },
            {
                title: "Drets",
                text: "Els usuaris poden sol·licitar acces, rectificacio, eliminacio o limitacio del tractament escrivint a notificaciones@educon.cat o contactant amb el seu centre.",
            },
        ],
        sectionsEs: [
            {
                title: "Datos tratados",
                text: "Educon puede tratar nombre, correo, rol, instituto, asignaturas, tareas, entregas, asistencia, calificaciones, avisos y preferencias de notificacion.",
            },
            {
                title: "Finalidad",
                text: "Usamos los datos para autenticar usuarios, gestionar la actividad academica, mostrar el panel, enviar notificaciones y mantener el historico del centro.",
            },
            {
                title: "Proveedores",
                text: "El servicio utiliza proveedores tecnicos como Supabase para base de datos y autenticacion, y Resend para el envio de correos transaccionales.",
            },
            {
                title: "Derechos",
                text: "Los usuarios pueden solicitar acceso, rectificacion, eliminacion o limitacion del tratamiento escribiendo a notificaciones@educon.cat o contactando con su centro.",
            },
        ],
    },
    cookies: {
        title: "Cookies",
        kicker: "Preferencias",
        summary: "Uso de cookies tecnicas y almacenamiento necesario para que Educon funcione.",
        caTitle: "Cookies",
        esTitle: "Cookies",
        sectionsCa: [
            {
                title: "Cookies necessaries",
                text: "Educon utilitza cookies i emmagatzematge local imprescindibles per mantenir la sessio, recordar preferencies i protegir l'acces al panell.",
            },
            {
                title: "Sense publicitat",
                text: "No fem servir cookies publicitaries per defecte ni venem informacio personal a tercers.",
            },
            {
                title: "Gestio",
                text: "Pots bloquejar o eliminar cookies des de la configuracio del navegador. Si ho fas, algunes funcions d'inici de sessio poden deixar de funcionar.",
            },
        ],
        sectionsEs: [
            {
                title: "Cookies necesarias",
                text: "Educon utiliza cookies y almacenamiento local imprescindibles para mantener la sesion, recordar preferencias y proteger el acceso al panel.",
            },
            {
                title: "Sin publicidad",
                text: "No usamos cookies publicitarias por defecto ni vendemos informacion personal a terceros.",
            },
            {
                title: "Gestion",
                text: "Puedes bloquear o eliminar cookies desde la configuracion del navegador. Si lo haces, algunas funciones de inicio de sesion pueden dejar de funcionar.",
            },
        ],
    },
    terminos: {
        title: "Términos",
        kicker: "Condiciones",
        summary: "Reglas basicas para usar Educon de forma segura dentro del centro.",
        caTitle: "Termes del servei",
        esTitle: "Términos del servicio",
        sectionsCa: [
            {
                title: "Acces autoritzat",
                text: "Només poden utilitzar Educon les persones autoritzades pel centre. Les credencials son personals i no s'han de compartir.",
            },
            {
                title: "Bon ús",
                text: "No es permet publicar continguts il·legals, ofensius, fraudulents o aliens a l'activitat academica del centre.",
            },
            {
                title: "Dades academiques",
                text: "Les tasques, notes, assistencies i comunicacions han de reflectir la informacio real del centre i poden ser revisades pels perfils autoritzats.",
            },
            {
                title: "Disponibilitat",
                text: "Educon pot aplicar millores, manteniment o canvis funcionals per garantir seguretat, rendiment i continuïtat del servei.",
            },
        ],
        sectionsEs: [
            {
                title: "Acceso autorizado",
                text: "Solo pueden utilizar Educon las personas autorizadas por el centro. Las credenciales son personales y no deben compartirse.",
            },
            {
                title: "Buen uso",
                text: "No se permite publicar contenidos ilegales, ofensivos, fraudulentos o ajenos a la actividad academica del centro.",
            },
            {
                title: "Datos academicos",
                text: "Las tareas, notas, asistencias y comunicaciones deben reflejar la informacion real del centro y pueden ser revisadas por los perfiles autorizados.",
            },
            {
                title: "Disponibilidad",
                text: "Educon puede aplicar mejoras, mantenimiento o cambios funcionales para garantizar seguridad, rendimiento y continuidad del servicio.",
            },
        ],
    },
};

export function generateStaticParams() {
    return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const page = legalPages[slug as LegalSlug];

    if (!page) {
        return {
            title: "Legal - Educon",
        };
    }

    return {
        title: `${page.title} - Educon`,
        description: page.summary,
    };
}

export default async function LegalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = legalPages[slug as LegalSlug];

    if (!page) notFound();

    const legalLinks = [
        ["Aviso legal", "/legal/aviso-legal"],
        ["Privacidad", "/legal/privacidad"],
        ["Cookies", "/legal/cookies"],
        ["Términos", "/legal/terminos"],
    ];

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-[#102033]">
            <section className="relative overflow-hidden px-5 pb-20 pt-8 text-white md:px-8 md:pb-24">
                <div className="absolute inset-0 bg-[#071522]" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(244,123,32,0.22)_0%,transparent_38%),linear-gradient(90deg,rgba(7,21,34,1)_0%,rgba(16,41,75,0.9)_100%)]" />

                <div className="relative mx-auto max-w-7xl">
                    <nav className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <span className="relative h-12 w-12 shrink-0">
                                <Image src="/logo-transparent.png" alt="Educon" fill className="object-contain drop-shadow-md" sizes="48px" />
                            </span>
                            <span className="text-2xl font-black tracking-tight">Educon</span>
                        </Link>
                        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-md transition hover:bg-white/16">
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Link>
                    </nav>

                    <div className="grid gap-10 pt-20 lg:grid-cols-[1fr_0.72fr] lg:items-end">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#ffbf77]">{page.kicker}</p>
                            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">{page.title}</h1>
                            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/72">{page.summary}</p>
                        </div>

                        <div className="grid gap-3 border border-white/14 bg-white/10 p-5 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-[#ffbf77]" />
                                <p className="text-sm font-black">Educon legal</p>
                            </div>
                            <p className="text-sm font-semibold text-white/68">Actualizado: {updatedAt}</p>
                            <p className="text-sm font-semibold text-white/68">Actualitzat: {updatedAtCa}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-5 py-16 md:px-8 md:py-20">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[16rem_1fr]">
                    <aside className="h-fit border border-[#dce5ef] bg-white p-5 shadow-sm lg:sticky lg:top-8">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f47b20]">Legal</p>
                        <div className="mt-5 grid gap-2">
                            {legalLinks.map(([label, href]) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center justify-between px-4 py-3 text-sm font-black transition ${
                                        href.endsWith(slug) ? "bg-[#10294b] text-white" : "bg-[#f8fafc] text-[#43546b] hover:text-[#f47b20]"
                                    }`}
                                >
                                    {label}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </aside>

                    <div className="grid gap-8 xl:grid-cols-2">
                        <LegalLanguageBlock label="CA" title={page.caTitle} sections={page.sectionsCa} />
                        <LegalLanguageBlock label="ES" title={page.esTitle} sections={page.sectionsEs} />
                    </div>
                </div>
            </section>

            <section className="px-5 pb-20 md:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-5 border border-[#dce5ef] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-black text-[#10294b]">Contacto legal</p>
                        <p className="mt-1 text-sm font-semibold text-[#64748b]">Per qualsevol dubte legal / Para cualquier duda legal.</p>
                    </div>
                    <a href={`mailto:${contactEmail}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f47b20] px-5 py-3 text-sm font-black text-white transition hover:bg-[#df690e]">
                        <Mail className="h-4 w-4" />
                        {contactEmail}
                    </a>
                </div>
            </section>
        </main>
    );
}

function LegalLanguageBlock({ label, title, sections }: { label: string; title: string; sections: LegalSection[] }) {
    return (
        <article className="border border-[#dce5ef] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f47b20]">{label}</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[#102033]">{title}</h2>
                </div>
                <FileText className="h-6 w-6 text-[#94a3b8]" />
            </div>

            <div className="mt-8 grid gap-5">
                {sections.map((section) => (
                    <section key={section.title} className="border-t border-[#dce5ef] pt-5">
                        <div className="flex gap-3">
                            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#46b980]" />
                            <div>
                                <h3 className="font-black text-[#102033]">{section.title}</h3>
                                <p className="mt-2 text-sm font-semibold leading-7 text-[#64748b]">{section.text}</p>
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </article>
    );
}
