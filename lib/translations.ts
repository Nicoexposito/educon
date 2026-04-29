export type Language = 'ca' | 'es' | 'en';

const catalan = {
    nav: {
        about: "Sobre nosaltres",
        features: "Funcionalitats",
        contact: "Contacte",
        login: "Accedir",
    },
    login_modal: {
        institute_label: "Nom de l'institut",
        institute_placeholder: "Ex.: Institut J. Viladoms",
        email_label: "Usuari o correu",
        password_label: "Contrasenya",
        google_login: "Accedir amb Google",
        next: "Següent",
        login_btn: "Entrar",
        back: "Enrere",
        error_creds: "Usuari o contrasenya incorrectes",
        change_institute: "(Canviar)",
    },
    hero: {
        tagline: "Revolucionant la gestió educativa",
        title: "La teva escola, connectada.",
        description: "Educon és la plataforma integral que uneix professors i alumnes. Gestiona notes, assistència i comunicació en un sol lloc. Intuïtiva, ràpida i eficient.",
        cta_primary: "Comença ara",
        cta_secondary: "Saber-ne més",
    },
    stats: {
        users: "Usuaris actius",
        schools: "Centres educatius",
        uptime: "Disponibilitat",
    },
    roles: {
        title: "Una experiència a mida",
        teacher: "Professor",
        student: "Alumne",
        teacher_desc: "Eines per avaluar, passar llista i gestionar el contingut de les assignatures amb facilitat.",
        student_desc: "Segueix el teu progrés acadèmic, consulta el calendari i lliura tasques des de qualsevol lloc.",
    },
    features: {
        title: "Tot el que necessites",
        grades: {
            title: "Notes en temps real",
            desc: "Qualifica i consulta resultats a l'instant.",
        },
        attendance: {
            title: "Control d'assistència",
            desc: "Gestió ràpida de faltes i retards.",
        },
        calendar: {
            title: "Calendari dinàmic",
            desc: "Organització d'esdeveniments i lliuraments.",
        },
        tasks: {
            title: "Lliurament de tasques",
            desc: "Pujada de fitxers i gestió de dates límit.",
        },
        notifications: {
            title: "Notificacions intel·ligents",
            desc: "Avisos automàtics abans de les dates límit.",
        },
        analytics: {
            title: "Gràfiques de rendiment",
            desc: "Visió evolutiva del progrés acadèmic.",
        }
    },
    testimonials: {
        title: "El que diuen de nosaltres",
        role_director: "Director d'escola",
        desc_director: "Educon ha transformat com gestionem el nostre centre. Simple i potent.",
        role_teacher: "Professor de Matemàtiques",
        desc_teacher: "M'estalvia hores de feina cada setmana amb les notes i l'assistència.",
        role_student: "Estudiant de batxillerat",
        desc_student: "M'encanta poder veure les meves notes i tasques al moment.",
    },
    faq: {
        title: "Preguntes freqüents",
        q1: "És compatible amb mòbils?",
        a1: "Sí, Educon és totalment responsiu i funciona en qualsevol dispositiu.",
        q2: "Puc importar dades d'altres sistemes?",
        a2: "Oferim eines de migració per facilitar el canvi des d'altres plataformes.",
        q3: "Hi ha suport tècnic?",
        a3: "Sí, el nostre equip està disponible 24/7 per resoldre qualsevol dubte.",
    },
    cta: {
        title: "Preparat per millorar la teva escola?",
        desc: "Uneix-te avui mateix a la revolució educativa.",
        button: "Comença gratuïtament",
    },
    footer: {
        rights: "Tots els drets reservats.",
    }
};

export const translations = {
    ca: catalan,
    es: catalan,
    en: catalan,
};
