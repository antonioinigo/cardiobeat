<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConnectionController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $connections = DB::select(
            'SELECT u.id, u.name, u.email, u.profile_photo, u.role, u.bio, u.location FROM connections c JOIN users u ON (CASE WHEN c.requester_id = ? THEN c.receiver_id = u.id ELSE c.requester_id = u.id END) WHERE c.status = "accepted" AND (c.requester_id = ? OR c.receiver_id = ?) ORDER BY u.name ASC',
            [$userId, $userId, $userId]
        );

        return response()->json($connections);
    }

    public function requests(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $requests = DB::select(
            'SELECT c.id as connection_id, u.id, u.name, u.email, u.profile_photo, u.role, u.bio, u.location, c.created_at FROM connections c JOIN users u ON c.requester_id = u.id WHERE c.receiver_id = ? AND c.status = "pending" ORDER BY c.created_at DESC',
            [$userId]
        );

        return response()->json($requests);
    }

    public function search(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $query = trim((string) $request->query('query', ''));

        if ($query === '') {
            return response()->json(['error' => 'Se requiere un término de búsqueda'], 400);
        }

        $search = '%'.$query.'%';

        $users = DB::select(
            'SELECT u.id, u.name, u.email, u.profile_photo, u.role, u.bio, u.location, CASE WHEN EXISTS(SELECT 1 FROM connections WHERE status = "accepted" AND ((requester_id = ? AND receiver_id = u.id) OR (receiver_id = ? AND requester_id = u.id))) THEN "connected" WHEN EXISTS(SELECT 1 FROM connections WHERE status = "pending" AND requester_id = ? AND receiver_id = u.id) THEN "pending_sent" WHEN EXISTS(SELECT 1 FROM connections WHERE status = "pending" AND receiver_id = ? AND requester_id = u.id) THEN "pending_received" ELSE "none" END as connection_status FROM users u WHERE u.id != ? AND (u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ?) ORDER BY u.name ASC LIMIT 50',
            [$userId, $userId, $userId, $userId, $userId, $search, $search, $search]
        );

        return response()->json($users);
    }

    public function sendRequest(Request $request, int $userId)
    {
        $requesterId = (int) $request->attributes->get('auth_user_id');
        $receiverId = $userId;

        if ($requesterId === $receiverId) {
            return response()->json(['error' => 'No puedes conectarte contigo mismo'], 400);
        }

        $existing = DB::select(
            'SELECT id, status FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?) LIMIT 1',
            [$requesterId, $receiverId, $receiverId, $requesterId]
        );

        if (!empty($existing)) {
            if ($existing[0]->status === 'accepted') {
                return response()->json(['error' => 'Ya estás conectado con este usuario'], 400);
            }

            if ($existing[0]->status === 'pending') {
                return response()->json(['error' => 'Ya existe una solicitud pendiente'], 400);
            }
        }

        DB::insert(
            'INSERT INTO connections (requester_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [$requesterId, $receiverId, 'pending']
        );

        DB::insert(
            'INSERT INTO notifications (user_id, type, related_user_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
            [$receiverId, 'connection_request', $requesterId, 'te envió una solicitud de conexión']
        );

        return response()->json(['message' => 'Solicitud de conexión enviada'], 201);
    }

    public function accept(Request $request, int $connectionId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $connection = DB::select(
            'SELECT * FROM connections WHERE id = ? AND receiver_id = ? AND status = ? LIMIT 1',
            [$connectionId, $userId, 'pending']
        );

        if (empty($connection)) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        DB::update('UPDATE connections SET status = ?, updated_at = NOW() WHERE id = ?', ['accepted', $connectionId]);

        DB::insert(
            'INSERT INTO notifications (user_id, type, related_user_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
            [(int) $connection[0]->requester_id, 'connection_accepted', $userId, 'aceptó tu solicitud de conexión']
        );

        return response()->json(['message' => 'Solicitud aceptada']);
    }

    public function reject(Request $request, int $connectionId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $connection = DB::select(
            'SELECT * FROM connections WHERE id = ? AND receiver_id = ? AND status = ? LIMIT 1',
            [$connectionId, $userId, 'pending']
        );

        if (empty($connection)) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        DB::update('UPDATE connections SET status = ?, updated_at = NOW() WHERE id = ?', ['rejected', $connectionId]);

        return response()->json(['message' => 'Solicitud rechazada']);
    }

    public function destroy(Request $request, int $userId)
    {
        $currentUserId = (int) $request->attributes->get('auth_user_id');

        DB::delete(
            'DELETE FROM connections WHERE status = "accepted" AND ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))',
            [$currentUserId, $userId, $userId, $currentUserId]
        );

        return response()->json(['message' => 'Conexión eliminada']);
    }
}
