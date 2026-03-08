<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SmartCase;
use App\Models\User;

class SmartCaseController extends Controller
{
    private function normalizeText(string $value): string
    {
        return mb_strtolower(trim($value));
    }

    public function index()
    {
        // Se añade paginación y Eager Loading real en vez de JOIN crudo.
        $rows = SmartCase::with(['author:id,name,role'])
            ->where('status', 'published')
            ->orderByRaw('COALESCE(published_at, created_at) DESC')
            ->paginate(50);

        return response()->json($rows->items());
    }

    public function mine(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $rows = SmartCase::where('created_by', $userId)
            ->orderBy('updated_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($rows);
    }

    public function saved(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $rows = DB::select(
            'SELECT sc.*, u.name as author_name, u.role as author_role, ssc.saved_at FROM saved_smart_cases ssc JOIN smart_cases sc ON sc.id = ssc.smart_case_id JOIN users u ON u.id = sc.created_by WHERE ssc.user_id = ? ORDER BY ssc.saved_at DESC LIMIT 100',
            [$userId]
        );

        return response()->json($rows);
    }

    public function attempts(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $rows = DB::select(
            'SELECT id, smart_case_id, submitted_answer, expected_answer, is_correct, feedback, attempted_at FROM smart_case_attempts WHERE user_id = ? AND smart_case_id = ? ORDER BY attempted_at DESC LIMIT 20',
            [$userId, $id]
        );

        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role', 'student');

        $title = trim((string) $request->input('title', ''));
        $description = trim((string) $request->input('description', ''));

        if ($title === '' || $description === '') {
            return response()->json(['error' => 'Título y descripción son obligatorios'], 400);
        }

        $questionsInput = $request->input('diagnosis_questions', []);
        if (is_string($questionsInput)) {
            $decoded = json_decode($questionsInput, true);
            $questionsInput = is_array($decoded) ? $decoded : [];
        }

        if (!is_array($questionsInput)) {
            $questionsInput = [];
        }

        $diagnosisQuestions = array_values(array_filter(
            array_map(fn ($question) => trim((string) $question), $questionsInput),
            fn ($question) => $question !== ''
        ));

        $diagnosisQuestionsJson = !empty($diagnosisQuestions)
            ? json_encode($diagnosisQuestions, JSON_UNESCAPED_UNICODE)
            : null;

        $requestedStatus = $request->input('status', 'draft');
        $wantsToPublish = in_array($requestedStatus, ['published', 'pending_review'], true);

        if ($wantsToPublish && $role === 'admin') {
            $finalStatus = 'published';
        } elseif ($wantsToPublish && $role === 'professional') {
            $finalStatus = 'pending_review';
        } else {
            $finalStatus = 'draft';
        }

        $smartCase = SmartCase::create([
            'created_by' => $userId,
            'title' => $title,
            'patient_context' => $request->input('patient_context'),
            'description' => $description,
            'symptoms' => $request->input('symptoms'),
            'diagnosis_questions' => $diagnosisQuestions, // Eloquent lo castea automáticamente a JSON gracias a $casts
            'diagnosis_hint' => $request->input('diagnosis_hint'),
            'icd_hint' => $request->input('icd_hint'),
            'source_query' => $request->input('source_query'),
            'source_condition' => $request->input('source_condition'),
            'status' => $finalStatus,
        ]);

        return response()->json($smartCase, 201);
    }

    public function update(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $smartCase = SmartCase::find($id);
        
        if (!$smartCase) {
            return response()->json(['error' => 'Caso inteligente no encontrado'], 404);
        }

        if ($smartCase->created_by !== $userId) {
            return response()->json(['error' => 'No tienes permiso para editar este caso'], 403);
        }

        $title = trim((string) $request->input('title', ''));
        $description = trim((string) $request->input('description', ''));

        if ($title === '' || $description === '') {
            return response()->json(['error' => 'Título y descripción son obligatorios'], 400);
        }

        $questionsInput = $request->input('diagnosis_questions', []);
        if (is_string($questionsInput)) {
            $decoded = json_decode($questionsInput, true);
            $questionsInput = is_array($decoded) ? $decoded : [];
        }

        if (!is_array($questionsInput)) {
            $questionsInput = [];
        }

        $diagnosisQuestions = array_values(array_filter(
            array_map(fn ($question) => trim((string) $question), $questionsInput),
            fn ($question) => $question !== ''
        ));

        $diagnosisQuestionsJson = !empty($diagnosisQuestions)
            ? json_encode($diagnosisQuestions, JSON_UNESCAPED_UNICODE)
            : null;

        $smartCase->update([
            'title' => $title,
            'patient_context' => $request->input('patient_context'),
            'description' => $description,
            'symptoms' => $request->input('symptoms'),
            'diagnosis_questions' => $diagnosisQuestions,
            'diagnosis_hint' => $request->input('diagnosis_hint'),
            'icd_hint' => $request->input('icd_hint'),
            'source_query' => $request->input('source_query'),
            'source_condition' => $request->input('source_condition')
        ]);

        return response()->json(['message' => 'Caso actualizado correctamente']);
    }

    public function save(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $existingCase = DB::select('SELECT id, status FROM smart_cases WHERE id = ? LIMIT 1', [$id]);
        if (empty($existingCase)) {
            return response()->json(['error' => 'Caso inteligente no encontrado'], 404);
        }

        if ((string) $existingCase[0]->status !== 'published') {
            return response()->json(['error' => 'Solo se pueden guardar casos publicados'], 400);
        }

        $alreadySaved = DB::select(
            'SELECT id FROM saved_smart_cases WHERE user_id = ? AND smart_case_id = ? LIMIT 1',
            [$userId, $id]
        );

        if (!empty($alreadySaved)) {
            return response()->json(['message' => 'El caso ya estaba guardado']);
        }

        DB::insert(
            'INSERT INTO saved_smart_cases (user_id, smart_case_id, saved_at) VALUES (?, ?, NOW())',
            [$userId, $id]
        );

        return response()->json(['message' => 'Caso guardado correctamente'], 201);
    }

    public function unsave(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::delete(
            'DELETE FROM saved_smart_cases WHERE user_id = ? AND smart_case_id = ?',
            [$userId, $id]
        );

        return response()->json(['message' => 'Caso eliminado de guardados']);
    }

    public function storeAttempt(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $caseRows = DB::select(
            'SELECT id, diagnosis_hint, status FROM smart_cases WHERE id = ? LIMIT 1',
            [$id]
        );

        if (empty($caseRows)) {
            return response()->json(['error' => 'Caso inteligente no encontrado'], 404);
        }

        if ((string) $caseRows[0]->status !== 'published') {
            return response()->json(['error' => 'Solo se permiten intentos en casos publicados'], 400);
        }

        $submittedAnswer = trim((string) $request->input('submitted_answer', ''));
        if ($submittedAnswer === '') {
            return response()->json(['error' => 'Debes enviar una hipótesis diagnóstica'], 400);
        }

        $expected = trim((string) ($caseRows[0]->diagnosis_hint ?? ''));
        $normalizedAnswer = $this->normalizeText($submittedAnswer);
        $normalizedExpected = $this->normalizeText($expected);

        $isCorrect = $normalizedExpected !== ''
            && (str_contains($normalizedAnswer, $normalizedExpected) || str_contains($normalizedExpected, $normalizedAnswer));

        $feedback = $isCorrect
            ? 'Buen razonamiento: tu hipótesis coincide con la pista diagnóstica.'
            : 'No coincide todavía. Revisa preguntas, síntomas y vuelve a intentar.';

        DB::insert(
            'INSERT INTO smart_case_attempts (user_id, smart_case_id, submitted_answer, expected_answer, is_correct, feedback, attempted_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [$userId, $id, $submittedAnswer, $expected !== '' ? $expected : null, $isCorrect ? 1 : 0, $feedback]
        );

        $attemptId = (int) DB::getPdo()->lastInsertId();

        $rows = DB::select(
            'SELECT id, smart_case_id, submitted_answer, expected_answer, is_correct, feedback, attempted_at FROM smart_case_attempts WHERE id = ? LIMIT 1',
            [$attemptId]
        );

        return response()->json($rows[0] ?? null, 201);
    }

    public function publish(Request $request, int $id)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role', 'student');

        if (!in_array($role, ['professional', 'admin'], true)) {
            return response()->json(['error' => 'Solo profesionales o administradores pueden publicar casos'], 403);
        }

        $existing = DB::select('SELECT created_by FROM smart_cases WHERE id = ? LIMIT 1', [$id]);
        if (empty($existing)) {
            return response()->json(['error' => 'Caso inteligente no encontrado'], 404);
        }

        if ((int) $existing[0]->created_by !== $userId) {
            return response()->json(['error' => 'No tienes permiso para publicar este caso'], 403);
        }

        if ($role === 'admin') {
            DB::update(
                'UPDATE smart_cases SET status = "published", published_at = NOW(), reviewed_by = ?, reviewed_at = NOW(), reviewer_notes = NULL, updated_at = NOW() WHERE id = ?',
                [$userId, $id]
            );

            return response()->json(['message' => 'Caso publicado correctamente']);
        }

        DB::update(
            'UPDATE smart_cases SET status = "pending_review", updated_at = NOW() WHERE id = ?',
            [$id]
        );

        return response()->json(['message' => 'Caso enviado a revisión correctamente']);
    }

