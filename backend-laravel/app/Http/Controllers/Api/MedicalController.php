<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use stdClass;

class MedicalController extends Controller
{
    private const CACHE_TTL_SECONDS = 900;

    private function localConditionFallback(string $terms, int $count): array
    {
        $matches = \Illuminate\Support\Facades\DB::select(
            'SELECT title, diagnosis FROM clinical_cases WHERE title LIKE ? OR diagnosis LIKE ? ORDER BY created_at DESC LIMIT ?',
            ['%'.$terms.'%', '%'.$terms.'%', $count]
        );

        $display = [];
        foreach ($matches as $item) {
            $display[] = [
                (string) ($item->title ?? 'Condición local'),
                (string) ($item->diagnosis ?? $item->title ?? 'Condición local'),
            ];
        }

        return [
            'source' => 'local-fallback',
            'total' => count($display),
            'codes' => [],
            'extra' => [
                'source_unavailable' => true,
                'fallback' => 'clinical_cases',
            ],
            'display' => $display,
        ];
    }

    private function emptyIcdFallback(): array
    {
        return [
            'source' => 'local-fallback',
            'total' => 0,
            'codes' => [],
            'extra' => [
                'source_unavailable' => true,
            ],
            'display' => [],
        ];
    }

    public function conditions(Request $request)
    {
        $terms = trim((string) $request->query('terms', ''));
        if ($terms === '') {
            return response()->json(['error' => 'El parámetro terms es obligatorio'], 400);
        }

        $count = max(1, min((int) $request->query('count', 10), 50));
        $cacheKey = 'medical:conditions:'.md5(mb_strtolower($terms).'|'.$count);

        $cached = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($terms, $count) {
            $response = Http::timeout(12)->get('https://clinicaltables.nlm.nih.gov/api/conditions/v3/search', [
                'terms' => $terms,
                'count' => $count,
                'df' => 'consumer_name,primary_name',
                'ef' => 'icd10cm_codes,synonyms,info_link_data'
            ]);

            if (!$response->ok()) {
                Log::warning('medical.conditions.provider_error', [
                    'terms' => $terms,
                    'count' => $count,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $payload = $response->json();

            return [
                'source' => 'clinicaltables-conditions',
                'total' => $payload[0] ?? 0,
                'codes' => $payload[1] ?? [],
                'extra' => $payload[2] ?? new stdClass(),
                'display' => $payload[3] ?? [],
            ];
        });

        if ($cached === null) {
            return response()->json($this->localConditionFallback($terms, $count));
        }

        return response()->json($cached);
    }

    public function icd10(Request $request)
    {
        $terms = trim((string) $request->query('terms', ''));
        if ($terms === '') {
            return response()->json(['error' => 'El parámetro terms es obligatorio'], 400);
        }

        $count = max(1, min((int) $request->query('count', 10), 50));
        $cacheKey = 'medical:icd10:'.md5(mb_strtolower($terms).'|'.$count);

        $cached = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($terms, $count) {
            $response = Http::timeout(12)->get('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search', [
                'terms' => $terms,
                'count' => $count,
                'sf' => 'code,name',
                'df' => 'code,name'
            ]);

            if (!$response->ok()) {
                Log::warning('medical.icd10.provider_error', [
                    'terms' => $terms,
                    'count' => $count,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $payload = $response->json();

            return [
                'source' => 'clinicaltables-icd10cm',
                'total' => $payload[0] ?? 0,
                'codes' => $payload[1] ?? [],
                'extra' => $payload[2] ?? new stdClass(),
                'display' => $payload[3] ?? [],
            ];
        });

        if ($cached === null) {
            return response()->json($this->emptyIcdFallback());
        }

        return response()->json($cached);
    }

    public function trainingCase(Request $request)
    {
        $terms = trim((string) $request->query('terms', ''));
        if ($terms === '') {
            return response()->json(['error' => 'El parámetro terms es obligatorio'], 400);
        }

        $count = max(1, min((int) $request->query('count', 5), 8));

        $cacheKey = 'medical:training-case:'.md5(mb_strtolower($terms).'|'.$count);

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return response()->json($cached);
        }

        $conditionSuggestions = [];
        $icd10Suggestions = [];
        $fhirConditions = [];
        $pubmedArticles = [];
        $clinicalTrials = [];
        $openfdaSignals = [];

        try {
            $conditionsResponse = Http::timeout(12)->get('https://clinicaltables.nlm.nih.gov/api/conditions/v3/search', [
                'terms' => $terms,
                'count' => $count,
                'df' => 'consumer_name,primary_name',
                'ef' => 'icd10cm_codes,synonyms,info_link_data',
            ]);

            if ($conditionsResponse->ok()) {
                $payload = $conditionsResponse->json();
                $displayRows = $payload[3] ?? [];
                $codes = $payload[1] ?? [];
                $extraCodes = data_get($payload, '2.icd10cm_codes', []);

                foreach ($displayRows as $index => $row) {
                    $displayName = $row[0] ?? $row[1] ?? 'Condición';
                    $clinicalName = $row[1] ?? $row[0] ?? $displayName;

                    $conditionSuggestions[] = [
                        'code' => $codes[$index] ?? null,
                        'displayName' => $displayName,
                        'clinicalName' => $clinicalName,
                        'suggestedIcd' => $extraCodes[$index] ?? null,
                    ];
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('medical.training_case.conditions_exception', [
                'terms' => $terms,
                'count' => $count,
                'message' => $exception->getMessage(),
            ]);
        }

        try {
            $icdResponse = Http::timeout(12)->get('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search', [
                'terms' => $terms,
                'count' => $count,
                'sf' => 'code,name',
                'df' => 'code,name',
            ]);

            if ($icdResponse->ok()) {
                $payload = $icdResponse->json();
                $displayRows = $payload[3] ?? [];

                foreach ($displayRows as $index => $row) {
                    $icd10Suggestions[] = [
                        'code' => $row[0] ?? data_get($payload, '1.'.$index) ?? null,
                        'name' => $row[1] ?? 'Código ICD-10',
                    ];
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('medical.training_case.icd10_exception', [
                'terms' => $terms,
                'count' => $count,
                'message' => $exception->getMessage(),
            ]);
        }

        try {
            $fhirResponse = Http::timeout(12)->get('https://hapi.fhir.org/baseR4/Condition', [
                '_count' => $count,
                '_summary' => 'true',
                'code:text' => $terms,
            ]);

            if ($fhirResponse->ok()) {
                $entries = data_get($fhirResponse->json(), 'entry', []);
                foreach ($entries as $entry) {
                    $resource = data_get($entry, 'resource', []);
                    $fhirConditions[] = [
                        'id' => data_get($resource, 'id'),
                        'clinicalStatus' => data_get($resource, 'clinicalStatus.coding.0.code'),
                        'verificationStatus' => data_get($resource, 'verificationStatus.coding.0.code'),
                        'label' => data_get($resource, 'code.text')
                            ?? data_get($resource, 'code.coding.0.display')
                            ?? 'Condición clínica',
                        'recordedDate' => data_get($resource, 'recordedDate'),
                        'sourceUrl' => 'https://hapi.fhir.org/baseR4/Condition/'.data_get($resource, 'id', ''),
                    ];
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('medical.training_case.fhir_exception', [
                'terms' => $terms,
                'count' => $count,
                'message' => $exception->getMessage(),
            ]);
        }

        try {
            $pubmedSearch = Http::timeout(12)->get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', [
                'db' => 'pubmed',
                'retmode' => 'json',
                'retmax' => $count,
                'sort' => 'relevance',
                'term' => $terms,
            ]);

            if ($pubmedSearch->ok()) {
                $ids = data_get($pubmedSearch->json(), 'esearchresult.idlist', []);
                if (!empty($ids)) {
                    $pubmedSummary = Http::timeout(12)->get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', [
                        'db' => 'pubmed',
                        'retmode' => 'json',
                        'id' => implode(',', $ids),
                    ]);

                    if ($pubmedSummary->ok()) {
                        $summaryPayload = $pubmedSummary->json();
                        foreach ($ids as $pmid) {
                            $item = data_get($summaryPayload, 'result.'.$pmid, []);
                            if (!is_array($item) || empty($item)) {
                                continue;
                            }

                            $pubmedArticles[] = [
                                'pmid' => (string) $pmid,
                                'title' => data_get($item, 'title', 'Artículo sin título'),
                                'journal' => data_get($item, 'fulljournalname') ?: data_get($item, 'source'),
                                'pubDate' => data_get($item, 'pubdate'),
                                'authors' => array_values(array_filter(array_map(
                                    fn ($author) => data_get($author, 'name'),
                                    data_get($item, 'authors', [])
                                ))),
                                'sourceUrl' => 'https://pubmed.ncbi.nlm.nih.gov/'.(string) $pmid.'/',
                            ];
                        }
                    }
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('medical.training_case.pubmed_exception', [
                'terms' => $terms,
                'count' => $count,
                'message' => $exception->getMessage(),
            ]);
        }

        try {
            $trialsResponse = Http::timeout(12)->get('https://clinicaltrials.gov/api/v2/studies', [
                'query.term' => $terms,
                'pageSize' => $count,
            ]);

            if ($trialsResponse->ok()) {
                $studies = data_get($trialsResponse->json(), 'studies', []);
                foreach ($studies as $study) {
                    $clinicalTrials[] = [
                        'nctId' => data_get($study, 'protocolSection.identificationModule.nctId'),
                        'title' => data_get($study, 'protocolSection.identificationModule.briefTitle', 'Ensayo clínico'),
                        'status' => data_get($study, 'protocolSection.statusModule.overallStatus'),
                        'phase' => data_get($study, 'protocolSection.designModule.phases.0'),
                        'conditions' => data_get($study, 'protocolSection.conditionsModule.conditions', []),
                        'sourceUrl' => 'https://clinicaltrials.gov/study/'.(string) data_get($study, 'protocolSection.identificationModule.nctId', ''),
                    ];
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('medical.training_case.clinicaltrials_exception', [
                'terms' => $terms,
                'count' => $count,
                'message' => $exception->getMessage(),
            ]);
        }

        try {
            $openFdaResponse = Http::timeout(12)->get('https://api.fda.gov/drug/label.json', [
                'search' => 'indications_and_usage:"'.$terms.'"',
                'limit' => $count,
            ]);

            if ($openFdaResponse->ok()) {
                $results = data_get($openFdaResponse->json(), 'results', []);
                foreach ($results as $item) {
                    $openfdaSignals[] = [
                        'brandName' => data_get($item, 'openfda.brand_name.0') ?? data_get($item, 'openfda.generic_name.0') ?? 'Medicamento',
                        'genericName' => data_get($item, 'openfda.generic_name.0'),
                        'indication' => data_get($item, 'indications_and_usage.0'),
                        'warnings' => data_get($item, 'warnings.0'),
                        'sourceUrl' => data_get($item, 'openfda.spl_set_id.0')
                            ? 'https://open.fda.gov/apis/drug/label/searchable-fields/'
                            : 'https://open.fda.gov/apis/drug/label/',
                    ];
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('medical.training_case.openfda_exception', [
                'terms' => $terms,
                'count' => $count,
                'message' => $exception->getMessage(),
            ]);
        }

        $primaryCondition = $conditionSuggestions[0] ?? [
            'displayName' => ucfirst($terms),
            'clinicalName' => ucfirst($terms),
            'suggestedIcd' => null,
        ];

        $icdHints = array_values(array_filter(array_unique(array_slice(array_filter([
            data_get($primaryCondition, 'suggestedIcd'),
            data_get($icd10Suggestions, '0.code'),
            data_get($icd10Suggestions, '1.code'),
            data_get($icd10Suggestions, '2.code'),
        ]), 0, 3))));

        $draftCase = [
            'title' => 'Entrenamiento clínico: '.data_get($primaryCondition, 'displayName', ucfirst($terms)),
            'patientContext' => 'Paciente en formación clínica con sospecha de '.mb_strtolower((string) data_get($primaryCondition, 'clinicalName', $terms)).' y necesidad de razonamiento diagnóstico estructurado.',
            'description' => 'Caso de entrenamiento generado con datos de terminología clínica, FHIR, literatura científica y ensayos clínicos para practicar diagnóstico diferencial y toma de decisiones basada en evidencia.',
            'symptoms' => 'Evalúa síntomas cardinales, signos de exploración, hallazgos de auscultación y correlación con pruebas complementarias para priorizar diagnósticos.',
            'diagnosisHint' => data_get($primaryCondition, 'clinicalName', ucfirst($terms)),
            'icdHint' => !empty($icdHints) ? implode(', ', $icdHints) : 'Sin códigos sugeridos',
            'sourceCondition' => data_get($primaryCondition, 'displayName', $terms),
            'sourceQuery' => $terms,
            'diagnosisQuestions' => [
                '¿Cuál es el diagnóstico diferencial inicial y qué datos clínicos lo sustentan?',
                '¿Qué hallazgos de auscultación, ECG o imagen cambiarían tu hipótesis principal?',
                '¿Qué plan terapéutico inicial propones y cómo lo justificarías con evidencia?',
            ],
        ];

        $result = [
            'query' => $terms,
            'generated_at' => now()->toISOString(),
            'education_only' => true,
            'condition_suggestions' => $conditionSuggestions,
            'icd10_suggestions' => $icd10Suggestions,
            'draft_case' => $draftCase,
            'resources' => [
                'fhir_conditions' => $fhirConditions,
                'pubmed_articles' => $pubmedArticles,
                'clinical_trials' => $clinicalTrials,
                'openfda_signals' => $openfdaSignals,
            ],
            'sources' => [
                'fhir' => 'https://hapi.fhir.org/baseR4',
                'pubmed' => 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
                'clinicaltrials' => 'https://clinicaltrials.gov/api/v2',
                'openfda' => 'https://api.fda.gov',
            ],
        ];

        Cache::put($cacheKey, $result, self::CACHE_TTL_SECONDS);

        return response()->json($result);
    }
}
