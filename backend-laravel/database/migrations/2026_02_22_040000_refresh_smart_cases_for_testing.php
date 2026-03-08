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

        if (Schema::hasTable('saved_smart_cases')) {
            DB::statement('DELETE FROM saved_smart_cases');
        }

        DB::statement('DELETE FROM smart_cases');

        $admin = DB::select('SELECT id FROM users WHERE role = ? ORDER BY id ASC LIMIT 1', ['admin']);
        $authorId = !empty($admin) ? (int) $admin[0]->id : 1;

        $now = now()->toDateTimeString();

        $cases = [
            [
                'title' => 'Caso test 1: Dolor torácico con ST elevado',
                'patient_context' => 'Varón de 58 años, fumador, HTA, dolor torácico opresivo de 50 minutos.',
                'description' => 'Acude a urgencias con dolor retroesternal irradiado a brazo izquierdo, diaforesis y náuseas.',
                'symptoms' => 'Dolor torácico, diaforesis, náuseas, ansiedad, hipotensión inicial.',
                'diagnosis_questions' => json_encode([
                    '¿Cuál es tu diagnóstico diferencial inicial?',
                    '¿Qué hallazgo ECG esperas en las derivaciones inferiores?',
                    '¿Qué tratamiento inmediato priorizas en los primeros minutos?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Infarto agudo de miocardio con elevación del ST',
                'icd_hint' => 'I21.9',
                'source_query' => 'acute coronary syndrome STEMI',
                'source_condition' => 'Síndrome coronario agudo',
            ],
            [
                'title' => 'Caso test 2: Disnea progresiva y edema',
                'patient_context' => 'Mujer de 72 años con antecedente de IAM previo y fibrilación auricular.',
                'description' => 'Presenta disnea de esfuerzo progresiva, ortopnea y edema maleolar bilateral.',
                'symptoms' => 'Disnea, ortopnea, edema periférico, fatiga, crepitantes bibasales.',
                'diagnosis_questions' => json_encode([
                    '¿Qué entidad clínica explica mejor el cuadro?',
                    '¿Qué parámetro del ecocardiograma te ayuda a clasificar la disfunción?',
                    '¿Qué ajuste terapéutico harías hoy?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Insuficiencia cardiaca descompensada',
                'icd_hint' => 'I50.9',
                'source_query' => 'heart failure decompensated',
                'source_condition' => 'Insuficiencia cardiaca',
            ],
            [
                'title' => 'Caso test 3: Fiebre y nuevo soplo',
                'patient_context' => 'Paciente de 41 años con antecedente de consumo IV y fiebre persistente.',
                'description' => 'Aparece soplo nuevo con hemocultivos positivos y signos embólicos periféricos.',
                'symptoms' => 'Fiebre, astenia, soplo nuevo, petequias, dolor pleurítico.',
                'diagnosis_questions' => json_encode([
                    '¿Cuál es el diagnóstico sindrómico más probable?',
                    '¿Qué prueba de imagen es clave para confirmar?',
                    '¿Qué estrategia antimicrobiana inicial propones?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Endocarditis infecciosa',
                'icd_hint' => 'I33.0',
                'source_query' => 'infective endocarditis',
                'source_condition' => 'Endocarditis',
            ],
            [
                'title' => 'Caso test 4: Palpitaciones y síncope en joven',
                'patient_context' => 'Varón de 23 años deportista, síncope durante entrenamiento intenso.',
                'description' => 'Refiere palpitaciones previas y antecedentes familiares de muerte súbita.',
                'symptoms' => 'Palpitaciones, síncope de esfuerzo, disnea leve, antecedente familiar positivo.',
                'diagnosis_questions' => json_encode([
                    '¿Qué cardiopatía hereditaria sospechas primero?',
                    '¿Qué hallazgo ecocardiográfico reforzaría tu hipótesis?',
                    '¿Qué medida de prevención secundaria valorarías?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Miocardiopatía hipertrófica',
                'icd_hint' => 'I42.2',
                'source_query' => 'hypertrophic cardiomyopathy syncope',
                'source_condition' => 'Miocardiopatía hipertrófica',
            ],
            [
                'title' => 'Caso test 5: Dolor pleurítico y roce pericárdico',
                'patient_context' => 'Mujer de 35 años con infección respiratoria reciente y dolor torácico posicional.',
                'description' => 'El dolor mejora al inclinarse hacia adelante y empeora en decúbito.',
                'symptoms' => 'Dolor torácico pleurítico, febrícula, roce pericárdico, malestar general.',
                'diagnosis_questions' => json_encode([
                    '¿Qué diagnóstico explica mejor la clínica?',
                    '¿Qué patrón esperas en el ECG seriado?',
                    '¿Cuál es el tratamiento antiinflamatorio de primera línea?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Pericarditis aguda',
                'icd_hint' => 'I30.9',
                'source_query' => 'acute pericarditis',
                'source_condition' => 'Pericarditis',
            ],
        ];

        foreach ($cases as $case) {
            DB::insert(
                'INSERT INTO smart_cases (created_by, title, patient_context, description, symptoms, diagnosis_questions, diagnosis_hint, icd_hint, source_query, source_condition, status, created_at, updated_at, published_at, reviewed_by, reviewed_at, reviewer_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "published", ?, ?, ?, ?, ?, NULL)',
                [
                    $authorId,
                    $case['title'],
                    $case['patient_context'],
                    $case['description'],
                    $case['symptoms'],
                    $case['diagnosis_questions'],
                    $case['diagnosis_hint'],
                    $case['icd_hint'],
                    $case['source_query'],
                    $case['source_condition'],
                    $now,
                    $now,
                    $now,
                    $authorId,
                    $now,
                ]
            );
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('smart_cases')) {
            return;
        }

        DB::statement('DELETE FROM smart_cases WHERE title LIKE "Caso test %"');
    }
};
