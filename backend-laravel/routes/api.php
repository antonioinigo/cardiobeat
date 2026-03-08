<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaseController;
use App\Http\Controllers\Api\ConnectionController;
use App\Http\Controllers\Api\EcgController;
use App\Http\Controllers\Api\FocusController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MedicalController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\SmartCaseController;
use App\Http\Controllers\Api\SoundController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'index']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
    Route::get('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/verify-email/resend', [AuthController::class, 'resendVerification'])->middleware('throttle:auth');
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
    Route::post('/password/validate-token', [AuthController::class, 'validateResetToken'])->middleware('throttle:auth');
    Route::post('/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:auth');
    Route::middleware('cardiobeat.jwt')->get('/profile', [AuthController::class, 'profile']);
});

Route::prefix('sounds')->group(function () {
    Route::get('/', [SoundController::class, 'index']);
    Route::get('/search/{term}', [SoundController::class, 'search']);
    Route::get('/{id}', [SoundController::class, 'show']);
});

Route::prefix('focus')->group(function () {
    Route::get('/', [FocusController::class, 'index']);
    Route::get('/{id}', [FocusController::class, 'show']);
});

Route::prefix('cases')->group(function () {
    Route::get('/', [CaseController::class, 'index']);
    Route::get('/{id}', [CaseController::class, 'show']);
    Route::middleware('cardiobeat.jwt')->post('/', [CaseController::class, 'store']);
    Route::middleware('cardiobeat.jwt')->put('/{id}', [CaseController::class, 'update']);
    Route::middleware('cardiobeat.jwt')->delete('/{id}', [CaseController::class, 'destroy']);
    Route::middleware('cardiobeat.jwt')->post('/{id}/attempts', [CaseController::class, 'storeAttempt']);
});

Route::prefix('progress')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/', [ProgressController::class, 'index']);
    Route::post('/', [ProgressController::class, 'store']);
    Route::get('/stats', [ProgressController::class, 'stats']);
});

Route::prefix('posts')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/', [PostController::class, 'index']);
    Route::post('/', [PostController::class, 'store']);
    Route::post('/{postId}/like', [PostController::class, 'toggleLike']);
    Route::get('/{postId}/comments', [PostController::class, 'comments']);
    Route::post('/{postId}/comments', [PostController::class, 'addComment']);
    Route::delete('/{postId}', [PostController::class, 'destroy']);
});

Route::prefix('connections')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/', [ConnectionController::class, 'index']);
    Route::get('/requests', [ConnectionController::class, 'requests']);
    Route::get('/search', [ConnectionController::class, 'search']);
    Route::post('/request/{userId}', [ConnectionController::class, 'sendRequest']);
    Route::put('/accept/{connectionId}', [ConnectionController::class, 'accept']);
    Route::put('/reject/{connectionId}', [ConnectionController::class, 'reject']);
    Route::delete('/{userId}', [ConnectionController::class, 'destroy']);
});

Route::prefix('messages')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/unread/count', [MessageController::class, 'unreadCount']);
    Route::get('/', [MessageController::class, 'index']);
    Route::get('/{conversationId}/messages', [MessageController::class, 'show']);
    Route::post('/{otherUserId}', [MessageController::class, 'store']);
    Route::put('/{conversationId}/read', [MessageController::class, 'markRead']);
});

Route::prefix('notifications')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/unread/count', [NotificationController::class, 'unreadCount']);
    Route::get('/', [NotificationController::class, 'index']);
    Route::put('/read-all', [NotificationController::class, 'readAll']);
    Route::put('/{notificationId}/read', [NotificationController::class, 'readOne']);
});

Route::prefix('profile')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/{userId}', [ProfileController::class, 'show']);
    Route::put('/', [ProfileController::class, 'update']);
    Route::post('/experience', [ProfileController::class, 'addExperience']);
    Route::put('/experience/{expId}', [ProfileController::class, 'updateExperience']);
    Route::delete('/experience/{expId}', [ProfileController::class, 'deleteExperience']);
    Route::post('/education', [ProfileController::class, 'addEducation']);
    Route::delete('/education/{eduId}', [ProfileController::class, 'deleteEducation']);
    Route::post('/certifications', [ProfileController::class, 'addCertification']);
    Route::delete('/certifications/{certId}', [ProfileController::class, 'deleteCertification']);
});

Route::prefix('ecg')->middleware('cardiobeat.jwt')->group(function () {
    Route::post('/sessions', [EcgController::class, 'storeSession']);
    Route::get('/sessions', [EcgController::class, 'sessions']);
});

Route::prefix('follows')->middleware('cardiobeat.jwt')->group(function () {
    Route::get('/me', [FollowController::class, 'me']);
    Route::post('/{userId}', [FollowController::class, 'follow']);
    Route::delete('/{userId}', [FollowController::class, 'unfollow']);
});

Route::prefix('uploads')->middleware('cardiobeat.jwt')->group(function () {
    Route::post('/image', [UploadController::class, 'image']);
});

Route::prefix('medical')->middleware('throttle:60,1')->group(function () {
    Route::get('/conditions', [MedicalController::class, 'conditions']);
    Route::get('/icd10', [MedicalController::class, 'icd10']);
    Route::get('/training-case', [MedicalController::class, 'trainingCase']);
});

Route::prefix('smart-cases')->group(function () {
    Route::get('/', [SmartCaseController::class, 'index']);
    Route::middleware('cardiobeat.jwt')->get('/mine', [SmartCaseController::class, 'mine']);
    Route::middleware('cardiobeat.jwt')->get('/saved', [SmartCaseController::class, 'saved']);
    Route::middleware('cardiobeat.jwt')->get('/{id}/attempts', [SmartCaseController::class, 'attempts']);
    Route::middleware('cardiobeat.jwt')->post('/', [SmartCaseController::class, 'store']);
    Route::middleware('cardiobeat.jwt')->put('/{id}', [SmartCaseController::class, 'update']);
    Route::middleware('cardiobeat.jwt')->post('/{id}/save', [SmartCaseController::class, 'save']);
    Route::middleware('cardiobeat.jwt')->post('/{id}/attempts', [SmartCaseController::class, 'storeAttempt']);
    Route::middleware('cardiobeat.jwt')->delete('/{id}/save', [SmartCaseController::class, 'unsave']);
    Route::middleware('cardiobeat.jwt')->put('/{id}/publish', [SmartCaseController::class, 'publish']);
    Route::middleware('cardiobeat.jwt')->get('/moderation/pending', [SmartCaseController::class, 'pendingModeration']);
    Route::middleware('cardiobeat.jwt')->put('/{id}/moderate', [SmartCaseController::class, 'moderate']);
});
