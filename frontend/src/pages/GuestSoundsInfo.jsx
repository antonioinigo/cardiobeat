import { Link } from 'react-router-dom';
import { Headphones, Volume2, Layers, Sparkles } from 'lucide-react';

export default function GuestSoundsInfo() {
  return (
    <div className="guest-info-page">
      <div className="container">
        <section className="guest-hero">
          <div>
            <p className="eyebrow">Módulo de sonidos</p>
            <h1>Biblioteca de sonidos cardíacos</h1>
            <p className="lead">
              Aprende a diferenciar ruidos normales y patológicos con grabaciones de entrenamiento.
              Regístrate para acceder a la biblioteca completa y a práctica auditiva guiada.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">Acceder para desbloquear</Link>
              <Link to="/focus" className="btn btn-ghost">Ver focos abiertos</Link>
            </div>
          </div>
          <div className="guest-hero-visual">
            <img src="/illustrations/guest-sounds.svg" alt="Vista previa de la biblioteca de sonidos" />
            <div className="guest-hero-badge">
              <Sparkles size={16} />
              <span>Entrenamiento auditivo HD</span>
            </div>
          </div>
        </section>

        <div className="guest-info-grid">
          <div className="guest-info-card">
            <h3>Escucha clínica real</h3>
            <p>Audios preparados para reconocer matices y patrones relevantes en auscultación.</p>
          </div>
          <div className="guest-info-card">
            <h3>Organización por focos</h3>
            <p>Relaciona sonidos con su localización anatómica y contexto clínico.</p>
          </div>
          <div className="guest-info-card">
            <h3>Práctica continua</h3>
            <p>Repite sesiones cortas para consolidar memoria auditiva diagnóstica.</p>
          </div>
        </div>

        <div className="guest-feature-list">
          <div className="guest-feature-item">
            <div className="guest-feature-number">1</div>
            <div>
              <div className="focus-main">
                <h3>Audio clínico real</h3>
                <div className="focus-location">
                  <Headphones size={16} />
                  <span>Escucha con calidad optimizada</span>
                </div>
              </div>
              <p className="focus-description">Accede a registros sonoros para entrenamiento práctico con auriculares.</p>
            </div>
          </div>

          <div className="guest-feature-item">
            <div className="guest-feature-number">2</div>
            <div>
              <div className="focus-main">
                <h3>Comparación por focos</h3>
                <div className="focus-location">
                  <Volume2 size={16} />
                  <span>Diferencia sonidos por localización</span>
                </div>
              </div>
              <p className="focus-description">Relaciona cada hallazgo acústico con su foco de auscultación correspondiente.</p>
            </div>
          </div>

          <div className="guest-feature-item">
            <div className="guest-feature-number">3</div>
            <div>
              <div className="focus-main">
                <h3>Entrenamiento progresivo</h3>
                <div className="focus-location">
                  <Layers size={16} />
                  <span>De básico a avanzado</span>
                </div>
              </div>
              <p className="focus-description">Practica en una secuencia diseñada para consolidar identificación de soplos y ruidos.</p>
            </div>
          </div>
        </div>

        <div className="smart-inline-actions" style={{ marginTop: '16px' }}>
          <Link to="/login" className="btn btn-primary">Acceder para desbloquear sonidos</Link>
        </div>
      </div>
    </div>
  );
}
