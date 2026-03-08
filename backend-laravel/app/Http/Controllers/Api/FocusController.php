<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class FocusController extends Controller
{
    public function index()
    {
        $focus = DB::select('SELECT cf.*, COUNT(DISTINCT hs.id) as sound_count FROM cardiac_focus cf LEFT JOIN heart_sounds hs ON cf.id = hs.focus_id GROUP BY cf.id ORDER BY cf.id');
        return response()->json($focus);
    }

    public function show(int $id)
    {
        $focus = DB::select('SELECT * FROM cardiac_focus WHERE id = ? LIMIT 1', [$id]);

        if (empty($focus)) {
            return response()->json(['error' => 'Foco no encontrado'], 404);
        }

        $sounds = DB::select('SELECT * FROM heart_sounds WHERE focus_id = ?', [$id]);

        return response()->json(array_merge((array) $focus[0], ['sounds' => $sounds]));
    }
}
