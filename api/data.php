<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$resource = $_GET['resource'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$resources = [
    'eventos' => ['table' => 'eventos', 'fields' => ['titulo','descripcion','fecha','hora','lugar','estado','imagen'], 'public' => true],
    'promociones' => ['table' => 'promociones', 'fields' => ['titulo','descripcion','horario','imagen','estado','fecha_inicio','fecha_fin'], 'public' => true],
    'galeria' => ['table' => 'galeria', 'fields' => ['imagen','descripcion','publicada'], 'public' => true],
    'productos' => ['table' => 'productos', 'fields' => ['categoria_id','nombre','descripcion','precio','imagen','disponible'], 'public' => true],
    'categorias' => ['table' => 'categorias_producto', 'fields' => ['nombre','descripcion','activo'], 'public' => true],
    'reservas' => ['table' => 'reservas', 'fields' => ['usuario_id','nombre_cliente','telefono','fecha','hora','mesa','cantidad_personas','mensaje','estado'], 'public' => false],
    'testimonios' => ['table' => 'testimonios', 'fields' => ['usuario_id','nombre_cliente','correo_cliente','comentario','calificacion','estado'], 'public' => true],
    'usuarios' => ['table' => 'usuarios', 'fields' => ['rol_id','nombre','correo','telefono','foto','ciudad','password_hash','eliminado'], 'public' => false],
];

if (!isset($resources[$resource])) respond(['error' => 'Recurso no válido.'], 404);
$meta = $resources[$resource];
$pdo = database();

function subirImagenGaleria(): string {
    if (empty($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        respond(['error' => 'Selecciona una imagen valida.'], 422);
    }

    $file = $_FILES['imagen'];
    if ($file['size'] > 5 * 1024 * 1024) respond(['error' => 'La imagen supera 5 MB.'], 422);

    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = mime_content_type($file['tmp_name']);
    if (!isset($types[$mime])) respond(['error' => 'Formato no permitido. Usa JPG, PNG o WEBP.'], 422);

    $relativeDir = 'uploads/galeria';
    $dir = __DIR__ . '/../' . $relativeDir;
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $name = 'galeria_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $types[$mime];
    $target = $dir . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        respond(['error' => 'No se pudo guardar la imagen en el servidor.'], 500);
    }

    return $relativeDir . '/' . $name;
}

function eliminarArchivoGaleria(?string $path): void {
    $path = trim((string)$path);
    if ($path === '' || preg_match('#^https?://#i', $path)) return;

    $root = realpath(__DIR__ . '/..');
    $file = realpath(__DIR__ . '/../' . ltrim($path, '/\\'));
    if (!$root || !$file || strpos($file, $root) !== 0 || !is_file($file)) return;

    @unlink($file);
}

function rolId(PDO $pdo, mixed $rol): int {
    if (is_numeric($rol)) return (int)$rol;

    $nombre = strtolower(trim((string)$rol));
    if ($nombre === '') $nombre = 'cliente';
    if ($nombre === 'admin') $nombre = 'administrador';

    $stmt = $pdo->prepare('SELECT id FROM roles WHERE LOWER(nombre) = ? LIMIT 1');
    $stmt->execute([$nombre]);
    $id = $stmt->fetchColumn();
    if ($id) return (int)$id;

    $stmt = $pdo->prepare('SELECT id FROM roles ORDER BY id ASC LIMIT 1');
    $stmt->execute();
    return (int)$stmt->fetchColumn();
}

if ($method === 'GET') {
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$meta['public']) requireAdmin();
    $sql = $resource === 'categorias'
        ? 'SELECT * FROM categorias_producto WHERE activo = 1'
        : "SELECT * FROM {$meta['table']} WHERE eliminado = 0";
    if ($resource === 'productos') $sql = 'SELECT p.*, c.nombre AS categoria FROM productos p JOIN categorias_producto c ON c.id = p.categoria_id WHERE p.eliminado = 0';
    if ($resource === 'reservas') $sql = 'SELECT r.*, u.nombre AS usuario_nombre, u.correo AS usuario_correo FROM reservas r LEFT JOIN usuarios u ON u.id = r.usuario_id WHERE r.eliminado = 0';
    if ($resource === 'galeria') $sql = 'SELECT * FROM galeria WHERE eliminado = 0 AND publicada = 1';
    if ($resource === 'testimonios') $sql = 'SELECT * FROM testimonios WHERE eliminado = 0 AND estado != "oculto"';
    if ($resource === 'usuarios') $sql = 'SELECT u.id, u.rol_id, u.nombre, u.correo, u.telefono, u.foto, u.ciudad, u.eliminado, r.nombre AS rol FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id WHERE u.eliminado = 0';
    if ($id) {
        $idColumn = $resource === 'reservas' ? 'r.id' : ($resource === 'usuarios' ? 'u.id' : 'id');
        $sql .= ' AND ' . $idColumn . ' = ' . (int)$id;
    }
    $orderColumn = $resource === 'reservas' ? 'r.id' : ($resource === 'usuarios' ? 'u.id' : 'id');
    $sql .= ' ORDER BY ' . $orderColumn . ' DESC';
    $stmt = $pdo->query($sql);
    respond(['data' => $id ? $stmt->fetch() : $stmt->fetchAll()]);
}

