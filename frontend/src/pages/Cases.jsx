import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const createEmptyDraftCase = () => ({
  title: '',
  patientContext: '',
  description: '',
  symptoms: '',
  diagnosisHint: '',
  icdHint: '',
  sourceCondition: '',
  sourceQuery: '',
  diagnosisQuestions: ['', '', '']
});

export default function Cases() {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const userRole = currentUser?.role || null;
  const canPublishSmartCases = ['professional', 'admin'].includes(userRole);
  const isAdmin = userRole === 'admin';

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [icd10List, setIcd10List] = useState([]);
  const [trainingResources, setTrainingResources] = useState(null);
  const [trainingEducationOnly, setTrainingEducationOnly] = useState(false);
  const [smartError, setSmartError] = useState('');
  const [draftCase, setDraftCase] = useState(createEmptyDraftCase);
  const [smartMessage, setSmartMessage] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [moderatingId, setModeratingId] = useState(null);
  const [mySmartCases, setMySmartCases] = useState([]);
  const [publishedSmartCases, setPublishedSmartCases] = useState([]);
  const [pendingModerationCases, setPendingModerationCases] = useState([]);
  const [savedSmartCases, setSavedSmartCases] = useState([]);
  const [savedCaseId, setSavingCaseId] = useState(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);

  useEffect(() => {
    loadPublishedSmartCases();
    loadMySmartCases();
    loadSavedSmartCases();
    if (isAdmin) {
      loadPendingModerationCases();
    }
  }, []);

  const savedSmartCaseIds = useMemo(() => new Set(savedSmartCases.map((item) => Number(item.id))), [savedSmartCases]);
  const publishedSavedSmartCases = useMemo(
    () => publishedSmartCases.filter((item) => savedSmartCaseIds.has(Number(item.id))),
    [publishedSmartCases, savedSmartCaseIds]
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadMySmartCases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMySmartCases([]);
        return;
      }

      const response = await axios.get('/api/smart-cases/mine', {
        headers: getAuthHeaders()
      });

      setMySmartCases(response.data || []);
    } catch (error) {
      console.error('Error cargando mis casos inteligentes:', error);
      setMySmartCases([]);
    }
  };

  const loadPublishedSmartCases = async () => {
    try {
      const response = await axios.get('/api/smart-cases');
      setPublishedSmartCases(response.data || []);
    } catch (error) {
      console.error('Error cargando casos inteligentes publicados:', error);
      setPublishedSmartCases([]);
    }
  };

  const loadPendingModerationCases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPendingModerationCases([]);
        return;
      }

      const response = await axios.get('/api/smart-cases/moderation/pending', {
        headers: getAuthHeaders()
      });

      setPendingModerationCases(response.data || []);
    } catch (error) {
      console.error('Error cargando casos pendientes de moderación:', error);
      setPendingModerationCases([]);
    }
  };

  const loadSavedSmartCases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSavedSmartCases([]);
        return;
      }

      const response = await axios.get('/api/smart-cases/saved', {
        headers: getAuthHeaders()
      });

      setSavedSmartCases(response.data || []);
    } catch (error) {
      console.error('Error cargando casos guardados:', error);
      setSavedSmartCases([]);
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'published') return 'Publicado';
    if (status === 'pending_review') return 'Pendiente de revisión';
    if (status === 'rejected') return 'Rechazado';
    return 'Borrador';
  };

  const isTrainingGeneratedCase = (item) => {
    const title = String(item?.title || '');
    return title.startsWith('Entrenamiento clínico:');
  };

  const buildConditionRows = (payload) => {
    const displayRows = payload?.display || [];
    const codes = payload?.codes || [];
    const extraCodes = payload?.extra?.icd10cm_codes || [];

    return displayRows.map((row, index) => {
      const displayName = row?.[0] || row?.[1] || 'Condición';
      const clinicalName = row?.[1] || row?.[0] || displayName;
      const code = codes[index] || null;
      const suggestedIcd = extraCodes[index] || '';

      return {
        code,
        displayName,
        clinicalName,
        suggestedIcd
      };
    });
  };

  const buildIcdRows = (payload) => {
    const displayRows = payload?.display || [];

    return displayRows.map((row, index) => ({
      code: row?.[0] || payload?.codes?.[index] || '',
      name: row?.[1] || 'Código ICD-10'
    }));
  };

  const parseDiagnosisQuestions = (rawValue) => {
    if (!rawValue) return [];
    if (Array.isArray(rawValue)) {
      return rawValue.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof rawValue === 'string') {
      try {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item || '').trim()).filter(Boolean);
        }
      } catch {
        return [];
      }
    }

    return [];
  };

  const toggleSaveSmartCase = async (caseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSmartError('Debes iniciar sesión para guardar casos de interés.');
      return;
    }

    setSavingCaseId(caseId);
    setSmartError('');

    try {
      if (savedSmartCaseIds.has(Number(caseId))) {
        await axios.delete(`/api/smart-cases/${caseId}/save`, {
          headers: getAuthHeaders()
        });
      } else {
        await axios.post(`/api/smart-cases/${caseId}/save`, {}, {
          headers: getAuthHeaders()
        });
      }

      await loadSavedSmartCases();
    } catch (error) {
      console.error('Error actualizando guardado de caso:', error);
      setSmartError(error.response?.data?.error || 'No se pudo actualizar el guardado del caso.');
    } finally {
      setSavingCaseId(null);
    }
  };

  const updateDraftField = (field, value) => {
    setDraftCase((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDiagnosisQuestion = (index, value) => {
    setDraftCase((prev) => {
      const nextQuestions = [...(prev.diagnosisQuestions || [])];
      nextQuestions[index] = value;
      return {
        ...prev,
        diagnosisQuestions: nextQuestions
      };
    });
  };

  const addDiagnosisQuestion = () => {
    setDraftCase((prev) => ({
      ...prev,
      diagnosisQuestions: [...(prev.diagnosisQuestions || []), '']
    }));
  };

  const removeDiagnosisQuestion = (indexToRemove) => {
    setDraftCase((prev) => {
      const nextQuestions = (prev.diagnosisQuestions || []).filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        diagnosisQuestions: nextQuestions.length > 0 ? nextQuestions : ['']
      };
    });
  };

  const buildSmartCasePayload = (caseDraft, status = 'draft') => {
    const cleanQuestions = (caseDraft?.diagnosisQuestions || [])
      .map((question) => String(question || '').trim())
      .filter(Boolean);

    return {
      title: caseDraft?.title || '',
      patient_context: caseDraft?.patientContext || '',
      description: caseDraft?.description || '',
      symptoms: caseDraft?.symptoms || '',
      diagnosis_questions: cleanQuestions,
      diagnosis_hint: caseDraft?.diagnosisHint || '',
      icd_hint: caseDraft?.icdHint || '',
      source_condition: caseDraft?.sourceCondition || '',
      source_query: caseDraft?.sourceQuery || '',
      status
    };
  };

  const searchSmartCases = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    setSearching(true);
    setSmartError('');
    setSmartMessage('');
    setTrainingResources(null);
    setTrainingEducationOnly(false);

    try {
      const [conditionsResponse, icdResponse] = await Promise.all([
        axios.get('/api/medical/conditions', {
          params: { terms: query, count: 6 }
        }),
        axios.get('/api/medical/icd10', {
          params: { terms: query, count: 6 }
        })
      ]);

      setConditions(buildConditionRows(conditionsResponse.data));
      setIcd10List(buildIcdRows(icdResponse.data));
    } catch (error) {
      console.error('Error consultando APIs médicas:', error);
      setSmartError('No se pudo consultar la API médica externa. Puedes crear casos manualmente o usar casos publicados mientras se recupera el servicio.');
      setConditions([]);
      setIcd10List([]);
      setTrainingEducationOnly(false);
    } finally {
      setSearching(false);
    }
  };

  const generateTrainingCase = async () => {
    if (!query.trim()) {
      return;
    }

    setTrainingLoading(true);
    setSmartError('');
    setSmartMessage('');

    try {
      const response = await axios.get('/api/medical/training-case', {
        params: { terms: query, count: 5 }
      });

      const payload = response.data || {};
      const nextDraftCase = payload.draft_case || createEmptyDraftCase();

      setConditions(payload.condition_suggestions || []);
      setIcd10List(payload.icd10_suggestions || []);
      setTrainingResources(payload.resources || null);
      setTrainingEducationOnly(Boolean(payload.education_only));
      setDraftCase(nextDraftCase);

      let message = 'Entrenamiento generado con evidencia clínica (FHIR, PubMed, ClinicalTrials y openFDA).';
      const token = localStorage.getItem('token');
      const autoStatus = userRole === 'admin'
        ? 'published'
        : (userRole === 'professional' ? 'pending_review' : 'draft');

      if (token && nextDraftCase.title?.trim() && nextDraftCase.description?.trim()) {
        try {
          await axios.post('/api/smart-cases', buildSmartCasePayload(nextDraftCase, autoStatus), {
            headers: getAuthHeaders()
          });

          loadMySmartCases();
          message = autoStatus === 'published'
            ? 'Entrenamiento generado y publicado automáticamente.'
            : (autoStatus === 'pending_review'
              ? 'Entrenamiento generado y enviado automáticamente a revisión.'
              : 'Entrenamiento generado y guardado automáticamente como borrador.');
        } catch (saveError) {
          console.error('Error guardando borrador automático:', saveError);
          message = 'Entrenamiento generado, pero no se pudo guardar automáticamente el borrador.';
        }
      }

      setSmartMessage(message);
    } catch (error) {
      console.error('Error generando entrenamiento clínico:', error);
      setSmartError('No se pudo generar el entrenamiento clínico en este momento. Inténtalo de nuevo.');
      setTrainingResources(null);
      setTrainingEducationOnly(false);
    } finally {
      setTrainingLoading(false);
    }
  };

  const generateDraftCase = (condition) => {
    const matchingCodes = icd10List.slice(0, 2).map((item) => item.code).filter(Boolean);
    const suggestedCodes = [condition.suggestedIcd, ...matchingCodes]
      .filter(Boolean)
      .join(', ');

    setDraftCase({
      title: `Caso sugerido: ${condition.displayName}`,
      patientContext: `Paciente adulto con antecedentes cardiovasculares en evaluación por cuadro de ${condition.clinicalName}.`,
      description: `Paciente con cuadro compatible con ${condition.clinicalName}. Evalúa antecedentes, auscultación, ECG y evolución clínica para orientar diagnóstico diferencial.`,
      symptoms: `Disnea de esfuerzo, palpitaciones y fatiga progresiva. Considerar examen cardiovascular completo y correlación con hallazgos de auscultación.`,
      diagnosisHint: condition.clinicalName,
      icdHint: suggestedCodes || 'Sin códigos sugeridos',
      sourceCondition: condition.displayName,
      sourceQuery: query.trim(),
      diagnosisQuestions: [
        `¿Cuál es el diagnóstico diferencial principal para ${condition.displayName}?`,
        '¿Qué hallazgos de auscultación y ECG apoyarían el diagnóstico más probable?',
        '¿Qué prueba complementaria priorizarías para confirmar el diagnóstico?'
      ]
    });
  };

  const saveDraftCase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSmartError('Debes iniciar sesión para guardar borradores.');
      return;
    }

    if (!draftCase.title.trim() || !draftCase.description.trim()) {
      setSmartError('Título y descripción son obligatorios para guardar el caso.');
      return;
    }

    setSavingDraft(true);
    setSmartError('');
    setSmartMessage('');

    try {
      await axios.post('/api/smart-cases', buildSmartCasePayload(draftCase), {
        headers: getAuthHeaders()
      });

      setSmartMessage('Borrador guardado correctamente.');
      loadMySmartCases();
    } catch (error) {
      console.error('Error guardando borrador:', error);
      setSmartError(error.response?.data?.error || 'No se pudo guardar el borrador.');
    } finally {
      setSavingDraft(false);
    }
  };

  const publishSmartCase = async (id) => {
    setPublishingId(id);
    setSmartError('');
    setSmartMessage('');

    try {
      const response = await axios.put(`/api/smart-cases/${id}/publish`, {}, {
        headers: getAuthHeaders()
      });

      setSmartMessage(response?.data?.message || 'Caso actualizado correctamente.');
      loadMySmartCases();
      loadPublishedSmartCases();
      if (isAdmin) {
        loadPendingModerationCases();
      }
    } catch (error) {
      console.error('Error publicando caso:', error);
      setSmartError(error.response?.data?.error || 'No se pudo publicar el caso.');
    } finally {
      setPublishingId(null);
    }
  };

  const moderateSmartCase = async (id, action) => {
    setModeratingId(id);
    setSmartError('');
    setSmartMessage('');

    try {
      const response = await axios.put(`/api/smart-cases/${id}/moderate`, {
        action
      }, {
        headers: getAuthHeaders()
      });

      setSmartMessage(response?.data?.message || 'Moderación aplicada correctamente.');
      loadPendingModerationCases();
      loadPublishedSmartCases();
      loadMySmartCases();
    } catch (error) {
      console.error('Error moderando caso:', error);
      setSmartError(error.response?.data?.error || 'No se pudo moderar el caso.');
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className="cases-page guest-info-page">
      <div className="container">
        <section className="guest-hero" style={{ marginBottom: '32px' }}>
          <div>
            <p className="eyebrow">Módulo Educativo</p>
            <h1>Casos Clínicos</h1>
            <p className="lead">
              Crea, organiza y publica casos clínicos para la formación de estudiantes y profesionales.
              Genera patologías con IA basada en ICD-10.
            </p>
            <div className="hero-actions">
              <Link to="/cases/test" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px' }}>
                Ir a práctica de casos (Test)
              </Link>
            </div>
          </div>
          <div className="guest-hero-visual" style={{ background: 'transparent', padding: '10px' }}>
            <div style={{ padding: '30px', background: 'var(--panel)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--brand-teal)', opacity: 0.2 }}></div>
                <div style={{ flex: 1, height: '40px', borderRadius: '10px', background: 'var(--bg)' }}></div>
              </div>
              <div style={{ height: '80px', borderRadius: '10px', background: 'var(--bg)', marginBottom: '16px' }}></div>
              <div style={{ height: '40px', width: '60%', borderRadius: '10px', background: 'rgba(230, 31, 59, 0.1)' }}></div>
            </div>
          </div>
        </section>

        <section className="smart-cases-panel profile-section glass" style={{ padding: '32px' }}>
          <div className="smart-cases-header">
            <h2>Casos prácticos inteligentes</h2>
            <p>Busca patologías y genera borradores para tu repositorio de casos con apoyo de terminología médica (ICD-10).</p>
          </div>

          <form className="smart-cases-form" onSubmit={searchSmartCases}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ejemplo: mitral stenosis, pericarditis, atrial fibrillation"
            />
            <div className="smart-cases-form-actions">
              <button type="submit" className="btn btn-primary" disabled={searching || trainingLoading || !query.trim()}>
                {searching ? 'Buscando...' : 'Buscar casos'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={generateTrainingCase}
                disabled={trainingLoading || searching || !query.trim()}
              >
                {trainingLoading ? 'Generando entrenamiento...' : 'Generar entrenamiento'}
              </button>
            </div>
          </form>

          {smartError && <p className="smart-error">{smartError}</p>}
          {smartMessage && <p className="smart-success">{smartMessage}</p>}

          {(searching || trainingLoading) && (
            <p className="smart-muted smart-loading-inline">
              {trainingLoading
                ? 'Recopilando evidencia clínica y construyendo borrador...'
                : 'Buscando terminología clínica e ICD-10...'}
            </p>
          )}

          {trainingEducationOnly && (
            <div className="smart-education-note">
              Este contenido es solo para entrenamiento académico y no sustituye juicio clínico profesional.
            </div>
          )}

          {(conditions.length > 0 || icd10List.length > 0) && (
            <div className="smart-results-grid">
              <div className="smart-card">
                <h3>Condiciones sugeridas</h3>
                <ul>
                  {conditions.map((condition, index) => (
                    <li key={`${condition.code || condition.displayName}-${index}`}>
                      <div>
                        <strong>{condition.displayName}</strong>
                        <p>{condition.clinicalName}</p>
                      </div>
                      <button
                        type="button"
                        className="smart-link-btn"
                        onClick={() => generateDraftCase(condition)}
                      >
                        Generar caso
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="smart-card">
                <h3>Códigos ICD-10</h3>
                <ul>
                  {icd10List.map((item, index) => (
                    <li key={`${item.code}-${index}`}>
                      <strong>{item.code}</strong>
                      <p>{item.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {trainingResources && (
            <div className="smart-card smart-card-full">
              <h3>Entrenamiento basado en evidencia</h3>

              <div className="training-summary">
                <span>FHIR: {trainingResources.fhir_conditions?.length || 0}</span>
                <span>PubMed: {trainingResources.pubmed_articles?.length || 0}</span>
                <span>ClinicalTrials: {trainingResources.clinical_trials?.length || 0}</span>
                <span>openFDA: {trainingResources.openfda_signals?.length || 0}</span>
              </div>

              <div className="smart-results-grid training-grid">
                <div className="smart-card">
                  <h3>FHIR (casos clínicos)</h3>
                  {trainingResources.fhir_conditions?.length ? (
                    <ul>
                      {trainingResources.fhir_conditions.slice(0, 4).map((item, index) => (
                        <li key={`fhir-${item.id || index}`}>
                          <strong>{item.label || 'Condición clínica'}</strong>
                          <p>{item.clinicalStatus || 'Estado no disponible'}</p>
                          {item.sourceUrl && (
                            <a className="smart-resource-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              Ver recurso
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="smart-muted">Sin resultados FHIR para esta búsqueda.</p>
                  )}
                </div>

                <div className="smart-card">
                  <h3>PubMed (evidencia)</h3>
                  {trainingResources.pubmed_articles?.length ? (
                    <ul>
                      {trainingResources.pubmed_articles.slice(0, 4).map((item) => (
                        <li key={`pubmed-${item.pmid}`}>
                          <strong>{item.title || 'Artículo científico'}</strong>
                          <p>{item.journal || 'Revista no disponible'}</p>
                          {item.sourceUrl && (
                            <a className="smart-resource-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              Abrir en PubMed
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="smart-muted">Sin artículos de PubMed para esta búsqueda.</p>
                  )}
                </div>

                <div className="smart-card">
                  <h3>ClinicalTrials</h3>
                  {trainingResources.clinical_trials?.length ? (
                    <ul>
                      {trainingResources.clinical_trials.slice(0, 4).map((item, index) => (
                        <li key={`trial-${item.nctId || index}`}>
                          <strong>{item.title || 'Ensayo clínico'}</strong>
                          <p>{item.status || 'Estado no disponible'}</p>
                          {item.sourceUrl && (
                            <a className="smart-resource-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              Ver ensayo
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="smart-muted">Sin ensayos clínicos para esta búsqueda.</p>
                  )}
                </div>

                <div className="smart-card">
                  <h3>openFDA (seguridad)</h3>
                  {trainingResources.openfda_signals?.length ? (
                    <ul>
                      {trainingResources.openfda_signals.slice(0, 4).map((item, index) => (
                        <li key={`fda-${item.brandName || index}`}>
                          <strong>{item.brandName || 'Medicamento'}</strong>
                          <p>{item.genericName || 'Genérico no disponible'}</p>
                          {item.sourceUrl && (
                            <a className="smart-resource-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
                              Ver fuente
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="smart-muted">Sin registros de openFDA para esta búsqueda.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="draft-case">
            <h3>Constructor de caso clínico</h3>

            <label>Título del caso</label>
            <input
              type="text"
              value={draftCase.title}
              onChange={(event) => updateDraftField('title', event.target.value)}
              placeholder="Ejemplo: Caso sugerido: Estenosis Mitral"
            />

            <label>Contexto del paciente</label>
            <textarea
              rows={2}
              value={draftCase.patientContext}
              onChange={(event) => updateDraftField('patientContext', event.target.value)}
              placeholder="Edad, antecedentes, motivo de consulta y contexto clínico inicial"
            />

            <label>Descripción del cuadro médico</label>
            <textarea
              rows={3}
              value={draftCase.description}
              onChange={(event) => updateDraftField('description', event.target.value)}
              placeholder="Describe el cuadro clínico y su evolución"
            />

            <label>Síntomas y signos</label>
            <textarea
              rows={3}
              value={draftCase.symptoms}
              onChange={(event) => updateDraftField('symptoms', event.target.value)}
              placeholder="Síntomas orientativos, signos físicos y hallazgos relevantes"
            />

            <label>Pista diagnóstica</label>
            <input
              type="text"
              value={draftCase.diagnosisHint}
              onChange={(event) => updateDraftField('diagnosisHint', event.target.value)}
              placeholder="Diagnóstico más probable o hipótesis principal"
            />

            <label>Códigos ICD sugeridos</label>
            <input
              type="text"
              value={draftCase.icdHint}
              onChange={(event) => updateDraftField('icdHint', event.target.value)}
              placeholder="Ejemplo: I34.0, I05.0"
            />

            <label>Preguntas diagnósticas</label>
            <div className="diagnosis-questions-list">
              {(draftCase.diagnosisQuestions || []).map((question, index) => (
                <div key={`dq-${index}`} className="diagnosis-question-row">
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => updateDiagnosisQuestion(index, event.target.value)}
                    placeholder={`Pregunta diagnóstica ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="smart-link-btn smart-link-btn-danger"
                    onClick={() => removeDiagnosisQuestion(index)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="smart-inline-actions">
              <button
                type="button"
                className="smart-link-btn"
                onClick={addDiagnosisQuestion}
              >
                Añadir pregunta
              </button>
            </div>

            <div className="draft-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveDraftCase}
                disabled={savingDraft}
              >
                {savingDraft ? 'Guardando...' : 'Guardar borrador'}
              </button>
            </div>
          </div>

          {mySmartCases.length > 0 && (
            <div className="smart-card smart-card-full">
              <h3>Mis casos inteligentes</h3>
              <ul>
                {mySmartCases.map((item) => (
                  <li key={`mine-${item.id}`}>
                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedCaseDetail(item)}>
                      <div className="smart-title-row">
                        <strong>{item.title}</strong>
                        {isTrainingGeneratedCase(item) && (
                          <span className="smart-badge">Entrenamiento automático</span>
                        )}
                      </div>
                      <p>{item.diagnosis_hint || 'Sin pista diagnóstica'}</p>
                      <p>Preguntas diagnósticas: {parseDiagnosisQuestions(item.diagnosis_questions).length}</p>
                      <p>Estado: {getStatusLabel(item.status)}</p>
                    </div>
                    <div className="smart-inline-actions">
                      <button type="button" className="smart-link-btn" onClick={() => setSelectedCaseDetail(item)}>Ver completo</button>
                      {item.status !== 'published' && item.status !== 'pending_review' && canPublishSmartCases && (
                        <button
                          type="button"
                          className="smart-link-btn"
                          onClick={() => publishSmartCase(item.id)}
                          disabled={publishingId === item.id}
                        >
                          {publishingId === item.id
                            ? (isAdmin ? 'Publicando...' : 'Enviando...')
                            : (isAdmin ? 'Publicar' : 'Enviar a revisión')}
                        </button>
                      )}
                      {item.status !== 'published' && item.status !== 'pending_review' && !canPublishSmartCases && (
                        <p className="smart-muted">Solo rol profesional/admin puede publicar</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {savedSmartCases.length > 0 && (
            <div className="smart-card smart-card-full">
              <h3>Casos guardados para revisión</h3>
              <ul>
                {savedSmartCases.map((item) => (
                  <li key={`saved-${item.id}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedCaseDetail(item)}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.patient_context || item.description}</p>
                      <p>Autor: {item.author_name || 'Equipo docente'}</p>
                    </div>
                    <div className="smart-inline-actions">
                      <button type="button" className="smart-link-btn" onClick={() => setSelectedCaseDetail(item)}>Ver completo</button>
                      <button
                        type="button"
                        className="smart-link-btn smart-link-btn-danger"
                        onClick={(e) => { e.stopPropagation(); toggleSaveSmartCase(item.id); }}
                        disabled={savingCaseId === item.id}
                      >
                        {savingCaseId === item.id ? 'Actualizando...' : 'Quitar de guardados'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAdmin && (
            <div className="smart-card smart-card-full">
              <h3>Moderación de casos pendientes</h3>
              {pendingModerationCases.length === 0 ? (
                <p className="smart-muted">No hay casos pendientes de revisión.</p>
              ) : (
                <ul>
                  {pendingModerationCases.map((item) => (
                    <li key={`pending-${item.id}`}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <p>Autor: {item.author_name || 'Sin nombre'}</p>
                      </div>
                      <div className="smart-inline-actions">
                        <button
                          type="button"
                          className="smart-link-btn"
                          onClick={() => moderateSmartCase(item.id, 'approve')}
                          disabled={moderatingId === item.id}
                        >
                          {moderatingId === item.id ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          type="button"
                          className="smart-link-btn smart-link-btn-danger"
                          onClick={() => moderateSmartCase(item.id, 'reject')}
                          disabled={moderatingId === item.id}
                        >
                          {moderatingId === item.id ? 'Procesando...' : 'Rechazar'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {publishedSavedSmartCases.length > 0 && (
            <div className="smart-card smart-card-full">
              <h3>Casos publicados guardados</h3>
              <ul>
                {publishedSavedSmartCases.slice(0, 8).map((item) => (
                  <li key={`pub-${item.id}`}>
                    <div>
                      <div className="smart-title-row">
                        <strong>{item.title}</strong>
                        {isTrainingGeneratedCase(item) && (
                          <span className="smart-badge">Entrenamiento automático</span>
                        )}
                      </div>
                      <p>{item.description}</p>
                      {parseDiagnosisQuestions(item.diagnosis_questions).length > 0 && (
                        <p>
                          Preguntas: {parseDiagnosisQuestions(item.diagnosis_questions).slice(0, 2).join(' · ')}
                        </p>
                      )}
                      <p>Autor: {item.author_name || 'Equipo docente'}</p>
                    </div>

                    <button
                      type="button"
                      className="smart-link-btn"
                      onClick={() => toggleSaveSmartCase(item.id)}
                      disabled={savingCaseId === item.id}
                    >
                      {savingCaseId === item.id
                        ? 'Actualizando...'
                        : (savedSmartCaseIds.has(Number(item.id)) ? 'Guardado ✓' : 'Guardar para revisar')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
      {selectedCaseDetail && (
        <div className="modal-overlay" onClick={() => setSelectedCaseDetail(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          padding: '24px'
        }}>
          <div className="modal-content card glass" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            padding: '40px', position: 'relative'
          }}>
            <button
              onClick={() => setSelectedCaseDetail(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}
            >
              ✕
            </button>
            <h2 style={{ color: 'var(--brand-red)', marginBottom: '24px' }}>{selectedCaseDetail.title}</h2>
            
            <div className="case-detail-section" style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--brand-teal)' }}>Contexto del Paciente</h4>
              <p>{selectedCaseDetail.patient_context || 'No disponible'}</p>
            </div>
            
            <div className="case-detail-section" style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--brand-teal)' }}>Descripción</h4>
              <p>{selectedCaseDetail.description}</p>
            </div>
            
            {selectedCaseDetail.symptoms && (
              <div className="case-detail-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--brand-teal)' }}>Síntomas</h4>
                <p>{selectedCaseDetail.symptoms}</p>
              </div>
            )}
            
            <div className="case-detail-section" style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--brand-teal)' }}>Pista Diagnóstica (Solo autores)</h4>
              <p style={{ fontStyle: 'italic' }}>{selectedCaseDetail.diagnosis_hint || 'No disponible'}</p>
            </div>

            <div className="case-detail-section">
              <h4 style={{ color: 'var(--brand-teal)' }}>Preguntas Diagnósticas</h4>
              <ul>
                {parseDiagnosisQuestions(selectedCaseDetail.diagnosis_questions).map((q, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{q}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSelectedCaseDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
