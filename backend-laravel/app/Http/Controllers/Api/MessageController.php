<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function unreadCount(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $result = DB::select(
            'SELECT COUNT(*) as unread_count FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE (c.participant1_id = ? OR c.participant2_id = ?) AND m.sender_id != ? AND m.is_read = FALSE',
            [$userId, $userId, $userId]
        );

        return response()->json(['unread_count' => (int) ($result[0]->unread_count ?? 0)]);
    }

    public function index(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $conversations = DB::select(
            'SELECT c.id as conversation_id, c.last_message_at, u.id as other_user_id, u.name as other_user_name, u.profile_photo as other_user_photo, u.role as other_user_role, (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message, (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time, (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count FROM conversations c JOIN users u ON (CASE WHEN c.participant1_id = ? THEN c.participant2_id = u.id ELSE c.participant1_id = u.id END) WHERE c.participant1_id = ? OR c.participant2_id = ? ORDER BY c.last_message_at DESC',
            [$userId, $userId, $userId, $userId]
        );

        return response()->json($conversations);
    }

    public function show(Request $request, int $conversationId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $conversation = DB::select(
            'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?) LIMIT 1',
            [$conversationId, $userId, $userId]
        );

        if (empty($conversation)) {
            return response()->json(['error' => 'Conversación no encontrada'], 404);
        }

        $messages = DB::select(
            'SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC',
            [$conversationId]
        );

        DB::update(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE',
            [$conversationId, $userId]
        );

        return response()->json($messages);
    }

    public function store(Request $request, int $otherUserId)
    {
        $senderId = (int) $request->attributes->get('auth_user_id');
        $receiverId = $otherUserId;
        $content = trim((string) $request->input('content', ''));

        if ($content === '') {
            return response()->json(['error' => 'El mensaje no puede estar vacío'], 400);
        }

        $conversation = DB::select(
            'SELECT id FROM conversations WHERE (participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?) LIMIT 1',
            [$senderId, $receiverId, $receiverId, $senderId]
        );

        if (empty($conversation)) {
            DB::insert(
                'INSERT INTO conversations (participant1_id, participant2_id, last_message_at, created_at) VALUES (?, ?, NOW(), NOW())',
                [$senderId, $receiverId]
            );
            $conversationId = (int) DB::getPdo()->lastInsertId();
        } else {
            $conversationId = (int) $conversation[0]->id;
        }

        DB::insert(
            'INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())',
            [$conversationId, $senderId, $content]
        );

        $messageId = (int) DB::getPdo()->lastInsertId();

        DB::update('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [$conversationId]);

        DB::insert(
            'INSERT INTO notifications (user_id, type, related_user_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
            [$receiverId, 'message', $senderId, 'te envió un mensaje']
        );

        $message = DB::select(
            'SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ? LIMIT 1',
            [$messageId]
        );

        return response()->json([
            'message' => $message[0] ?? null,
            'conversationId' => $conversationId,
        ], 201);
    }

    public function markRead(Request $request, int $conversationId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        DB::update(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
            [$conversationId, $userId]
        );

        return response()->json(['message' => 'Mensajes marcados como leídos']);
    }
}
