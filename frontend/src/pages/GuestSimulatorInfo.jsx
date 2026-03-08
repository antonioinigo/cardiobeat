import { Link } from 'react-router-dom';
import { Activity, LineChart, Gauge, Sparkles } from 'lucide-react';

export default function GuestSimulatorInfo() {
  return (
    <div className="guest-info-page">
      <div className="container">
        <section className="guest-hero">
          <div>
            <p className="eyebrow">Módulo ECG</p>
            <h1>Simulador ECG</h1>
            <p className="lead">
              Practica interpretación electrocardiográfica con escenarios clínicos de entrenamiento.
              Regístrate para acceder al simulador completo y mejorar precisión diagnóstica.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">Acceder para desbloquear</Link>
              <Link to="/focus" className="btn btn-ghost">Ver focos abiertos</Link>
            </div>
          </div>
          <div className="guest-hero-visual">
            <img src="/illustrations/guest-ecg.svg" alt="Vista previa del simulador ECG" />
            <div className="guest-hero-badge">
              <Sparkles size={16} />
              <span>Interpretación ECG guiada</span>
            </div>
          </div>
        </section>

        <div className="guest-info-grid">
          <div className="guest-info-card">
            <h3>Escenarios clínicos</h3>
            <p>Contexto práctico para entrenar toma de decisiones con trazados ECG.</p>
          </div>
          <div className="guest-info-card">
            <h3>Patrones y ritmos</h3>
            <p>Reconoce alteraciones frecuentes y hallazgos de riesgo en menos tiempo.</p>
          </div>
          <div className="guest-info-card">
            <h3>Entrenamiento progresivo</h3>
            <p>Avanza por niveles para consolidar velocidad y seguridad diagnóstica.</p>
          </div>
        </div>

        <div className="guest-feature-list">
          <div className="guest-feature-item">
            <div className="guest-feature-number">1</div>
            <div>
              <div className="focus-main">
                <h3>Escenarios de práctica</h3>
                <div className="focus-location">
                  <Activity size={16} />
                  <span>Casos ECG en contexto clínico</span>
                </div>
              </div>
              <p className="focus-description">Entrena con situaciones que simulan decisiones reales de consulta y urgencias.</p>
            </div>
          </div>

          <div className="guest-feature-item">
            <div className="guest-feature-number">2</div>
            <div>
              <div className="focus-main">
                <h3>Interpretación de ritmos</h3>
                <div className="focus-location">
                  <LineChart size={16} />
                  <span>Reconocimiento de patrones</span>
                </div>
              </div>
              <p className="focus-description">Analiza trazados y diferencia alteraciones frecuentes y hallazgos críticos.</p>
            </div>
          </div>

          <div className="guest-feature-item">
            <div className="guest-feature-number">3</div>
            <div>
              <div className="focus-main">
                <h3>Práctica guiada</h3>
                <div className="focus-location">
                  <Gauge size={16} />
                  <span>Mejora progresiva del rendimiento</span>
                </div>
              </div>
              <p className="focus-description">Sigue una ruta de entrenamiento para ganar precisión y rapidez diagnóstica.</p>
            </div>
          </div>
        </div>

        <div className="smart-inline-actions" style={{ marginTop: '16px' }}>
          <Link to="/login" className="btn btn-primary">Acceder para desbloquear simulador</Link>
        </div>
      </div>
    </div>
  );
}
