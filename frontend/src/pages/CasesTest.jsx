import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function CasesTest() {
  const [publishedSmartCases, setPublishedSmartCases] = useState([]);
  const [savedSmartCases, setSavedSmartCases] = useState([]);
  const [smartError, setSmartError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attemptAnswers, setAttemptAnswers] = useState({});
  const [attemptFeedback, setAttemptFeedback] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [loadingAttemptCaseId, setLoadingAttemptCaseId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const parseDiagnosisQuestions = (rawValue) => {
    if (!rawValue) return [];
    if (Array.isArray(rawValue)) return rawValue.filter(Boolean);
    if (typeof rawValue === 'string') {
      try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch { return []; }
    }
    return [];
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [pubRes, savRes] = await Promise.allSettled([
        axios.get('/api/smart-cases'),
        token ? axios.get('/api/smart-cases/saved', { headers: getAuthHeaders() }) : Promise.resolve({ data: [] })
      ]);
      if (pubRes.status === 'fulfilled') setPublishedSmartCases(pubRes.value.data || []);
      if (savRes.status === 'fulfilled') setSavedSmartCases(savRes.value.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const checkDiagnosisAttempt = async (item) => {
    const caseId = item.id;
    const answer = (attemptAnswers[caseId] || '').trim();
    if (!answer) {
      setAttemptFeedback(prev => ({ ...prev, [caseId]: 'Escribe algo primero.' }));
      return;
    }
    setLoadingAttemptCaseId(caseId);
    try {
      const response = await axios.post(`/api/smart-cases/${caseId}/attempts`, { submitted_answer: answer }, { headers: getAuthHeaders() });
      setAttemptFeedback(prev => ({ ...prev, [caseId]: response.data?.feedback || 'Evaluado' }));
    } catch (e) {
      setAttemptFeedback(prev => ({ ...prev, [caseId]: 'Error al evaluar' }));
    } finally { setLoadingAttemptCaseId(null); }
  };

  const renderCaseBlock = (item, keyPrefix) => (
    <div key={`${keyPrefix}-${item.id}`} className="card glass" style={{ marginBottom: '32px', padding: '24px' }}>
      <div className="simulator-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div className="simulator-context-panel">
          <h2 style={{ color: 'var(--brand-red)', marginTop: 0 }}>{item.title}</h2>
          <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <h4>Historia Clínica</h4>
            <p>{item.patient_context || item.description}</p>
            {item.symptoms && (<><h4>Síntomas</h4><p>{item.symptoms}</p></>)}
          </div>
        </div>

        <div className="simulator-test-panel">
          <p className="smart-quiz-title" style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '16px' }}>Reto Diagnóstico</p>
          <ul style={{ marginBottom: '24px' }}>
            {parseDiagnosisQuestions(item.diagnosis_questions).map((q, i) => <li key={i}>{q}</li>)}
          </ul>

          <textarea
            className="messages-search-input"
            value={attemptAnswers[item.id] || ''}
            onChange={(e) => setAttemptAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
            placeholder="Escribe tu diagnóstico..."
            rows={4}
            style={{ width: '100%', marginBottom: '16px', borderRadius: '12px', padding: '16px' }}
          />
          
          <button
            className="btn btn-primary"
            onClick={() => checkDiagnosisAttempt(item)}
            disabled={loadingAttemptCaseId === item.id}
            style={{ width: '100%', padding: '16px', fontSize: '18px', marginBottom: '16px' }}
          >
            {loadingAttemptCaseId === item.id ? 'Evaluando...' : 'Comprobar'}
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-outline" onClick={() => setRevealedHints(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
              {revealedHints[item.id] ? 'Ocultar respuesta' : 'Ver respuesta'}
            </button>
          </div>

          {attemptFeedback[item.id] && (
            <div className="simulator-feedback-badge" style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(230,31,59,0.1)' }}>
              {attemptFeedback[item.id]}
            </div>
          )}

          {revealedHints[item.id] && (
            <div className="simulator-feedback-badge" style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--brand-teal)', backgroundColor: 'rgba(53,183,196,0.1)' }}>
              <strong>✅ Respuesta / Orientación:</strong>
              <p>{item.diagnosis_hint || 'No disponible'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="cases-page guest-info-page">
      <div className="container">
        <section className="guest-hero" style={{ marginBottom: '40px' }}>
          <h1>Casos Tipo Test</h1>
          <Link to="/cases" className="btn btn-ghost">← Volver a Casos</Link>
        </section>

        {publishedSmartCases.map(item => renderCaseBlock(item, 'pub'))}
      </div>
    </div>
  );
}
