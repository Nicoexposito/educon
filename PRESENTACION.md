# Guía de presentación Educon

## Arranque en Docker de producción

```bash
docker compose -f docker-compose.production.yml --env-file .env up --build
```

Abrir:

```txt
http://localhost:3000
```

Si el puerto `3000` está ocupado:

```bash
HOST_PORT=3001 docker compose -f docker-compose.production.yml --env-file .env up --build
```

Y abrir:

```txt
http://localhost:3001
```

Parar:

```bash
docker compose -f docker-compose.production.yml down
```

## Demo recomendada

1. Entrar con un usuario profesor.
2. Enseñar el dashboard:
   - Entrega de trabajos: pendientes de corregir.
   - Horario: clases del día.
   - Asignaturas: materias del profesor.
   - La clase actual: clase activa según el horario.
3. Abrir `Asignaturas`.
   - Mostrar materias separadas por categoría.
   - En cada materia: nombre, horario, número de alumnos y botón `Ver`.
4. Entrar en una materia como profesor.
   - Herramientas del profesor.
   - Entrega de trabajos y creación de uno nuevo.
   - Listado de alumnos.
   - Pasar lista y acceso a listas anteriores.
   - Contenidos y recursos.
5. Entrar con un usuario alumno.
6. Enseñar el dashboard del alumno:
   - Entrega de trabajos: pendientes de entregar.
   - Horario del alumno.
   - Asignaturas del alumno.
   - Clase actual del alumno.
7. Abrir una materia como alumno.
   - Ver datos de la materia.
   - Ver compañeros con correo y teléfono.
   - Ver contenidos.
   - Acceder a entregas de trabajos.

## Frase corta para presentar

Educon centraliza el día a día entre profesor y alumno: horarios, materias, trabajos, entregas, asistencia, contenidos y comunicación, con vistas separadas por rol y datos conectados a Supabase.

## Checklist final

- Build local: `npm run build`.
- Docker producción: `docker compose -f docker-compose.production.yml --env-file .env up --build`.
- GitHub actualizado con el commit final.
- Presentar el SHA del commit final.
