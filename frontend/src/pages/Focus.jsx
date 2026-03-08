import { useEffect, useState } from 'react';
import axios from 'axios';
import { Target, ChevronRight, Sparkles, HeartPulse, ShieldAlert, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Focus() {
  const [focus, setFocus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFocus();
  }, []);

  const loadFocus = async () => {
    try {
      const response = await axios.get('/api/focus');
      setFocus(response.data);
    } catch (error) {
      console.error('Error cargando focos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando focos cardíacos...</div>;
  }

  return (
    <div className="guest-info-page">
      <div className="container">
        {/* HERO SECTION */}
        <section className="guest-hero">
          <div>
            <p className="eyebrow">Módulo de focos & Anatomía</p>
            <h1>Focos de Auscultación Cardíaca</h1>
            <p className="lead">
              Aprende dónde colocar el fonendo y qué hallazgos esperar en cada zona de auscultación.
              Es la base para interpretar sonidos, casos clínicos y simulación de ECG con seguridad.
            </p>
            <div className="hero-actions">
              <Link to="/sounds" className="btn btn-primary">Ir a sonidos</Link>
              <Link to="/cases" className="btn btn-ghost">Práctica de casos</Link>
            </div>
          </div>
          <div className="guest-hero-visual" style={{ background: 'transparent', padding: '10px' }}>
            <img 
              src="illustrations/auscultation_points.png" 
              alt="Anatomía y puntos de auscultación" 
              style={{ boxShadow: '0 16px 32px rgba(15,27,52,0.12)', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}
            />
          </div>
        </section>

        {/* TÉCNICA DE AUSCULTACIÓN (NUEVA SECCIÓN) */}
        <section className="assistant-section" style={{ paddingTop: '20px' }}>
          <div className="assistant-grid">
            <div>
              <h2>Técnica de Auscultación Correcta</h2>
              <p className="lead">
                Coloca la campana suavemente sobre la piel para ruidos de baja frecuencia, 
                o presiona el diafragma firmemente para captar ruidos de alta frecuencia.
              </p>
              
              <div className="assistant-panel" style={{ marginTop: '24px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                  <CheckCircle size={20} /> Mejores Prácticas
                </h4>
                <ul style={{ marginTop: '16px' }}>
                  <li>Pide al paciente que respire normalmente o que sostenga la respiración breves segundos.</li>
                  <li>Inicia en la zona aórtica y sigue un recorrido en "Z" por los 5 focos hasta el mitral.</li>
                  <li>Usa un entorno silencioso y asegúrate de que el estetoscopio toque directamente la piel.</li>
                </ul>
              </div>
            </div>
            
            <div className="guest-hero-visual" style={{ background: 'transparent' }}>
              <img 
                src="illustrations/stethoscope_usage.png" 
                alt="Técnica de uso del estetoscopio" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>
        </section>

        {/* LISTADO DE FOCOS BASE DE DATOS */}
        <div className="focus-intro guest-feature-list" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(53, 183, 196, 0.1)', padding: '24px', borderRadius: '16px' }}>
            <ShieldAlert size={40} color="var(--brand-teal)" />
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--brand-teal-dark)' }}>El Recorrido Oficial</h3>
              <p style={{ margin: 0 }}>
                A continuación se detallan los 5 puntos anatómicos clave que debes evaluar en todo examen cardiovascular completo, 
                ordenados para seguir un flujo de diagnóstico óptimo.
              </p>
            </div>
          </div>
        </div>

        <div className="focus-list" style={{ marginTop: '40px' }}>
          {focus.map((item) => (
            <div key={item.id} className="focus-item guest-feature-item" style={{ marginBottom: '20px' }}>
              <div className="focus-number guest-feature-number">{item.id}</div>
              
              <div className="focus-content">
                <div className="focus-main">
                  <h3>{item.name}</h3>
                  <div className="focus-location" style={{ color: 'var(--brand-teal-dark)', fontWeight: '600' }}>
                    <HeartPulse size={16} />
                    <span>{item.location}</span>
                  </div>
                  {item.abbreviation && (
                    <div className="focus-abbr" style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--bg)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      {item.abbreviation}
                    </div>
                  )}
                </div>

                <p className="focus-description" style={{ marginTop: '12px', lineHeight: '1.6' }}>{item.description}</p>

                {item.sound_count > 0 && (
                  <div className="focus-sounds" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-red)', fontWeight: '600', fontSize: '14px' }}>
                    <ChevronRight size={16} />
                    <span>{item.sound_count} sonidos disponibles en biblioteca</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {focus.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <Target size={64} color="var(--muted)" style={{ margin: '0 auto 16px' }} />
            <h3>No hay focos configurados</h3>
            <p>Los focos anatómicos se mostrarán una vez la base de datos sea inicializada por un administrador.</p>
          </div>
        )}
      </div>
    </div>
  );
}
