<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('smart_cases')) {
            return;
        }

        DB::statement("ALTER TABLE smart_cases MODIFY status ENUM('draft', 'pending_review', 'published', 'rejected') DEFAULT 'draft'");

        if (!Schema::hasColumn('smart_cases', 'reviewed_by')) {
            DB::statement('ALTER TABLE smart_cases ADD COLUMN reviewed_by INT NULL AFTER published_at');
            DB::statement('ALTER TABLE smart_cases ADD CONSTRAINT fk_smart_cases_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL');
        }

        if (!Schema::hasColumn('smart_cases', 'reviewed_at')) {
            DB::statement('ALTER TABLE smart_cases ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by');
        }

        if (!Schema::hasColumn('smart_cases', 'reviewer_notes')) {
            DB::statement('ALTER TABLE smart_cases ADD COLUMN reviewer_notes TEXT NULL AFTER reviewed_at');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('smart_cases')) {
            return;
        }

        if (Schema::hasColumn('smart_cases', 'reviewer_notes')) {
            DB::statement('ALTER TABLE smart_cases DROP COLUMN reviewer_notes');
        }

        if (Schema::hasColumn('smart_cases', 'reviewed_at')) {
            DB::statement('ALTER TABLE smart_cases DROP COLUMN reviewed_at');
        }

        if (Schema::hasColumn('smart_cases', 'reviewed_by')) {
            DB::statement('ALTER TABLE smart_cases DROP FOREIGN KEY fk_smart_cases_reviewed_by');
            DB::statement('ALTER TABLE smart_cases DROP COLUMN reviewed_by');
        }

        DB::statement("ALTER TABLE smart_cases MODIFY status ENUM('draft', 'published') DEFAULT 'draft'");
    }
};
