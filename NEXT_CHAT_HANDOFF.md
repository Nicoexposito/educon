# Educon handoff per al proper xat

Context ràpid:
- Projecte: `/Users/uriimarquess/educon`
- App Next.js amb Supabase i Netlify.
- Usuari prefereix no executar `npm run build`, `pnpm run build` ni dev server si no és imprescindible.
- Treballar amb `rg`, `sed`, `git diff --check` i revisions lleugeres està bé.
- No incloure secrets en fitxers ni respostes. Les claus de Gemini/Supabase s'han comentat al xat anterior, però no s'han de copiar aquí.

## Estat actual important

S'està introduint una capa nova de **cursos/classes**:
- Un curs, per exemple `DAW`, agrupa assignatures i alumnes.
- Els alumnes han de veure quin curs o cursos tenen i les assignatures associades.
- Els professors no han d'anar per cursos: continuen treballant per classes/assignatures.
- El supervisor/admin ha de poder crear cursos, assignatures i assignar tutor.
- Quan un curs tingui tutor, s'ha de crear/assignar una assignatura extra de tutoria tipus `TUTORIA XCLASE`.
- Els alumnes del curs també han de tenir aquesta tutoria.

## Canvis ja fets localment

### Migracions Supabase

Existeix la migració local:

`supabase/migrations/20260520002000_add_courses.sql`

Defineix:
- `public.courses`
- `public.course_subjects`
- `public.course_students`
- `public.enrollments.course_id`
- RLS per cursos, assignatures del curs i alumnes del curs.
- Funcions `private.*` amb `security definer` per evitar recursió RLS.
- Índexs necessaris.

També hi ha una migració anterior sense trackejar:

`supabase/migrations/20260520001000_make_auth_user_trigger_idempotent.sql`

### Problema pendent de Supabase MCP

El codi local ja consulta `public.courses`, però al remot encara sortia:

`Could not find the table 'public.courses' in the schema cache`

S'ha intentat usar el MCP de Supabase amb projecte:

`avnprqwrfjauqqevovof`

Però el connector responia:

`Auth required`

Per tant, la migració no s'ha pogut aplicar remotament des de Codex. Quan el MCP estigui autenticat, cal:
1. `list_tables` per comprovar si `courses` existeix.
2. Si no existeix, `apply_migration` amb el contingut de `20260520002000_add_courses.sql`.
3. Verificar `courses`, `course_subjects`, `course_students`.
4. Si PostgREST continua amb cache antiga, recarregar schema cache des de Supabase o esperar uns segons.

### Admin/cursos

Fitxers tocats:
- `app/actions/admin.ts`
- `lib/admin-data.ts`
- `lib/admin-types.ts`
- `components/admin/AdminCoursesClient.tsx`
- `app/dashboard/admin/courses/page.tsx`
- `components/dashboard/shared/Sidebar.tsx`
- `components/admin/AdminHome.tsx`

Funcionalitat actual:
- Nova ruta admin: `/dashboard/admin/courses`
- Sidebar admin té `Cursos`.
- Admin home mostra comptador de cursos i acció `Organitzar cursos`.
- Pantalla de cursos permet crear curs, editar-lo i gestionar assignatures/alumnes amb checks.
- `updateAdminCourseMembership` sincronitza curs -> `course_subjects`, `course_students` i crea matrícules a `enrollments`.
- Les matrícules manuals es respecten: el codi evita convertir manual en curs fent `ignoreDuplicates`.
- En `updateStudentSubjectEnrollments`, quan l'admin assigna assignatures directament a un alumne, només esborra matrícules manuals amb `.is("course_id", null)` per no trencar les de curs.

Nota: es va afegir un avís visible dient que faltava la migració, però l'usuari va demanar treure'l. Ja s'ha tret de `AdminCoursesClient.tsx`. Mantingues-ho fora de la UI.

### Alumne/cursos

Fitxers tocats:
- `lib/data-service.ts`
- `components/student/StudentHome.tsx`
- `app/dashboard/subjects/SubjectsClient.tsx`

Funcionalitat actual:
- Dashboard alumne pot rebre `courses`.
- `StudentHome` mostra `Classe: ...` sota el greeting si hi ha cursos.
- Assignatures de l'alumne s'agrupen pel curs si hi ha `subject.course?.name`.
- Hi ha fallback intern si encara no existeixen les taules de cursos, per no trencar el dashboard antic.

Pendent explícit de l'usuari:
- “Els alumnes, en el header han de saber quin curs estan (poden tenir varios cursos)”
- Això s'ha començat al `StudentHome`, però cal revisar el header global, perquè potser l'usuari parla del header superior compartit, no només del home.

## Altres canvis previs del xat

S'han anat fent canvis abans d'aquest handoff:
- Hero landing amb imatge de fons.
- Sidebar: botó de tancar/fletxa fixat i ajustos perquè no se solapi.
- Footer/sidebar perfil en lloc de logout.
- Evitar doble logo/icon al header.
- IA Gemini per correcció:
  - Correcció individual i global.
  - Selecció d'idioma cat/cas/en pendent o parcial segons fitxers.
  - Comentari per professor i comentari per alumne diferenciats.
  - Nota editable abans d'enviar, no com pill.
  - PDF del bucket: la IA ha de poder llegir URL de PDF del bucket, no dir que no hi té accés si és un fitxer intern.
  - En correcció global ha de sortir nota.
