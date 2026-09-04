# Conexión PHP y MySQL

1. Sube el proyecto completo a `public_html`.
2. Copia `config/database.local.php.example` como `config/database.local.php`.
3. Completa en ese archivo el usuario y la clave MySQL. No lo publiques ni lo subas a Git.
4. Confirma que PHP 8.1+ y las extensiones `pdo` y `pdo_mysql` estén habilitadas.

Antes de probar login, abre `api/diagnostico.php`. Debe responder con `"ok":true`.

## Rutas creadas

- `api/auth.php?action=register` — crear cuenta.
- `api/auth.php?action=login` — iniciar sesión.
- `api/auth.php?action=logout` — cerrar sesión.
- `api/auth.php?action=me` — usuario actual.
- `api/data.php?resource=eventos|productos|promociones|galeria|reservas|testimonios` — listar y gestionar datos.
- `api/respuestas.php` — responder testimonios desde admin.
- `api/upload.php` — subir imágenes de admin.

Las peticiones de administración requieren una sesión con rol `administrador`.
