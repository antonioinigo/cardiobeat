<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('smart_case_attempts')) {
            return;
        }

        DB::statement('CREATE TABLE smart_case_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            smart_case_id INT NOT NULL,
            submitted_answer TEXT NOT NULL,
            expected_answer VARCHAR(255) NULL,
            is_correct BOOLEAN DEFAULT FALSE,
            feedback TEXT,
            attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sca_user_case (user_id, smart_case_id),
            CONSTRAINT fk_sca_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_sca_case FOREIGN KEY (smart_case_id) REFERENCES smart_cases(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    public function down(): void
    {
        if (!Schema::hasTable('smart_case_attempts')) {
            return;
        }

        DB::statement('DROP TABLE smart_case_attempts');
    }
};
