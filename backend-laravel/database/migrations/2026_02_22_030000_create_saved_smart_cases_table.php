<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('saved_smart_cases')) {
            return;
        }

        DB::statement('CREATE TABLE saved_smart_cases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            smart_case_id INT NOT NULL,
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_saved_case (user_id, smart_case_id),
            INDEX idx_saved_user (user_id),
            INDEX idx_saved_case (smart_case_id),
            CONSTRAINT fk_saved_cases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_saved_cases_case FOREIGN KEY (smart_case_id) REFERENCES smart_cases(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    public function down(): void
    {
        if (!Schema::hasTable('saved_smart_cases')) {
            return;
        }

        DB::statement('DROP TABLE saved_smart_cases');
    }
};
