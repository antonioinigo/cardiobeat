<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class HealthController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'CardioBeat API funcionando correctamente (Laravel)',
            'timestamp' => now()->toISOString(),
        ]);
    }
}
