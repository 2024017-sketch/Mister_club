<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
requireAdmin();

if (empty($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) respond(['error' => 'No se recibió una imagen válida.'], 422);
$file = $_FILES['imagen'];
if ($file['size'] > 5 * 1024 * 1024) respond(['error' => 'La imagen supera 5 MB.'], 422);
$types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$mime = mime_content_type($file['tmp_name']);
if (!isset($types[$mime])) respond(['error' => 'Formato no permitido.'], 422);
$dir = __DIR__ . '/../uploads/' . date('Y/m');
if (!is_dir($dir)) mkdir($dir, 0755, true);
$name = bin2hex(random_bytes(16)) . '.' . $types[$mime];
move_uploaded_file($file['tmp_name'], "$dir/$name");
respond(['path' => 'uploads/' . date('Y/m') . '/' . $name], 201);
