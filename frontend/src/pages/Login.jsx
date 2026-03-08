import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Debes completar email y contraseña');
      return;
    }

    setError('');
    setMessage('');
    setShowResendVerification(false);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: normalizedEmail,
        password
      });

      const token = response.data?.token;
      const user = response.data?.user;

      if (!token || !user) {
        setError('La respuesta de inicio de sesión es inválida. Inténtalo de nuevo.');
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      onLogin(user, token);
      navigate('/profile');
    } catch (err) {
      const responseData = err.response?.data || {};
      setError(responseData?.error || 'Error al iniciar sesión');
      setShowResendVerification(responseData?.code === 'email_not_verified');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Introduce el email para reenviar la verificación.');
      return;
    }

    setResendingVerification(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('/api/auth/verify-email/resend', {
        email: normalizedEmail,
      });

      setMessage(response.data?.message || 'Correo de verificación reenviado.');
      setShowResendVerification(false);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo reenviar el correo de verificación.');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-grid">
          <div className="login-info">
            <h1>Bienvenido a CardioBeat</h1>
            <p>
              Inicia sesión para acceder a la biblioteca completa de sonidos cardíacos,
              casos clínicos y tu panel de progreso personalizado.
            </p>
            <div className="login-features">
              <div className="login-feature">
                <div className="check-icon">✓</div>
                <div>
                  <strong>Biblioteca completa</strong>
                  <p>Accede a todos los sonidos cardíacos</p>
                </div>
              </div>
              <div className="login-feature">
                <div className="check-icon">✓</div>
                <div>
                  <strong>Seguimiento de progreso</strong>
                  <p>Monitorea tu aprendizaje</p>
                </div>
              </div>
              <div className="login-feature">
                <div className="check-icon">✓</div>
                <div>
                  <strong>Casos clínicos</strong>
                  <p>Practica con casos reales</p>
                </div>
              </div>
            </div>
          </div>

          <div className="login-form-container">
            <div className="login-card">
              <h2>Iniciar Sesión</h2>
              
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="alert alert-success">
                  <CheckCircle2 size={20} />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@cardiobeat.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    <Lock size={18} />
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-full"
                  disabled={loading || !email.trim() || !password}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </form>

              {showResendVerification && (
                <button
                  type="button"
                  className="btn btn-ghost btn-full"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                >
                  {resendingVerification ? 'Reenviando...' : 'Reenviar verificación de email'}
                </button>
              )}

              <div className="login-helper">
                <p><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
                <p><Link to="/register">Crear una cuenta</Link></p>
                <p><strong>Cuenta demo:</strong></p>
                <p>Email: demo@cardiobeat.com</p>
                <p>Contraseña: cardio123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