$data = input();
if ($method === 'POST') {
    if (!in_array($resource, ['reservas','testimonios'], true)) requireAdmin();
    if ($resource === 'testimonios') $data['estado'] = 'pendiente';
    if ($resource === 'galeria') {
        $data = [
            'imagen' => subirImagenGaleria(),
            'descripcion' => '',
            'publicada' => 1,
        ];
    }
    if ($resource === 'reservas') {
        $data['estado'] = $data['estado'] ?? 'pendiente';
        $rol = strtolower((string)($_SESSION['user']['rol'] ?? ''));
        if (!empty($_SESSION['user']['id']) && !in_array($rol, ['admin', 'administrador'], true)) {
            $data['usuario_id'] = (int)$_SESSION['user']['id'];
            $data['nombre_cliente'] = $data['nombre_cliente'] ?? $_SESSION['user']['nombre'];
            $data['telefono'] = $data['telefono'] ?? ($_SESSION['user']['telefono'] ?? '');
        }
    }
    if ($resource === 'usuarios') {
        if (isset($data['rol'])) {
            $data['rol_id'] = rolId($pdo, $data['rol']);
            unset($data['rol']);
        }
        if (!empty($data['password'])) {
            $data['password_hash'] = password_hash((string)$data['password'], PASSWORD_DEFAULT);
            unset($data['password']);
        }
    }
    $allowed = array_intersect_key($data, array_flip($meta['fields']));
    if (!$allowed) respond(['error' => 'No se enviaron datos válidos.'], 422);
    $fields = array_keys($allowed);
    $stmt = $pdo->prepare('INSERT INTO ' . $meta['table'] . ' (' . implode(',', $fields) . ') VALUES (' . implode(',', array_fill(0, count($fields), '?')) . ')');
    $stmt->execute(array_values($allowed));
    respond(['message' => 'Registro creado.', 'id' => (int)$pdo->lastInsertId()], 201);
}

requireAdmin();
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) respond(['error' => 'Falta el id.'], 422);
if ($method === 'PUT') {
    if ($resource === 'usuarios') {
        if (isset($data['rol'])) {
            $data['rol_id'] = rolId($pdo, $data['rol']);
            unset($data['rol']);
        }
        if (!empty($data['password'])) {
            $data['password_hash'] = password_hash((string)$data['password'], PASSWORD_DEFAULT);
        }
        unset($data['password']);
    }
    $allowed = array_intersect_key($data, array_flip($meta['fields']));
    if (!$allowed) respond(['error' => 'No se enviaron datos válidos.'], 422);
    $set = implode(',', array_map(fn($f) => "$f = ?", array_keys($allowed)));
    $stmt = $pdo->prepare("UPDATE {$meta['table']} SET $set WHERE id = ?");
    $stmt->execute([...array_values($allowed), $id]);
    respond(['message' => 'Registro actualizado.']);
}
if ($method === 'DELETE') {
    if ($resource === 'galeria') {
        $stmt = $pdo->prepare('SELECT imagen FROM galeria WHERE id = ?');
        $stmt->execute([$id]);
        $imagen = $stmt->fetchColumn();

        $stmt = $pdo->prepare('DELETE FROM galeria WHERE id = ?');
        $stmt->execute([$id]);
        eliminarArchivoGaleria($imagen ? (string)$imagen : null);
        respond(['message' => 'Imagen eliminada.']);
    }

    $stmt = $pdo->prepare("UPDATE {$meta['table']} SET eliminado = 1 WHERE id = ?");
    $stmt->execute([$id]);
    respond(['message' => 'Registro eliminado.']);
}
respond(['error' => 'Método no permitido.'], 405);
