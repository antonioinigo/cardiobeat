<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SmartCaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Obtenemos el ID del primer administrador o profesional para asignarle los casos
        $authorId = DB::table('users')->where('role', 'admin')->value('id') ?? 1;

        $cases = [
            [
                'created_by' => $authorId,
                'title' => 'Caso Práctico 1: Disnea progresiva en paciente mayor',
                'patient_context' => 'Paciente varón de 72 años, antecedente de hipertensión arterial de larga data, acude a urgencias por disnea de esfuerzo que ha progresado en las últimas semanas hasta hacerse de pequeños esfuerzos. Refiere episodios esporádicos de mareo.',
                'description' => 'A la exploración, la presión arterial es de 145/90 mmHg. Los pulsos periféricos son simétricos pero de ascenso lento (parvus et tardus). El ECG no muestra alteraciones isquémicas agudas, pero hay signos de hipertrofia ventricular izquierda.',
                'symptoms' => 'Disnea de pequeños esfuerzos, síncope ocasional, dolor torácico (angina) no tipificado.',
                'diagnosis_questions' => json_encode([
                    '¿Qué hallazgo semiológico en el cuello apoyarías buscar?',
                    'Describa el soplo característico asociado a esta patología.',
                    '¿Qué foco de auscultación priorizarías para confirmar tu sospecha?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Estenosis Aórtica Severa',
                'icd_hint' => 'I35.0',
                'source_query' => 'aortic stenosis',
                'source_condition' => 'Estenosis Aórtica',
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $authorId,
                'title' => 'Caso Práctico 2: Paciente joven con palpitaciones',
                'patient_context' => 'Mujer de 34 años, sin antecedentes médicos de interés. Consulta en centro de salud por episodios de "vuelco en el corazón" y fatiga. Refiere que en la infancia le informaron de un "soplo inocente".',
                'description' => 'Tensión arterial 110/70. Pulso irregular. En la auscultación cardíaca destaca un clic mesosistólico seguido de un soplo sistólico tardío.',
                'symptoms' => 'Palpitaciones ocasionales, fatiga, ansiedad leve.',
                'diagnosis_questions' => json_encode([
                    '¿En qué válvula se origina el soplo descrito?',
                    '¿Qué modificación acústica se espera al poner al paciente en cuclillas?',
                    '¿Cuál es el diagnóstico diferencial principal?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Prolapso de la Válvula Mitral',
                'icd_hint' => 'I34.1',
                'source_query' => 'mitral valve prolapse',
                'source_condition' => 'Prolapso Mitral',
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $authorId,
                'title' => 'Caso Práctico 3: Fiebre y soplo de nueva aparición',
                'patient_context' => 'Varón de 45 años, con antecedente de uso de drogas intravenosas (UDIV). Acude refiriendo fiebre (38.5ºC) de 5 días de evolución, mialgias y malestar general.',
                'description' => 'En urgencias, se observa palidez y microhemorragias subungueales. La auscultación revela un soplo pansistólico en el foco mitral que irradia hacia la axila, no documentado previamente.',
                'symptoms' => 'Fiebre persistente, mialgias, sudoración nocturna, lesiones cutáneas sutiles.',
                'diagnosis_questions' => json_encode([
                    '¿Qué microorganismo es el patógeno causal más frecuente en este contexto?',
                    '¿Cómo se denominan las lesiones nodulares dolorosas en los pulpejos de los dedos de este paciente?',
                    '¿Cuál es tu hipótesis diagnóstica principal?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Endocarditis Infecciosa (Afectación Mitral)',
                'icd_hint' => 'I33.0',
                'source_query' => 'infective endocarditis mitral',
                'source_condition' => 'Endocarditis',
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $authorId,
                'title' => 'Caso Práctico 4: Dolor precordial agudo (El "Elefante" en el pecho)',
                'patient_context' => 'Paciente varón, 58 años, fumador e hipertenso. Acude a emergencias quejándose de un dolor torácico opresivo de intensidad 9/10, irradiado al brazo izquierdo y mandíbula, de aparición en reposo hace 45 minutos.',
                'description' => 'El paciente está diaforético y ansioso. PA 160/95. Se realiza auscultación que muestra cuarto ruido (R4) pero sin soplos evidentes. El ECG muestra elevación del segmento ST (>2mm) en las derivaciones II, III, y aVF.',
                'symptoms' => 'Dolor opresivo retroesternal, diaforesis, cortejo vegetativo.',
                'diagnosis_questions' => json_encode([
                    'Basado en el ECG, ¿qué territorio coronario está afectado?',
                    '¿A qué arteria coronaria corresponde principalmente esta afectación?',
                    'Mencione la indicación de reperfusión de urgencia en este caso.'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Infarto Agudo de Miocardio con Elevación del ST (IAMCEST) Inferior',
                'icd_hint' => 'I21.19',
                'source_query' => 'inferior STEMI',
                'source_condition' => 'Infarto de Miocardio',
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $authorId,
                'title' => 'Caso Práctico 5: Disnea paroxística y ortopnea',
                'patient_context' => 'Mujer de 80 años con fibrilación auricular crónica. Acude refiriendo que se ha despertado bruscamente sintiendo que se ahoga (disnea paroxística nocturna). Duerme con 3 almohadas.',
                'description' => 'A la exploración: taquipnea (28 rpm), saturación de oxígeno 88% aire ambiente. Auscultación pulmonar: crepitantes bilaterales hasta campos medios. Auscultación cardíaca: ritmo irregular, se ausculta un tercer ruido (R3).',
                'symptoms' => 'Disnea aguda profunda, ortopnea, sensación de muerte inminente.',
                'diagnosis_questions' => json_encode([
                    '¿A qué se debe la aparición fisiopatológica de la Ortopnea?',
                    '¿Qué indica la presencia del tercer ruido (R3) en este contexto?',
                    '¿Cuál es el paso diagnóstico y terapéutico inmediato?'
                ], JSON_UNESCAPED_UNICODE),
                'diagnosis_hint' => 'Edema Agudo de Pulmón (Insuficiencia Cardíaca Descompensada)',
                'icd_hint' => 'J81.0, I50.1',
                'source_query' => 'acute pulmonary edema failure',
                'source_condition' => 'Insuficiencia Cardíaca / Edema Pulmonar',
                'status' => 'published',
                'published_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        DB::table('smart_cases')->insert($cases);
    }
}
