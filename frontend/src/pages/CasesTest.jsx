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

        <div className="simulator-test-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="smart-quiz-title" style={{ fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '20px', color: 'var(--cardiobeat-turquoise)' }}>Reto Diagnóstico</p>
          <ul style={{ marginBottom: '24px', paddingLeft: '20px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            {parseDiagnosisQuestions(item.diagnosis_questions).map((q, i) => <li key={i} style={{ marginBottom: '8px' }}>{q}</li>)}
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <textarea
              value={attemptAnswers[item.id] || ''}
              onChange={(e) => setAttemptAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
              placeholder="Describa los hallazgos auscultatorios y proponga su diagnóstico diferencial..."
              rows={7}
              style={{ 
                width: '100%', 
                borderRadius: '8px', 
                padding: '24px',
                backgroundColor: '#ffffff',
                border: '2px solid #e1e8ed',
                color: '#2c3e50',
                fontSize: '16px',
                fontFamily: 'var(--font-primary, "Inter", sans-serif)',
                lineHeight: '1.7',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.2s ease-in-out'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--cardiobeat-turquoise)';
                e.target.style.boxShadow = '0 4px 15px rgba(91, 190, 199, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
              }}
            />
            
            <button
              className="btn btn-primary"
              onClick={() => checkDiagnosisAttempt(item)}
              disabled={loadingAttemptCaseId === item.id}
              style={{ 
                width: '100%', 
                padding: '18px', 
                fontSize: '18px', 
                fontWeight: 'bold',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(227, 30, 36, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {loadingAttemptCaseId === item.id ? 'Evaluando...' : 'Comprobar Diagnóstico'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setRevealedHints(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                style={{ borderRadius: '10px', padding: '10px 24px' }}
              >
                {revealedHints[item.id] ? 'Ocultar respuesta' : 'Ver respuesta correcta'}
              </button>
            </div>
          </div>

          {attemptFeedback[item.id] && (
            <div className="simulator-feedback-badge" style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(230,31,59,0.08)', border: '1px solid rgba(230,31,59,0.2)', color: 'var(--cardiobeat-red)', fontWeight: '500' }}>
              {attemptFeedback[item.id]}
            </div>
          )}

          {revealedHints[item.id] && (
            <div className="simulator-feedback-badge" style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', borderLeft: '6px solid var(--brand-teal)', backgroundColor: 'rgba(53,183,196,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--brand-teal)' }}>✅ Respuesta / Orientación:</strong>
              <p style={{ margin: 0, lineHeight: '1.5' }}>{item.diagnosis_hint || 'No disponible'}</p>
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
