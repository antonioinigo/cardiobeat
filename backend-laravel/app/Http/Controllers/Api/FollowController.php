<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FollowController extends Controller
{
    public function me(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $followers = DB::select('SELECT COUNT(*) as followers FROM follows WHERE following_id = ?', [$userId]);
        $following = DB::select('SELECT COUNT(*) as following FROM follows WHERE follower_id = ?', [$userId]);

        $followersList = DB::select(
            'SELECT f.id, u.id as user_id, u.name, u.profile_photo FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.following_id = ? ORDER BY f.created_at DESC LIMIT 50',
            [$userId]
        );

        $followingList = DB::select(
            'SELECT f.id, u.id as user_id, u.name, u.profile_photo FROM follows f JOIN users u ON u.id = f.following_id WHERE f.follower_id = ? ORDER BY f.created_at DESC LIMIT 50',
            [$userId]
        );

        return response()->json([
            'followers' => (int) ($followers[0]->followers ?? 0),
            'following' => (int) ($following[0]->following ?? 0),
            'followersList' => $followersList,
            'followingList' => $followingList,
        ]);
    }

    public function follow(Request $request, int $userId)
    {
        $followerId = (int) $request->attributes->get('auth_user_id');
        $followingId = $userId;

        if ($followerId === $followingId) {
            return response()->json(['error' => 'No puedes seguirte a ti mismo'], 400);
        }

        DB::insert('INSERT IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, NOW())', [$followerId, $followingId]);

        DB::insert(
            'INSERT INTO notifications (user_id, type, related_user_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
            [$followingId, 'follow', $followerId, 'ha comenzado a seguirte']
        );

        return response()->json(['message' => 'Ahora sigues a este usuario'], 201);
    }

    public function unfollow(Request $request, int $userId)
    {
        $followerId = (int) $request->attributes->get('auth_user_id');
        $followingId = $userId;

        DB::delete('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [$followerId, $followingId]);

        return response()->json(['message' => 'Has dejado de seguir a este usuario']);
    }
}
