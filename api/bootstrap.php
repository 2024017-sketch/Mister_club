<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

set_exception_handler(function (Throwable $error): void {
    error_log('Mister Club API: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'La conexión del servidor no está configurada. Revisa config/database.local.php.'], JSON_UNESCAPED_UNICODE);
    exit;
});

require_once __DIR__ . '/../config/database.php';

function input(): array {
    $raw = file_get_contents('php://input');
    $json = $raw ? json_decode($raw, true) : null;
    return is_array($json) ? $json : $_POST;
}

function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireLogin(): array {
    if (empty($_SESSION['user'])) respond(['error' => 'Debes iniciar sesión.'], 401);
    return $_SESSION['user'];
}

function requireAdmin(): array {
    $user = requireLogin();
    if (($user['rol'] ?? '') !== 'administrador') respond(['error' => 'Sin permiso de administrador.'], 403);
    return $user;
}
