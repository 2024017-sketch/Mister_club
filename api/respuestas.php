<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = filter_input(INPUT_GET, 'testimonio_id', FILTER_VALIDATE_INT);
    $stmt = database()->prepare('SELECT r.*, u.nombre AS administrador FROM respuestas_testimonio r LEFT JOIN usuarios u ON u.id = r.administrador_id WHERE r.testimonio_id = ? ORDER BY r.created_at ASC');
    $stmt->execute([$id]);
    respond(['data' => $stmt->fetchAll()]);
}

$admin = requireAdmin();
$data = input();
$testimonio = (int)($data['testimonio_id'] ?? 0);
$respuesta = trim($data['respuesta'] ?? '');
if (!$testimonio || !$respuesta) respond(['error' => 'Faltan datos para responder.'], 422);
$pdo = database();
$stmt = $pdo->prepare('INSERT INTO respuestas_testimonio (testimonio_id, administrador_id, respuesta) VALUES (?, ?, ?)');
$stmt->execute([$testimonio, $admin['id'], $respuesta]);
$pdo->prepare('UPDATE testimonios SET estado = "respondido" WHERE id = ?')->execute([$testimonio]);
respond(['message' => 'Respuesta enviada.'], 201);
