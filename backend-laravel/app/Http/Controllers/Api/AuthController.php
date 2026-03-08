<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Firebase\JWT\JWT;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
            'name' => 'nullable|string|max:100',
            'role' => 'nullable|string|in:student,professional,admin',
        ]);

        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            return response()->json(['error' => 'El email ya está registrado'], 409);
        }

        try {
            DB::beginTransaction();

            $user = User::create([
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'name' => $data['name'] ?? null,
                'role' => $data['role'] ?? 'student',
            ]);

            $this->createEmailVerificationToken($user->id, $user->email, (string) ($user->name ?? ''));

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'No se pudo completar el registro en este momento. Revisa la configuracion de correo e intentalo de nuevo.',
            ], 500);
        }

        return response()->json([
            'message' => 'Usuario registrado. Te hemos enviado un correo de verificación.',
            'userId' => $user->id,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();
        if (!$user) {
            return response()->json(['error' => 'Credenciales incorrectas'], 401);
        }

        $storedHash = (string) ($user->password ?? '');

        $passwordIsValid = false;
        try {
            $passwordIsValid = Hash::check($credentials['password'], $storedHash);
        } catch (\Throwable $e) {
            $passwordIsValid = false;
        }

        if (!$passwordIsValid) {
            $passwordIsValid = password_verify($credentials['password'], $storedHash);
        }

        if (!$passwordIsValid) {
            return response()->json(['error' => 'Credenciales incorrectas'], 401);
        }

        if (!(bool) ($user->is_verified ?? false)) {
            return response()->json([
                'error' => 'Debes verificar tu email antes de iniciar sesión.',
                'code' => 'email_not_verified',
            ], 403);
        }

        $jwtSecret = (string) config('cardiobeat.jwt.secret', '');
        if ($jwtSecret === '') {
            return response()->json(['error' => 'Configuración JWT no disponible'], 500);
        }

        $ttlMinutes = max((int) config('cardiobeat.jwt.ttl_minutes', 1440), 1);
        $now = time();
        $token = JWT::encode([
            'userId' => (int) $user->id,
            'email' => (string) $user->email,
            'role' => (string) ($user->role ?? 'student'),
            'iat' => $now,
            'exp' => $now + ($ttlMinutes * 60),
        ], $jwtSecret, 'HS256');

        return response()->json([
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => (int) $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
            ],
        ]);
    }

    public function profile(Request $request)
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $user = User::select('id', 'email', 'name', 'role', 'is_verified', 'created_at')
            ->find($userId);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json($user);
    }

    public function verifyEmail(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
        ]);

        $tokenHash = hash('sha256', $data['token']);

        $records = DB::select(
            'SELECT * FROM email_verification_tokens
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
             ORDER BY id DESC LIMIT 1',
            [$tokenHash]
        );

        if (empty($records)) {
            return response()->json(['error' => 'El enlace de verificación es inválido o ha expirado.'], 400);
        }

        $record = $records[0];

        DB::transaction(function () use ($record) {
            DB::update('UPDATE users SET is_verified = 1, updated_at = NOW() WHERE id = ?', [(int) $record->user_id]);
            DB::update('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [(int) $record->id]);
        });

        return response()->json(['message' => 'Email verificado correctamente. Ya puedes iniciar sesión.']);
    }

    public function resendVerification(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $users = DB::select('SELECT id, email, name, is_verified FROM users WHERE email = ? LIMIT 1', [$data['email']]);

        if (empty($users)) {
            return response()->json(['message' => 'Si el email existe, recibirás un nuevo enlace de verificación.']);
        }

        $user = $users[0];

        if ((bool) ($user->is_verified ?? false)) {
            return response()->json(['message' => 'Tu cuenta ya está verificada.']);
        }

        $this->createEmailVerificationToken((int) $user->id, (string) $user->email, (string) ($user->name ?? ''));

        return response()->json(['message' => 'Hemos enviado un nuevo correo de verificación.']);
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $users = DB::select('SELECT id, email, name FROM users WHERE email = ? LIMIT 1', [$data['email']]);

        if (!empty($users)) {
            $user = $users[0];
            $this->createPasswordResetToken((int) $user->id, (string) $user->email, (string) ($user->name ?? ''));
        }

        return response()->json([
            'message' => 'Si el email existe, recibirás un token para restablecer la contraseña.',
        ]);
    }

    public function validateResetToken(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $tokenHash = hash('sha256', $data['token']);

        $records = DB::select(
            'SELECT id FROM password_reset_tokens
             WHERE token_hash = ? AND email = ? AND used_at IS NULL AND expires_at > NOW()
             ORDER BY id DESC LIMIT 1',
            [$tokenHash, $data['email']]
        );

        if (empty($records)) {
            return response()->json(['error' => 'El token es inválido o ha expirado.'], 400);
        }

        return response()->json(['message' => 'Token válido. Ya puedes definir tu nueva contraseña.']);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $tokenHash = hash('sha256', $data['token']);

        $records = DB::select(
            'SELECT * FROM password_reset_tokens
             WHERE token_hash = ? AND email = ? AND used_at IS NULL AND expires_at > NOW()
             ORDER BY id DESC LIMIT 1',
            [$tokenHash, $data['email']]
        );

        if (empty($records)) {
            return response()->json(['error' => 'El enlace para cambiar la contraseña es inválido o ha expirado.'], 400);
        }

        $record = $records[0];

        DB::transaction(function () use ($record, $data) {
            DB::update(
                'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ? AND email = ?',
                [Hash::make($data['password']), (int) $record->user_id, $data['email']]
            );

            DB::update('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [(int) $record->id]);
        });

        return response()->json(['message' => 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.']);
    }

    private function frontendUrl(string $path): string
    {
        $base = rtrim((string) env('FRONTEND_URL', config('app.url', 'http://localhost:3000')), '/');
        return $base.'/'.ltrim($path, '/');
    }

    private function createEmailVerificationToken(int $userId, string $email, string $name = ''): void
    {
        $rawToken = Str::random(64);
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = Carbon::now()->addHours(24)->toDateTimeString();

        DB::insert(
            'INSERT INTO email_verification_tokens (user_id, email, token_hash, expires_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())',
            [$userId, $email, $tokenHash, $expiresAt]
        );

        $verificationUrl = $this->frontendUrl('/verify-email?token='.urlencode($rawToken));
        $recipientName = trim($name) !== '' ? $name : $email;

        $html = "
            <div style='font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;'>
                <h2 style='margin:0 0 12px;'>Confirma tu registro en CardioBeat</h2>
                <p>Hola {$recipientName},</p>
                <p>Gracias por registrarte. Pulsa el botón para confirmar tu cuenta:</p>
                <p style='margin:20px 0;'>
                    <a href='{$verificationUrl}' style='background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600;'>Confirmar registro</a>
                </p>
                <p style='font-size:14px;color:#4b5563;'>Este enlace caduca en 24 horas.</p>
                <p style='font-size:12px;color:#6b7280;'>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
            </div>
        ";

        Mail::html($html, function ($message) use ($email, $recipientName) {
            $message->to($email, $recipientName)
                ->subject('CardioBeat · Confirma tu registro');
        });
    }

    private function createPasswordResetToken(int $userId, string $email, string $name = ''): void
    {
        $rawToken = Str::random(64);
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = Carbon::now()->addMinutes(30)->toDateTimeString();

        DB::insert(
            'INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())',
            [$userId, $email, $tokenHash, $expiresAt]
        );

        $resetUrl = $this->frontendUrl('/reset-password?token='.urlencode($rawToken).'&email='.urlencode($email));
        $recipientName = trim($name) !== '' ? $name : $email;

        $html = "
            <div style='font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;'>
                <h2 style='margin:0 0 12px;'>Restablecer contraseña</h2>
                <p>Hola {$recipientName},</p>
                <p>Hemos recibido una solicitud para cambiar tu contraseña en CardioBeat.</p>
                <p>Este es tu token de recuperación:</p>
                <p style='margin:12px 0 20px;'><span style='display:inline-block;background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;font-size:18px;font-weight:700;letter-spacing:1px;color:#111827;'>{$rawToken}</span></p>
                <p>Después, introdúcelo en la pantalla de recuperación para continuar.</p>
                <p style='margin:20px 0;'>
                    <a href='{$resetUrl}' style='background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600;'>Ir a restablecer contraseña</a>
                </p>
                <p style='font-size:14px;color:#4b5563;'>El token caduca en 30 minutos.</p>
                <p style='font-size:12px;color:#6b7280;'>Si no solicitaste este cambio, ignora este correo.</p>
            </div>
        ";

        Mail::html($html, function ($message) use ($email, $recipientName) {
            $message->to($email, $recipientName)
                ->subject('CardioBeat · Token para cambiar contraseña');
        });
    }
}
