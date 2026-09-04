<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? '';
$data = input();

function sessionUser(array $user): array
{
    return [
        'id' => (int)$user['id'],
        'nombre' => $user['nombre'],
        'correo' => $user['correo'],
        'telefono' => $user['telefono'] ?? '',
        'ciudad' => $user['ciudad'] ?? '',
        'rol' => $user['rol'],
    ];
}

if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($data['nombre'] ?? '');
    $correo = filter_var($data['correo'] ?? '', FILTER_VALIDATE_EMAIL);
    $telefono = trim($data['telefono'] ?? '');
    $ciudad = trim($data['ciudad'] ?? '');
    $password = $data['password'] ?? '';
    if (!$nombre || !$correo || !$telefono || !$ciudad || strlen($password) < 8) {
        respond(['error' => 'Completa todos los datos y usa una clave de 8 caracteres.'], 422);
    }

    try {
        $pdo = database();
        $stmt = $pdo->prepare('INSERT INTO usuarios (rol_id, nombre, correo, telefono, ciudad, password_hash) VALUES (2, ?, ?, ?, ?, ?)');
        $stmt->execute([$nombre, $correo, $telefono, $ciudad, password_hash($password, PASSWORD_DEFAULT)]);
        $_SESSION['user'] = [
            'id' => (int)$pdo->lastInsertId(),
            'nombre' => $nombre,
            'correo' => $correo,
            'telefono' => $telefono,
            'ciudad' => $ciudad,
            'rol' => 'cliente',
        ];
        respond(['message' => 'Cuenta creada correctamente.', 'user' => $_SESSION['user']], 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            respond(['error' => 'El correo ya esta registrado.'], 409);
        }
        throw $e;
    }
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $correo = filter_var($data['correo'] ?? '', FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? '';
    $pdo = database();
    $stmt = $pdo->prepare('SELECT u.id, u.nombre, u.correo, u.telefono, u.ciudad, u.password_hash, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.correo = ? AND u.eliminado = 0 LIMIT 1');
    $stmt->execute([$correo]);
    $user = $stmt->fetch();
    if (!$user) respond(['error' => 'Correo o contrasena incorrectos.'], 401);

    $passwordOk = password_verify($password, $user['password_hash']);
    if (!$passwordOk && hash_equals((string)$user['password_hash'], (string)$password)) {
        $passwordOk = true;
        $nuevoHash = password_hash($password, PASSWORD_DEFAULT);
        $pdo->prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?')->execute([$nuevoHash, $user['id']]);
    }
    if (!$passwordOk) respond(['error' => 'Correo o contrasena incorrectos.'], 401);

    $_SESSION['user'] = sessionUser($user);
    respond(['user' => $_SESSION['user']]);
}

if ($action === 'check-login') {
    $correo = filter_var($_GET['correo'] ?? '', FILTER_VALIDATE_EMAIL);
    if (!$correo) respond(['ok' => false, 'error' => 'Falta correo valido.'], 422);

    $stmt = database()->prepare('SELECT u.id, u.nombre, u.correo, u.telefono, u.ciudad, u.password_hash, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.correo = ? AND u.eliminado = 0 LIMIT 1');
    $stmt->execute([$correo]);
    $user = $stmt->fetch();
    if (!$user) respond(['ok' => false, 'existe' => false]);

    respond([
        'ok' => true,
        'existe' => true,
        'id' => (int)$user['id'],
        'nombre' => $user['nombre'],
        'correo' => $user['correo'],
        'rol' => $user['rol'],
        'hash_valido' => password_get_info($user['password_hash'])['algo'] !== 0,
        'hash_inicio' => substr((string)$user['password_hash'], 0, 7),
    ]);
}

if ($action === 'me') {
    if (empty($_SESSION['user']['id'])) respond(['user' => null]);

    $stmt = database()->prepare('SELECT u.id, u.nombre, u.correo, u.telefono, u.ciudad, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = ? AND u.eliminado = 0 LIMIT 1');
    $stmt->execute([$_SESSION['user']['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        $_SESSION = [];
        session_destroy();
        respond(['user' => null]);
    }

    $_SESSION['user'] = sessionUser($user);
    respond(['user' => $_SESSION['user']]);
}

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION = [];
    session_destroy();
    respond(['message' => 'Sesion cerrada.']);
}

respond(['error' => 'Accion no encontrada.'], 404);
