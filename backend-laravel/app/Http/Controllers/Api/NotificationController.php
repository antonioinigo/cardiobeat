<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function unreadCount(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $result = DB::select(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [$userId]
        );

        return response()->json(['unread_count' => (int) ($result[0]->count ?? 0)]);
    }

    public function index(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $unreadOnly = $request->query('unread_only') === 'true';

        $query = 'SELECT n.*, u.name as related_user_name, u.profile_photo as related_user_photo FROM notifications n LEFT JOIN users u ON n.related_user_id = u.id WHERE n.user_id = ?';
        $params = [$userId];

        if ($unreadOnly) {
            $query .= ' AND n.is_read = FALSE';
        }

        $query .= ' ORDER BY n.created_at DESC LIMIT 50';

        return response()->json(DB::select($query, $params));
    }

    public function readAll(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::update('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [$userId]);

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }

    public function readOne(Request $request, int $notificationId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $notification = DB::select('SELECT user_id FROM notifications WHERE id = ? LIMIT 1', [$notificationId]);

        if (empty($notification)) {
            return response()->json(['error' => 'Notificación no encontrada'], 404);
        }

        if ((int) $notification[0]->user_id !== $userId) {
            return response()->json(['error' => 'No tienes permiso para marcar esta notificación'], 403);
        }

        DB::update('UPDATE notifications SET is_read = TRUE WHERE id = ?', [$notificationId]);

        return response()->json(['message' => 'Notificación marcada como leída']);
    }
}
