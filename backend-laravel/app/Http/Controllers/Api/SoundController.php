<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SoundController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type');
        $focusId = $request->query('focus_id');

        $query = 'SELECT hs.*, cf.name as focus_name, cf.abbreviation as focus_abbr FROM heart_sounds hs LEFT JOIN cardiac_focus cf ON hs.focus_id = cf.id WHERE 1=1';
        $params = [];

        if ($type) {
            $query .= ' AND hs.sound_type = ?';
            $params[] = $type;
        }

        if ($focusId) {
            $query .= ' AND hs.focus_id = ?';
            $params[] = $focusId;
        }

        $query .= ' ORDER BY hs.created_at DESC';

        return response()->json(DB::select($query, $params));
    }

    public function search(string $term)
    {
        $search = '%'.$term.'%';
        $sounds = DB::select(
            'SELECT hs.*, cf.name as focus_name FROM heart_sounds hs LEFT JOIN cardiac_focus cf ON hs.focus_id = cf.id WHERE hs.title LIKE ? OR hs.pathology LIKE ? OR hs.description LIKE ? ORDER BY hs.title',
            [$search, $search, $search]
        );

        return response()->json($sounds);
    }

    public function show(int $id)
    {
        $sounds = DB::select(
            'SELECT hs.*, cf.name as focus_name, cf.abbreviation as focus_abbr, cf.description as focus_description FROM heart_sounds hs LEFT JOIN cardiac_focus cf ON hs.focus_id = cf.id WHERE hs.id = ? LIMIT 1',
            [$id]
        );

        if (empty($sounds)) {
            return response()->json(['error' => 'Sonido no encontrado'], 404);
        }

        return response()->json($sounds[0]);
    }
}
