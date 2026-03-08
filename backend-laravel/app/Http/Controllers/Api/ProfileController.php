<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function show(Request $request, int $userId)
    {
        $requesterId = (int) $request->attributes->get('auth_user_id');

        if ($requesterId !== $userId) {
            return response()->json(['error' => 'No tienes permiso para acceder a esta cuenta'], 403);
        }

        $users = DB::select('SELECT id, name, email, bio, profile_photo, cover_photo, role, location, website, linkedin, created_at FROM users WHERE id = ? LIMIT 1', [$userId]);

        if (empty($users)) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $experience = DB::select('SELECT * FROM professional_experience WHERE user_id = ? ORDER BY is_current DESC, start_date DESC', [$userId]);
        $education = DB::select('SELECT * FROM education WHERE user_id = ? ORDER BY is_current DESC, start_date DESC', [$userId]);
        $certifications = DB::select('SELECT * FROM certifications WHERE user_id = ? ORDER BY issue_date DESC', [$userId]);

        $connectionsCount = DB::select('SELECT COUNT(*) as count FROM connections WHERE status = ? AND (requester_id = ? OR receiver_id = ?)', ['accepted', $userId, $userId]);

        $connectionStatus = 'none';
        if ($userId !== $requesterId) {
            $connection = DB::select(
                'SELECT status, requester_id FROM connections WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)) LIMIT 1',
                [$requesterId, $userId, $userId, $requesterId]
            );

            if (!empty($connection)) {
                if ($connection[0]->status === 'accepted') {
                    $connectionStatus = 'connected';
                } elseif ($connection[0]->status === 'pending') {
                    $connectionStatus = ((int) $connection[0]->requester_id === $requesterId) ? 'pending_sent' : 'pending_received';
                }
            }
        }

        return response()->json([
            'user' => $users[0],
            'experience' => $experience,
            'education' => $education,
            'certifications' => $certifications,
            'connectionsCount' => (int) ($connectionsCount[0]->count ?? 0),
            'connectionStatus' => $connectionStatus,
        ]);
    }

    public function update(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $currentUserRows = DB::select('SELECT role FROM users WHERE id = ? LIMIT 1', [$userId]);
        if (empty($currentUserRows)) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $currentRole = (string) $currentUserRows[0]->role;
        $requestedRole = (string) $request->input('role', $currentRole);
        $allowedRoles = ['student', 'professional'];

        $finalRole = $currentRole;
        if ($currentRole !== 'admin' && in_array($requestedRole, $allowedRoles, true)) {
            $finalRole = $requestedRole;
        }

        DB::update(
            'UPDATE users SET name = ?, bio = ?, profile_photo = ?, cover_photo = ?, role = ?, location = ?, website = ?, linkedin = ?, updated_at = NOW() WHERE id = ?',
            [
                $request->input('name'),
                $request->input('bio'),
                $request->input('profile_photo'),
                $request->input('cover_photo'),
                $finalRole,
                $request->input('location'),
                $request->input('website'),
                $request->input('linkedin'),
                $userId,
            ]
        );

        return response()->json(['message' => 'Perfil actualizado correctamente']);
    }

    public function addExperience(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::insert(
            'INSERT INTO professional_experience (user_id, title, company, location, start_date, end_date, is_current, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $userId,
                $request->input('title'),
                $request->input('company'),
                $request->input('location'),
                $request->input('start_date'),
                $request->input('end_date'),
                $request->boolean('is_current'),
                $request->input('description'),
            ]
        );

        $experience = DB::select('SELECT * FROM professional_experience WHERE id = ? LIMIT 1', [(int) DB::getPdo()->lastInsertId()]);

        return response()->json($experience[0] ?? null, 201);
    }

    public function updateExperience(Request $request, int $expId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $exp = DB::select('SELECT user_id FROM professional_experience WHERE id = ? LIMIT 1', [$expId]);
        if (empty($exp)) {
            return response()->json(['error' => 'Experiencia no encontrada'], 404);
        }

        if ((int) $exp[0]->user_id !== $userId) {
            return response()->json(['error' => 'No tienes permiso para editar esta experiencia'], 403);
        }

        DB::update(
            'UPDATE professional_experience SET title = ?, company = ?, location = ?, start_date = ?, end_date = ?, is_current = ?, description = ? WHERE id = ?',
            [
                $request->input('title'),
                $request->input('company'),
                $request->input('location'),
                $request->input('start_date'),
                $request->input('end_date'),
                $request->boolean('is_current'),
                $request->input('description'),
                $expId,
            ]
        );

        return response()->json(['message' => 'Experiencia actualizada correctamente']);
    }

    public function deleteExperience(Request $request, int $expId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $exp = DB::select('SELECT user_id FROM professional_experience WHERE id = ? LIMIT 1', [$expId]);
        if (empty($exp)) {
            return response()->json(['error' => 'Experiencia no encontrada'], 404);
        }

        if ((int) $exp[0]->user_id !== $userId) {
            return response()->json(['error' => 'No tienes permiso para eliminar esta experiencia'], 403);
        }

        DB::delete('DELETE FROM professional_experience WHERE id = ?', [$expId]);

        return response()->json(['message' => 'Experiencia eliminada correctamente']);
    }

    public function addEducation(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::insert(
            'INSERT INTO education (user_id, institution, degree, field_of_study, start_date, end_date, is_current, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $userId,
                $request->input('institution'),
                $request->input('degree'),
                $request->input('field_of_study'),
                $request->input('start_date'),
                $request->input('end_date'),
                $request->boolean('is_current'),
                $request->input('description'),
            ]
        );

        $education = DB::select('SELECT * FROM education WHERE id = ? LIMIT 1', [(int) DB::getPdo()->lastInsertId()]);

        return response()->json($education[0] ?? null, 201);
    }

    public function deleteEducation(Request $request, int $eduId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $edu = DB::select('SELECT user_id FROM education WHERE id = ? LIMIT 1', [$eduId]);
        if (empty($edu)) {
            return response()->json(['error' => 'Educación no encontrada'], 404);
        }

        if ((int) $edu[0]->user_id !== $userId) {
            return response()->json(['error' => 'No tienes permiso para eliminar esta educación'], 403);
        }

        DB::delete('DELETE FROM education WHERE id = ?', [$eduId]);

        return response()->json(['message' => 'Educación eliminada correctamente']);
    }

    public function addCertification(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::insert(
            'INSERT INTO certifications (user_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $userId,
                $request->input('name'),
                $request->input('issuing_organization'),
                $request->input('issue_date'),
                $request->input('expiration_date'),
                $request->input('credential_id'),
                $request->input('credential_url'),
            ]
        );

        $certification = DB::select('SELECT * FROM certifications WHERE id = ? LIMIT 1', [(int) DB::getPdo()->lastInsertId()]);

        return response()->json($certification[0] ?? null, 201);
    }

    public function deleteCertification(Request $request, int $certId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $cert = DB::select('SELECT user_id FROM certifications WHERE id = ? LIMIT 1', [$certId]);
        if (empty($cert)) {
            return response()->json(['error' => 'Certificación no encontrada'], 404);
        }

        if ((int) $cert[0]->user_id !== $userId) {
            return response()->json(['error' => 'No tienes permiso para eliminar esta certificación'], 403);
        }

        DB::delete('DELETE FROM certifications WHERE id = ?', [$certId]);

        return response()->json(['message' => 'Certificación eliminada correctamente']);
    }
}
