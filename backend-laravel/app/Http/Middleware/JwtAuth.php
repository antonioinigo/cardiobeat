<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $jwtSecret = (string) config('cardiobeat.jwt.secret', '');
        if ($jwtSecret === '') {
            return response()->json(['error' => 'Configuración de autenticación incompleta'], 500);
        }

        $authHeader = $request->header('Authorization');
        $fallbackToken = (string) $request->header('X-Access-Token', '');

        $token = '';
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = trim(substr($authHeader, 7));
        } elseif ($fallbackToken !== '') {
            $token = trim($fallbackToken);
        }

        if ($token === '') {
            return response()->json(['error' => 'Token no proporcionado'], 401);
        }

        try {
            $payload = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            $request->attributes->set('auth_user_id', (int) ($payload->userId ?? 0));
            $request->attributes->set('auth_email', (string) ($payload->email ?? ''));
            $request->attributes->set('auth_role', (string) ($payload->role ?? 'student'));
        } catch (\Throwable $exception) {
            return response()->json(['error' => 'Token inválido'], 403);
        }

        if (!$request->attributes->get('auth_user_id')) {
            return response()->json(['error' => 'Token inválido'], 403);
        }

        return $next($request);
    }
}
