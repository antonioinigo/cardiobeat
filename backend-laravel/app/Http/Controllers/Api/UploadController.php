<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function image(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No se recibió ningún archivo'], 400);
        }

        $file = $request->file('file');

        if (!$file->isValid()) {
            return response()->json(['error' => 'Archivo inválido'], 400);
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $allowed = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

        if (!in_array($extension, $allowed, true)) {
            return response()->json(['error' => 'Tipo de archivo no permitido'], 400);
        }

        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = preg_replace('/[^a-z0-9-_\.]+/i', '-', strtolower((string) $baseName));
        $filename = time().'-'.$safeName.'.'.$extension;

        $file->storeAs('public/uploads', $filename);

        return response()->json([
            'message' => 'Archivo subido correctamente',
            'url' => '/uploads/'.$filename,
            'filename' => $filename,
        ], 201);
    }
}
