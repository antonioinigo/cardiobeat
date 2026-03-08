<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'CardioBeat Laravel backend activo',
    ]);
});

Route::get('/audios/{file}', function (string $file): BinaryFileResponse {
    $safeFile = basename($file);
    $path = base_path('audios/'.$safeFile);

    abort_unless(File::exists($path), 404);

    return response()->file($path);
})->where('file', '.*');

Route::get('/uploads/{file}', function (string $file): BinaryFileResponse {
    $safeFile = basename($file);
    $path = base_path('storage/app/public/uploads/'.$safeFile);

    abort_unless(File::exists($path), 404);

    return response()->file($path);
})->where('file', '.*');
