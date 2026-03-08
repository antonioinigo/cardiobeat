<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $posts = DB::select(
            'SELECT p.*, u.name as author_name, u.profile_photo as author_photo, u.role as author_role, (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count, (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count, EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked FROM posts p JOIN users u ON p.user_id = u.id WHERE p.visibility = "public" OR p.user_id = ? OR (p.visibility = "connections" AND EXISTS(SELECT 1 FROM connections WHERE status = "accepted" AND ((requester_id = ? AND receiver_id = p.user_id) OR (receiver_id = ? AND requester_id = p.user_id)))) ORDER BY p.created_at DESC LIMIT 50',
            [$userId, $userId, $userId, $userId]
        );

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $content = trim((string) $request->input('content', ''));
        if ($content === '') {
            return response()->json(['error' => 'El contenido no puede estar vacío'], 400);
        }

        DB::insert(
            'INSERT INTO posts (user_id, content, image_url, video_url, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [
                $userId,
                $content,
                $request->input('image_url'),
                $request->input('video_url'),
                $request->input('visibility', 'public'),
            ]
        );

        $postId = (int) DB::getPdo()->lastInsertId();

        $post = DB::select(
            'SELECT p.*, u.name as author_name, u.profile_photo as author_photo, u.role as author_role, 0 as likes_count, 0 as comments_count, FALSE as user_liked FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ? LIMIT 1',
            [$postId]
        );

        return response()->json($post[0] ?? null, 201);
    }

    public function toggleLike(Request $request, int $postId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $existing = DB::select('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1', [$postId, $userId]);

        if (!empty($existing)) {
            DB::delete('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [$postId, $userId]);
            return response()->json(['liked' => false, 'message' => 'Like eliminado']);
        }

        DB::insert('INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())', [$postId, $userId]);

        $post = DB::select('SELECT user_id FROM posts WHERE id = ? LIMIT 1', [$postId]);
        if (!empty($post) && (int) $post[0]->user_id !== $userId) {
            DB::insert(
                'INSERT INTO notifications (user_id, type, related_user_id, related_post_id, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [(int) $post[0]->user_id, 'post_like', $userId, $postId, 'le gustó tu publicación']
            );
        }

        return response()->json(['liked' => true, 'message' => 'Like añadido']);
    }

    public function comments(int $postId)
    {
        $comments = DB::select(
            'SELECT c.*, u.name as author_name, u.profile_photo as author_photo, u.role as author_role FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC',
            [$postId]
        );

        return response()->json($comments);
    }

    public function addComment(Request $request, int $postId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $content = trim((string) $request->input('content', ''));

        if ($content === '') {
            return response()->json(['error' => 'El comentario no puede estar vacío'], 400);
        }

        DB::insert(
            'INSERT INTO post_comments (post_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [$postId, $userId, $content]
        );

        $commentId = (int) DB::getPdo()->lastInsertId();

        $post = DB::select('SELECT user_id FROM posts WHERE id = ? LIMIT 1', [$postId]);
        if (!empty($post) && (int) $post[0]->user_id !== $userId) {
            DB::insert(
                'INSERT INTO notifications (user_id, type, related_user_id, related_post_id, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [(int) $post[0]->user_id, 'post_comment', $userId, $postId, 'comentó en tu publicación']
            );
        }

        $comment = DB::select(
            'SELECT c.*, u.name as author_name, u.profile_photo as author_photo, u.role as author_role FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ? LIMIT 1',
            [$commentId]
        );

        return response()->json($comment[0] ?? null, 201);
    }

    public function destroy(Request $request, int $postId)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $post = DB::select('SELECT user_id FROM posts WHERE id = ? LIMIT 1', [$postId]);
        if (empty($post)) {
            return response()->json(['error' => 'Post no encontrado'], 404);
        }

        if ((int) $post[0]->user_id !== $userId) {
            return response()->json(['error' => 'No tienes permiso para eliminar este post'], 403);
        }

        DB::delete('DELETE FROM posts WHERE id = ?', [$postId]);

        return response()->json(['message' => 'Post eliminado correctamente']);
    }
}
