<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $progress = DB::select(
             'SELECT * FROM (
              SELECT CONCAT("up-", up.id) AS id,
                  up.completed,
                  up.score,
                  up.time_spent,
                  up.created_at,
                  hs.title AS sound_title,
                  cc.title AS case_title,
                  up.sound_id,
                  up.case_id,
                  NULL AS smart_case_id,
                  0 AS is_ecg
              FROM user_progress up
              LEFT JOIN heart_sounds hs ON up.sound_id = hs.id
              LEFT JOIN clinical_cases cc ON up.case_id = cc.id
              WHERE up.user_id = ?

              UNION ALL

              SELECT CONCAT("ca-", ca.id) AS id,
                  1 AS completed,
                  ca.score,
                  NULL AS time_spent,
                  ca.completed_at AS created_at,
                  NULL AS sound_title,
                  cc.title AS case_title,
                  NULL AS sound_id,
                  ca.case_id,
                  NULL AS smart_case_id,
                  0 AS is_ecg
              FROM case_attempts ca
              LEFT JOIN clinical_cases cc ON ca.case_id = cc.id
              WHERE ca.user_id = ?

              UNION ALL

              SELECT CONCAT("sca-", sca.id) AS id,
                  sca.is_correct AS completed,
                  CASE WHEN sca.is_correct = 1 THEN 100 ELSE 0 END AS score,
                  NULL AS time_spent,
                  sca.attempted_at AS created_at,
                  NULL AS sound_title,
                  CONCAT("Caso tipo test: ", sc.title) AS case_title,
                  NULL AS sound_id,
                  NULL AS case_id,
                  sca.smart_case_id,
                  0 AS is_ecg
              FROM smart_case_attempts sca
              JOIN smart_cases sc ON sc.id = sca.smart_case_id
              WHERE sca.user_id = ?

              UNION ALL

              SELECT CONCAT("ecg-", es.id) AS id,
                  1 AS completed,
                  NULL AS score,
                  es.duration_seconds AS time_spent,
                  es.created_at,
                  CONCAT("Sesión ECG", CASE WHEN es.rhythm IS NULL OR es.rhythm = "" THEN "" ELSE CONCAT(": ", es.rhythm) END) AS sound_title,
                  NULL AS case_title,
                  NULL AS sound_id,
                  NULL AS case_id,
                  NULL AS smart_case_id,
                  1 AS is_ecg
              FROM ecg_sessions es
              WHERE es.user_id = ?
             ) AS activity_feed
             ORDER BY created_at DESC
             LIMIT 50',
             [$userId, $userId, $userId, $userId]
        );

        return response()->json($progress);
    }

    public function store(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $caseId = $request->input('case_id');
        $soundId = $request->input('sound_id');
        $completed = (bool) $request->input('completed', false);
        $score = $request->input('score');
        $timeSpent = $request->input('time_spent');

        DB::insert(
            'INSERT INTO user_progress (user_id, case_id, sound_id, completed, score, time_spent, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [$userId, $caseId, $soundId, $completed ? 1 : 0, $score, $timeSpent, $completed ? now() : null]
        );

        return response()->json([
            'message' => 'Progreso registrado',
            'progressId' => (int) DB::getPdo()->lastInsertId(),
        ], 201);
    }

    public function stats(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $stats = DB::select(
            'SELECT
                (
                    (SELECT COUNT(*) FROM user_progress WHERE user_id = ?)
                    + (SELECT COUNT(*) FROM case_attempts WHERE user_id = ?)
                    + (SELECT COUNT(*) FROM smart_case_attempts WHERE user_id = ?)
                    + (SELECT COUNT(*) FROM ecg_sessions WHERE user_id = ?)
                ) AS total_activities,
                (
                    (SELECT COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) FROM user_progress WHERE user_id = ?)
                    + (SELECT COUNT(*) FROM case_attempts WHERE user_id = ?)
                    + (SELECT COUNT(*) FROM smart_case_attempts WHERE user_id = ?)
                    + (SELECT COUNT(*) FROM ecg_sessions WHERE user_id = ?)
                ) AS completed_activities,
                (
                    SELECT AVG(score_value)
                    FROM (
                        SELECT CAST(score AS DECIMAL(10,2)) AS score_value
                        FROM user_progress
                        WHERE user_id = ? AND score IS NOT NULL

                        UNION ALL

                        SELECT CAST(score AS DECIMAL(10,2)) AS score_value
                        FROM case_attempts
                        WHERE user_id = ? AND score IS NOT NULL

                        UNION ALL

                        SELECT CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END AS score_value
                        FROM smart_case_attempts
                        WHERE user_id = ?
                    ) AS scored_activity
                ) AS average_score,
                (
                    (SELECT COALESCE(SUM(COALESCE(time_spent, 0)), 0) FROM user_progress WHERE user_id = ?)
                    + (SELECT COALESCE(SUM(COALESCE(duration_seconds, 0)), 0) FROM ecg_sessions WHERE user_id = ?)
                ) AS total_time',
            [
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
                $userId,
            ]
        );

        return response()->json($stats[0] ?? [
            'total_activities' => 0,
            'completed_activities' => 0,
            'average_score' => null,
            'total_time' => 0,
        ]);
    }
}
