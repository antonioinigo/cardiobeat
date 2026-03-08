import { Link } from 'react-router-dom';
import { Heart, Stethoscope, Book, CheckCircle, ClipboardCheck, Activity, Volume2 } from 'lucide-react';

export default function Home({ user }) {
  const focusItems = [
    'Foco aórtico',
    'Foco pulmonar',
    'Foco tricuspídeo',
    'Foco mitral',
    'Foco aórtico accesorio',
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <p className="eyebrow">Cardiología clínica · ECG · Focos reales</p>
              <h1>No volverás a tener dudas al auscultar a tu paciente</h1>
              <p className="lead">
                CardioBeat te ayudará a través de ejemplos con pacientes reales.
                Practica con casos reales, localiza el foco correcto y escucha los ruidos
                en alta fidelidad.
              </p>
              <div className="hero-actions">
                {user ? (
                  <Link to="/sounds" className="btn btn-primary">
                    Ir a sonidos
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-primary">
                    Probar demo
                  </Link>
                )}
                {user ? (
                  <Link to="/profile" className="btn btn-ghost">
                    Ir al perfil
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-ghost btn-sm">
                    Acceder
                  </Link>
                )}
              </div>
            </div>
            <div className="hero-image">
              <div className="pulse-card glass custom-hero-glass">
                <div className="pulse-dot"></div>
                <div className="pulse-card-content">
                  <Activity size={24} color="var(--brand-red)" />
                  <span>Monitoreando ruidos cardíacos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="assistant-section">
        <div className="container assistant-grid">
          <div>
            <h2>Tu asistente de auscultación</h2>
            <p>
              Entrena como si tuvieras a tu lado a un cardiólogo experimentado.
              Compara sonidos normales y patológicos, identifica patrones y
              gana seguridad clínica en cada exploración.
            </p>
            <p>
              CardioBeat está diseñado para estudio guiado con móvil y auriculares,
              priorizando ejemplos reales y toma de decisiones clínicas.
            </p>
          </div>
          <div className="assistant-panel">
            <h4>Lo que incluye</h4>
            <ul>
              <li>Biblioteca de ruidos y soplos</li>
              <li>Casos clínicos con dificultad progresiva</li>
              <li>Mapa de focos de auscultación</li>
              <li>Simulador ECG para práctica activa</li>
            </ul>
          </div>
        </div>
      </section>

      {!user && (
        <section className="home-explore-section">
          <div className="container">
            <div className="home-explore-head">
              <h2>Explora antes de registrarte</h2>
              <p className="section-desc">
                Consulta qué incluye cada módulo y qué podrás desbloquear con tu cuenta.
              </p>
            </div>
            <div className="home-explore-grid">
              <article className="home-explore-card">
                <img className="home-explore-thumb" src="/illustrations/home-cases.svg" alt="Casos clínicos y actividades" />
                <div className="feature-icon">
                  <ClipboardCheck />
                </div>
                <h3>Casos y actividades</h3>
                <p>Entrenamiento clínico con práctica tipo test, guardado y revisión de casos.</p>
                <Link to="/cases" className="btn btn-ghost btn-sm">Ver información</Link>
              </article>

              <article className="home-explore-card">
                <img className="home-explore-thumb" src="/illustrations/home-sounds.svg" alt="Biblioteca de sonidos cardíacos" />
                <div className="feature-icon">
                  <Volume2 />
                </div>
                <h3>Sonidos cardíacos</h3>
                <p>Biblioteca de ejemplos reales para entrenar oído clínico y reconocimiento.</p>
                <Link to="/sounds" className="btn btn-ghost btn-sm">Ver información</Link>
              </article>

              <article className="home-explore-card">
                <img className="home-explore-thumb" src="/illustrations/home-ecg.svg" alt="Simulador ECG interactivo" />
                <div className="feature-icon">
                  <Activity />
                </div>
                <h3>Simulador ECG</h3>
                <p>Práctica de interpretación electrocardiográfica con enfoque progresivo.</p>
                <Link to="/simulador" className="btn btn-ghost btn-sm">Ver información</Link>
              </article>
            </div>
          </div>
        </section>
      )}

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">
                <Stethoscope size={32} color="var(--brand-teal)" />
              </div>
              <h3>Localización 3D</h3>
              <p>Aprende a colocar el fonendo en cada foco cardíaco guiado por expertos.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <Heart size={32} color="var(--brand-red)" />
              </div>
              <h3>Audio HD</h3>
              <p>Grabaciones reales optimizadas para auriculares con alta fidelidad y sin ruido de fondo.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <Book size={32} color="var(--brand-teal)" />
              </div>
              <h3>Guías Rápidas</h3>
              <p>Manejo de maniobras clínicas y técnicas de exploración completas.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <CheckCircle size={32} color="var(--brand-red)" />
              </div>
              <h3>Casos Clínicos</h3>
              <p>Modo simulador con pruebas de evaluación y feedback al instante.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="detection">
        <div className="container">
          <h2>¿Qué podrás detectar con CardioBeat?</h2>
          <p className="section-desc">
            Gracias a CardioBeat podrás detectar fácilmente los siguientes tipos de soplo
          </p>
          <div className="detection-grid">
            <div className="detection-item">Estenosis mitral</div>
            <div className="detection-item">Insuficiencia mitral</div>
            <div className="detection-item">Valvulopatía mitral doble</div>
            <div className="detection-item">Insuficiencia tricuspídea</div>
            <div className="detection-item">Estenosis aórtica</div>
            <div className="detection-item">Insuficiencia aórtica</div>
            <div className="detection-item">Valvulopatía aórtica doble</div>
            <div className="detection-item">Persistencia del ductus</div>
            <div className="detection-item">Comunicación interventricular</div>
            <div className="detection-item">Comunicación interauricular</div>
            <div className="detection-item">Estenosis pulmonar</div>
            <div className="detection-item">Roce pericárdico</div>
          </div>
        </div>
      </section>

      <section className="focus-preview">
        <div className="container">
          <h2>Focos de auscultación</h2>
          <p className="section-desc">
            Aprende dónde colocar el fonendo y qué válvula evaluar en cada foco.
          </p>
          <div className="focus-grid">
            {focusItems.map((item) => (
              <article key={item} className="focus-item-card">
                <h3>{item}</h3>
                <p>Contenido guiado, localización anatómica y correlación acústica.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="opinions">
        <div className="container">
          <h2>Qué se dice de CardioBeat</h2>
          <p className="section-desc">Especialistas y estudiantes que ya lo utilizan en práctica clínica.</p>
          <div className="opinions-grid">
            <blockquote>
              “Herramienta muy útil para estudiantes y médicos en primera línea.”
            </blockquote>
            <blockquote>
              “Me ayudó a reconocer soplos con más seguridad en consulta.”
            </blockquote>
            <blockquote>
              “Aprendizaje práctico, directo y fácil de aplicar al paciente real.”
            </blockquote>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div>
              <h2>¿Listo para escuchar de verdad?</h2>
              <p>Activa tu cuenta y sigue la ruta guiada de CardioBeat</p>
            </div>
            <Link to="/login" className="btn btn-primary">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
