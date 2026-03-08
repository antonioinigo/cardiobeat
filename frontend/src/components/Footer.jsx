import { Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../cardiobeat-logo.jpg';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src={logo} alt="CardioBeat" className="footer-logo" />
              <span>CardioBeat</span>
            </div>
            <p className="footer-desc">
              Asistente digital para aprendizaje de auscultación cardíaca con casos,
              focos y ejemplos auditivos de práctica clínica.
            </p>
          </div>

          <div>
            <h4>Menú</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/focus">Focos Cardíacos</Link></li>
              <li><Link to="/cases">Casos Clínicos</Link></li>
            </ul>
          </div>

          <div>
            <h4>Comprar CardioBeat</h4>
            <ul className="footer-links">
              <li><Link to="/login">Probar demo</Link></li>
              <li><Link to="/login">Iniciar sesión</Link></li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">Política de Privacidad</Link></li>
              <li><Link to="/terms">Términos de Uso</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="social-links">
            <a href="https://www.facebook.com/CardioBeatAsistente" target="_blank" rel="noopener noreferrer">
              <Facebook size={18} />
            </a>
            <a href="https://www.instagram.com/cardiobeat.asistente/" target="_blank" rel="noopener noreferrer">
              <Instagram size={18} />
            </a>
          </div>
          <p>© {currentYear} CardioBeat. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
