<?php

function sendSuccess($data = null, $message = "Berhasil", $statusCode = 200){
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $data,
        'message' => $message
        
    ]);
    exit;
}

function sendError($errors = null, $message = "Terjadi kesalahan", $statusCode = 400){
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors' => $errors
    ]);
    exit;
}

function getJsonInput() {
    $data = json_decode(file_get_contents('php://input'), true);
    if($data === null && json_last_error() !== JSON_ERROR_NONE) {
        sendError(null, "Invalid JSON input", 400);
    }
    return $data;
}