- Llista d'entregues:
  - Selecció múltiple i descàrrega de diverses activitats.
  - Mostrar comentari que l'alumne posa al entregar.
- UI:
  - Arreglat text que sobrepassava al pujar fitxer.
  - Arreglats problemes visuals de sidebar/notificacions.
- Admin users:
  - Crear usuari també a Supabase Auth.
  - Assignar institut automàticament en crear usuari.
  - Reset password.
  - Donar de baixa i tornar a donar d'alta.
  - Supervisor pot assignar assignatures a un alumne amb checks des del modal.

## Petició més nova que queda pendent

Implementar bé el model de curs/tutor/tutoria:

1. El supervisor/admin crea cursos.
2. En crear/editar curs, pot triar tutor.
3. En triar tutor, el sistema crea o manté una assignatura de tutoria:
   - Nom suggerit: `TUTORIA {nom_o_codi_curs}`
   - Professor/tutor: el tutor triat.
   - Institut: el mateix del curs.
   - Categoria: probablement `Tutoria`.
4. La tutoria s'ha d'afegir automàticament a `course_subjects`.
5. Tots els alumnes del curs han d'estar matriculats també a la tutoria via `enrollments`.
6. Els alumnes poden tenir diversos cursos, així que al header/global UI cal mostrar-los de forma compacta:
   - Un curs: `Classe: DAW`
   - Diversos: `Classes: DAW, SMX`
   - En mobile, fer truncate o desplegable, no trencar layout.
7. Professors continuen veient classes/assignatures, no una vista de cursos.

## Implementació recomanada

### Base de dades

Modificar migració de cursos o afegir una nova:
- Afegir `courses.tutor_id uuid references public.users(id) on delete set null`
- Potser `courses.tutoring_subject_id uuid references public.subjects(id) on delete set null`
- Afegir checks/polítiques perquè tutor sigui professor del mateix institut.
- Si es fa via server action, la validació pot quedar a `app/actions/admin.ts`.

### Server actions

Actualitzar:
- `createAdminCourse(formData)`
- `updateAdminCourse(formData)`
- `updateAdminCourseMembership(courseId, subjectIds, studentIds)`

Afegir helper privat:
- `ensureTutoringSubjectForCourse(service, admin, course)`

Comportament:
- Si `tutor_id` existeix:
  - Buscar o crear assignatura `TUTORIA {course.code || course.name}`.
  - Assignar `teacher_id = tutor_id`.
  - Afegir-la a `course_subjects`.
  - Afegir-la a `enrollments` per cada alumne del curs.
- Si canvia el tutor:
  - Actualitzar `teacher_id` de la tutoria.
- Evitar esborrar matrícules manuals.
- Quan es recalculi curs, assegurar que la tutoria segueix inclosa encara que no estigui marcada manualment.

### UI admin cursos

Actualitzar `components/admin/AdminCoursesClient.tsx`:
- Formulari crear curs:
  - `name`
  - `code`
  - `description`
  - selector `Tutor`
- Card editar curs:
  - selector `Tutor`
- Modal de membres:
  - Pot mostrar tutoria com assignatura automàtica, bloquejada o marcada.
  - Millor no deixar desmarcar la tutoria si hi ha tutor.

Actualitzar `getAdminCoursesData()`:
- Retornar llista de professors/tutors actius.
- Retornar `tutor` o `tutor_id`.
- Retornar `tutoring_subject_id`.

### Header alumne

Cal localitzar el header compartit. Cercar:

`rg "Panell|profile|avatar|Header|Topbar|Classe" components app`

Afegir cursos al header si el perfil/data ho permet. Si no, es pot passar des del layout/dashboard data.

## Comprovar sense build

No executar build. Fer:
- `git diff --check`
- `rg "schemaReady|Falta aplicar" components app lib` per assegurar que no torna l'avís visible.
- `rg "courses|course_students|course_subjects|tutor" app components lib supabase`

## Estat git aproximat

Hi ha canvis sense commit en:
- `app/actions/admin.ts`
- `app/dashboard/admin/users/page.tsx`
- `app/dashboard/subjects/SubjectsClient.tsx`
- `components/admin/AdminHome.tsx`
- `components/admin/AdminUsersClient.tsx`
- `components/dashboard/shared/Sidebar.tsx`
- `components/student/StudentHome.tsx`
- `lib/admin-data.ts`
- `lib/admin-types.ts`
- `lib/data-service.ts`

Nous fitxers:
- `app/dashboard/admin/courses/page.tsx`
- `components/admin/AdminCoursesClient.tsx`
- `supabase/migrations/20260520001000_make_auth_user_trigger_idempotent.sql`
- `supabase/migrations/20260520002000_add_courses.sql`
- `NEXT_CHAT_HANDOFF.md`

## Notes de to

L'usuari vol anar ràpid, és directe i prefereix que es facin els canvis sense molta volta. Contestar en català/castellà natural. No discutir massa; si una cosa no es pot fer perquè MCP no està autenticat, dir-ho clar amb l'error exacte.
