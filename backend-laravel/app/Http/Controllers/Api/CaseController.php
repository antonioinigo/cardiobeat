<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaseController extends Controller
{
    private const ALLOWED_ROLES = ['admin', 'professional'];

    private const ALLOWED_DIFFICULTIES = ['básico', 'intermedio', 'avanzado'];

    private const ALLOWED_GENDERS = ['M', 'F', 'Otro'];

    public function index(Request $request)
    {
        $difficulty = $request->query('difficulty');

        $query = 'SELECT cc.*, hs.title as sound_title, hs.audio_file FROM clinical_cases cc LEFT JOIN heart_sounds hs ON cc.sound_id = hs.id WHERE 1=1';
        $params = [];

        if ($difficulty) {
            $query .= ' AND cc.difficulty = ?';
            $params[] = $difficulty;
        }

        $query .= ' ORDER BY cc.created_at DESC';

        return response()->json(DB::select($query, $params));
    }

    public function show(int $id)
    {
        $cases = DB::select(
            'SELECT cc.*, hs.title as sound_title, hs.audio_file, hs.description as sound_description, cf.name as focus_name FROM clinical_cases cc LEFT JOIN heart_sounds hs ON cc.sound_id = hs.id LEFT JOIN cardiac_focus cf ON hs.focus_id = cf.id WHERE cc.id = ? LIMIT 1',
            [$id]
        );

        if (empty($cases)) {
            return response()->json(['error' => 'Caso no encontrado'], 404);
        }

        return response()->json($cases[0]);
    }

    public function store(Request $request)
    {
        $role = (string) $request->attributes->get('auth_role', 'student');
        if (!in_array($role, self::ALLOWED_ROLES, true)) {
            return response()->json(['error' => 'No tienes permiso para crear casos'], 403);
        }

        $title = trim((string) $request->input('title', ''));
        if ($title === '') {
            return response()->json(['error' => 'El título es obligatorio'], 400);
        }

        $difficulty = trim((string) $request->input('difficulty', 'básico'));
        if (!in_array($difficulty, self::ALLOWED_DIFFICULTIES, true)) {
            return response()->json(['error' => 'Dificultad inválida'], 400);
        }

        $patientGender = $request->input('patient_gender');
        if ($patientGender !== null && !in_array((string) $patientGender, self::ALLOWED_GENDERS, true)) {
            return response()->json(['error' => 'Género de paciente inválido'], 400);
        }

        $patientAge = $request->input('patient_age');
        if ($patientAge !== null && (!is_numeric($patientAge) || (int) $patientAge < 0 || (int) $patientAge > 120)) {
            return response()->json(['error' => 'Edad de paciente inválida'], 400);
        }

        $soundId = $request->input('sound_id');
        if ($soundId !== null && $soundId !== '' && !is_numeric($soundId)) {
            return response()->json(['error' => 'sound_id inválido'], 400);
        }

        DB::insert(
            'INSERT INTO clinical_cases (title, description, patient_age, patient_gender, symptoms, diagnosis, sound_id, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $title,
                $request->input('description'),
                $patientAge !== null && $patientAge !== '' ? (int) $patientAge : null,
                $patientGender !== null && $patientGender !== '' ? (string) $patientGender : null,
                $request->input('symptoms'),
                $request->input('diagnosis'),
                $soundId !== null && $soundId !== '' ? (int) $soundId : null,
                $difficulty,
            ]
        );

        $id = (int) DB::getPdo()->lastInsertId();

        return $this->show($id);
    }

    public function update(Request $request, int $id)
    {
        $role = (string) $request->attributes->get('auth_role', 'student');
        if (!in_array($role, self::ALLOWED_ROLES, true)) {
            return response()->json(['error' => 'No tienes permiso para editar casos'], 403);
        }

        $existing = DB::select('SELECT id FROM clinical_cases WHERE id = ? LIMIT 1', [$id]);
        if (empty($existing)) {
            return response()->json(['error' => 'Caso no encontrado'], 404);
        }

        $title = trim((string) $request->input('title', ''));
        if ($title === '') {
            return response()->json(['error' => 'El título es obligatorio'], 400);
        }

        $difficulty = trim((string) $request->input('difficulty', 'básico'));
        if (!in_array($difficulty, self::ALLOWED_DIFFICULTIES, true)) {
            return response()->json(['error' => 'Dificultad inválida'], 400);
        }

        $patientGender = $request->input('patient_gender');
        if ($patientGender !== null && !in_array((string) $patientGender, self::ALLOWED_GENDERS, true)) {
            return response()->json(['error' => 'Género de paciente inválido'], 400);
        }

        $patientAge = $request->input('patient_age');
        if ($patientAge !== null && (!is_numeric($patientAge) || (int) $patientAge < 0 || (int) $patientAge > 120)) {
            return response()->json(['error' => 'Edad de paciente inválida'], 400);
        }

        $soundId = $request->input('sound_id');
        if ($soundId !== null && $soundId !== '' && !is_numeric($soundId)) {
            return response()->json(['error' => 'sound_id inválido'], 400);
        }

        DB::update(
            'UPDATE clinical_cases SET title = ?, description = ?, patient_age = ?, patient_gender = ?, symptoms = ?, diagnosis = ?, sound_id = ?, difficulty = ? WHERE id = ?',
            [
                $title,
                $request->input('description'),
                $patientAge !== null && $patientAge !== '' ? (int) $patientAge : null,
                $patientGender !== null && $patientGender !== '' ? (string) $patientGender : null,
                $request->input('symptoms'),
                $request->input('diagnosis'),
                $soundId !== null && $soundId !== '' ? (int) $soundId : null,
                $difficulty,
                $id,
            ]
        );

        return response()->json(['message' => 'Caso actualizado correctamente']);
    }

    public function destroy(Request $request, int $id)
    {
        $role = (string) $request->attributes->get('auth_role', 'student');
        if (!in_array($role, self::ALLOWED_ROLES, true)) {
            return response()->json(['error' => 'No tienes permiso para eliminar casos'], 403);
        }

        $existing = DB::select('SELECT id FROM clinical_cases WHERE id = ? LIMIT 1', [$id]);
        if (empty($existing)) {
            return response()->json(['error' => 'Caso no encontrado'], 404);
        }

        DB::delete('DELETE FROM clinical_cases WHERE id = ?', [$id]);

        return response()->json(['message' => 'Caso eliminado correctamente']);
    }

    public function storeAttempt(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $score = $request->input('score');
        $feedback = $request->input('feedback');

        DB::insert(
            'INSERT INTO case_attempts (user_id, case_id, score, feedback, completed_at) VALUES (?, ?, ?, ?, NOW())',
            [$userId, $id, $score, $feedback]
        );

        return response()->json([
            'id' => (int) DB::getPdo()->lastInsertId(),
            'message' => 'Intento guardado',
        ], 201);
    }
}
