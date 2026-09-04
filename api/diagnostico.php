<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$file = __DIR__ . '/../config/database.local.php';
if (!is_file($file)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'paso' => 'archivo', 'error' => 'No se encontró config/database.local.php']);
    exit;
}

try {
    $config = require $file;
    foreach (['host', 'database', 'username', 'password'] as $key) {
        if (!array_key_exists($key, $config) || $config[$key] === '') {
            throw new RuntimeException("Falta completar el campo: $key");
        }
    }
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'paso' => 'configuracion', 'error' => $error->getMessage()]);
    exit;
}

try {
    database()->query('SELECT 1');
    echo json_encode(['ok' => true, 'message' => 'PHP y la conexión a MySQL están funcionando.']);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'paso' => 'mysql',
        'error' => 'MySQL rechazó la conexión. Revisa host, base de datos, usuario y clave.',
        'detalle' => $error->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
