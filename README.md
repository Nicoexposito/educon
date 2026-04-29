# Educon V.0.5.9

Educon es una plataforma educativa para conectar profesores y alumnos en un mismo entorno: clases, tareas, entregas, asistencia, calificaciones, eventos, noticias y notificaciones.

El objetivo es que el día a día académico sea rápido de gestionar para el profesor y claro para el alumno.

## Funcionalidades

- Dashboard diferenciado para profesor y alumno.
- Asignaturas con horario, alumnado, contenidos y herramientas.
- Creación y entrega de tareas.
- Corrección de entregas y publicación de notas.
- Control de asistencia por asignatura y día.
- Vista de asistencias y faltas para alumnos.
- Ventana de calificaciones.
- Eventos, noticias y notificaciones internas.
- Notificaciones por correo configurables desde el perfil.
- Recordatorios automáticos de tareas pendientes antes y después del vencimiento.
- Login por instituto y credenciales.
- Logo e identidad visual integrados en la app y emails.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Realtime
- Supabase Postgres
- Supabase Auth
- Resend para emails
- Lucide React para iconos

## Estructura

```txt
app/
  dashboard/              Rutas principales del panel
  api/email-notifications Procesador de cola de emails
components/
  dashboard/              Componentes compartidos del panel
  teacher/                Vistas y widgets de profesor
  student/                Vistas y widgets de alumno
lib/
  actions.ts              Acciones server-side de tareas, asistencia y notificaciones
  data-service.ts         Lectura de datos reales desde Supabase
  email-service.ts        Procesador de emails con Resend
  supabase/               Clientes Supabase server/client
public/
  logo.png
  logo-transparent.png
  favicon.png
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

RESEND_API_KEY=
EMAIL_FROM=Educon <notificaciones@educon.cat>
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://educon.cat
```

Notas:

- `EMAIL_FROM` debe pertenecer a un dominio verificado en Resend.
- `CRON_SECRET` puede ser cualquier cadena larga y secreta.
- No subas `.env` al repositorio. Ya está ignorado por `.gitignore`.

## Desarrollo

Instala dependencias:

```bash
npm install
```

Arranca el servidor local:

```bash
npm run dev
```

Abre:

```txt
http://localhost:3000
```

Compila producción:

```bash
npm run build
```

## Emails

Educon guarda los correos en una cola dentro de Supabase (`email_notifications`) y los procesa con:

```txt
/api/email-notifications/process
```

El endpoint:

- Encola recordatorios de tareas próximas o vencidas.
- Procesa emails pendientes.
- Envía con Resend.
- Marca emails como `sent`, `pending` o `failed`.

En producción, el endpoint debe llamarse con:

```http
Authorization: Bearer <CRON_SECRET>
```

El archivo `vercel.json` incluye un cron cada 5 minutos para procesar la cola.

## Supabase

Tablas principales:

- `users`
- `institutes`
- `subjects`
- `subject_schedules`
- `enrollments`
- `assignments`
- `submissions`
- `attendance`
- `grade_items`
- `student_grades`
- `events`
- `posts`
- `notifications`
- `email_notifications`

La base usa triggers para crear notificaciones y emails cuando ocurren eventos como:

- Nueva tarea.
- Nueva entrega.
- Nota publicada.
- Falta de asistencia.
- Nuevo evento.
- Nueva noticia.

## Preferencias

Cada usuario puede activar o desactivar desde su perfil:

- Todas las notificaciones por email.
- Entregas realizadas.
- Notas publicadas.
- Faltas de asistencia.
- Tareas nuevas.
- Eventos nuevos.
- Noticias nuevas.
- Recordatorios de tareas próximas.
- Avisos de tareas vencidas.

Las preferencias se guardan en `users.preferences`.

## Branding

Los assets principales están en `public/`:

```txt
logo.png
logo-transparent.png
favicon.png
```

El favicon de Next está en:

```txt
app/icon.png
```

Los emails usan `logo-transparent.png` mediante una URL absoluta basada en `NEXT_PUBLIC_APP_URL`.

## Estado del Proyecto

Educon está en desarrollo activo. La base funcional ya incluye paneles, asignaturas, tareas, asistencia, notas y notificaciones. Las siguientes mejoras naturales son:

- RLS completo en todas las tablas públicas.
- Panel administrativo de instituto.
- Editor avanzado de contenidos.
- Subida real de archivos para recursos de asignatura.
- Métricas académicas más detalladas.

## Comandos Útiles

```bash
npm run dev
npm run build
npm run lint
```

## Licencia

Proyecto privado de Educon.
