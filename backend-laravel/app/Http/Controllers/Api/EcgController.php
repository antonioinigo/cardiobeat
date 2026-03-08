<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EcgController extends Controller
{
    public function storeSession(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::insert(
            'INSERT INTO ecg_sessions (user_id, rhythm, bpm, duration_seconds, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [
                $userId,
                $request->input('rhythm'),
                $request->input('bpm'),
                $request->input('duration_seconds'),
                $request->input('notes'),
            ]
        );

        return response()->json(['message' => 'Sesión guardada'], 201);
    }

    public function sessions(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $rows = DB::select('SELECT * FROM ecg_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [$userId]);
        return response()->json($rows);
    }
}
