import { Link } from 'react-router-dom';
import { ClipboardCheck, BookmarkCheck, FilePlus2, Sparkles } from 'lucide-react';

export default function GuestCasesInfo() {
  return (
    <div className="guest-info-page">
      <div className="container">
        <section className="guest-hero">
          <div>
            <p className="eyebrow">Módulo de casos</p>
            <h1>Casos clínicos y actividades</h1>
            <p className="lead">
              Entrena razonamiento diagnóstico con una experiencia orientada a práctica real.
              Regístrate para desbloquear resolución tipo test, historial y creación de casos.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">Acceder para desbloquear</Link>
              <Link to="/focus" className="btn btn-ghost">Ver focos abiertos</Link>
            </div>
          </div>
          <div className="guest-hero-visual">
            <img src="/illustrations/guest-cases.svg" alt="Vista previa del módulo de casos clínicos" />
            <div className="guest-hero-badge">
              <Sparkles size={16} />
              <span>Práctica clínica guiada</span>
            </div>
          </div>
        </section>

        <div className="guest-info-grid">
          <div className="guest-info-card">
            <h3>Qué obtienes al registrarte</h3>
            <p>Acceso completo a actividades de diagnóstico y seguimiento personal del progreso.</p>
          </div>
          <div className="guest-info-card">
            <h3>Para quién está pensado</h3>
            <p>Estudiantes, residentes y profesionales que quieren entrenar decisiones clínicas.</p>
          </div>
          <div className="guest-info-card">
            <h3>Enfoque de aprendizaje</h3>
            <p>Práctica breve, feedback inmediato y revisión de casos guardados.</p>
          </div>
        </div>

        <div className="guest-feature-list">
          <div className="guest-feature-item">
            <div className="guest-feature-number">1</div>
            <div>
              <div className="focus-main">
                <h3>Práctica tipo test</h3>
                <div className="focus-location">
                  <ClipboardCheck size={16} />
                  <span>Resuelve casos con feedback inmediato</span>
                </div>
              </div>
              <p className="focus-description">Compara tu hipótesis diagnóstica con la solución esperada y revisa pistas clínicas.</p>
            </div>
          </div>

          <div className="guest-feature-item">
            <div className="guest-feature-number">2</div>
            <div>
              <div className="focus-main">
                <h3>Guardado y revisión</h3>
                <div className="focus-location">
                  <BookmarkCheck size={16} />
                  <span>Organiza tus casos de interés</span>
                </div>
              </div>
              <p className="focus-description">Guarda casos para repasarlos después y consolidar aprendizaje por repetición.</p>
            </div>
          </div>

          <div className="guest-feature-item">
            <div className="guest-feature-number">3</div>
            <div>
              <div className="focus-main">
                <h3>Creación de casos</h3>
                <div className="focus-location">
                  <FilePlus2 size={16} />
                  <span>Construye tu repositorio clínico</span>
                </div>
              </div>
              <p className="focus-description">Genera borradores, edita contenido y publica casos para formación clínica.</p>
            </div>
          </div>
        </div>

        <div className="smart-inline-actions" style={{ marginTop: '22px' }}>
          <Link to="/login" className="btn btn-primary">Acceder para desbloquear casos</Link>
        </div>
      </div>
    </div>
  );
}
