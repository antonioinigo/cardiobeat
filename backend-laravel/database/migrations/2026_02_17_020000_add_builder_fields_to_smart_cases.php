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

        if (!Schema::hasColumn('smart_cases', 'patient_context')) {
            DB::statement('ALTER TABLE smart_cases ADD COLUMN patient_context TEXT NULL AFTER title');
        }

        if (!Schema::hasColumn('smart_cases', 'diagnosis_questions')) {
            DB::statement('ALTER TABLE smart_cases ADD COLUMN diagnosis_questions TEXT NULL AFTER symptoms');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('smart_cases')) {
            return;
        }

        if (Schema::hasColumn('smart_cases', 'diagnosis_questions')) {
            DB::statement('ALTER TABLE smart_cases DROP COLUMN diagnosis_questions');
        }

        if (Schema::hasColumn('smart_cases', 'patient_context')) {
            DB::statement('ALTER TABLE smart_cases DROP COLUMN patient_context');
        }
    }
};
