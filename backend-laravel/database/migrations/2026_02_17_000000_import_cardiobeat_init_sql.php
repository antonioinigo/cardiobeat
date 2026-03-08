<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        $path = database_path('init.sql');

        if (!File::exists($path)) {
            throw new RuntimeException('No se encontró database/init.sql para ejecutar la migración.');
        }

        $sql = File::get($path);

        $sql = preg_replace('/^\s*CREATE\s+DATABASE\s+.*?;\s*$/mi', '', $sql) ?? $sql;
        $sql = preg_replace('/^\s*USE\s+.*?;\s*$/mi', '', $sql) ?? $sql;

        DB::unprepared($sql);
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        $tables = [
            'ecg_sessions',
            'case_attempts',
            'user_progress',
            'smart_cases',
            'clinical_cases',
            'heart_sounds',
            'cardiac_focus',
            'follows',
            'notifications',
            'messages',
            'conversations',
            'post_comments',
            'post_likes',
            'post_media',
            'posts',
            'connections',
            'certifications',
            'education',
            'professional_experience',
            'user_media',
            'users',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }

        Schema::enableForeignKeyConstraints();
    }
};
