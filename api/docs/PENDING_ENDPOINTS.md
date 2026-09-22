# Pendientes

## Producto (no schema)

1. **Login público de clientas** — schema listo; falta endpoint público.
2. **Endurecer bootstrap del guard** — hoy, rol sin filas en `rol_permisos` permite todo lo autenticado. Mantener hasta que todos los roles productivos tengan matriz. Ver `docs/PERMISSIONS.md`.
3. **Validación de sesión clienta por token** — cuando el frontend clienta lo requiera.

## Permisos

Alineados a los **14 códigos reales** de MariaDB. No insertar permisos nuevos desde la API.