    public function pendingModeration(Request $request)
    {
        $role = (string) $request->attributes->get('auth_role', 'student');

        if ($role !== 'admin') {
            return response()->json(['error' => 'Solo administradores pueden moderar casos'], 403);
        }

        $rows = DB::select(
            'SELECT sc.*, u.name as author_name, u.role as author_role FROM smart_cases sc JOIN users u ON u.id = sc.created_by WHERE sc.status = "pending_review" ORDER BY sc.updated_at DESC LIMIT 100'
        );

        return response()->json($rows);
    }

    public function moderate(Request $request, int $id)
    {
        $adminId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role', 'student');

        if ($role !== 'admin') {
            return response()->json(['error' => 'Solo administradores pueden moderar casos'], 403);
        }

        $action = trim((string) $request->input('action', ''));
        $notes = trim((string) $request->input('notes', ''));

        if (!in_array($action, ['approve', 'reject'], true)) {
            return response()->json(['error' => 'Acción de moderación inválida'], 400);
        }

        $existing = DB::select('SELECT id, status FROM smart_cases WHERE id = ? LIMIT 1', [$id]);
        if (empty($existing)) {
            return response()->json(['error' => 'Caso inteligente no encontrado'], 404);
        }

        if ($action === 'approve') {
            DB::update(
                'UPDATE smart_cases SET status = "published", published_at = NOW(), reviewed_by = ?, reviewed_at = NOW(), reviewer_notes = ?, updated_at = NOW() WHERE id = ?',
                [$adminId, $notes !== '' ? $notes : null, $id]
            );

            return response()->json(['message' => 'Caso aprobado y publicado']);
        }

        DB::update(
            'UPDATE smart_cases SET status = "rejected", reviewed_by = ?, reviewed_at = NOW(), reviewer_notes = ?, updated_at = NOW() WHERE id = ?',
            [$adminId, $notes !== '' ? $notes : null, $id]
        );

        return response()->json(['message' => 'Caso rechazado']);
    }
}
