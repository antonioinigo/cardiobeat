import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [email, setEmail] = useState(params.get('email') || '');
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleValidateToken = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !token.trim()) {
      setError('Completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/password/validate-token', {
        email: email.trim().toLowerCase(),
        token: token.trim(),
      });

      setTokenValidated(true);
      setMessage(response.data?.message || 'Token válido. Ya puedes definir tu nueva contraseña.');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo validar el token.');
      setTokenValidated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!password || !passwordConfirmation) {
      setError('Completa ambos campos de contraseña.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/password/reset', {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      setMessage(response.data?.message || 'Contraseña actualizada correctamente.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-grid">
          <div className="login-info">
            <h1>Cambiar contraseña</h1>
            <p>
              Primero valida tu email y token. Después podrás escribir dos veces la nueva contraseña.
            </p>
          </div>

          <div className="login-form-container">
            <div className="login-card">
              <h2>{tokenValidated ? 'Nueva contraseña' : 'Validar token'}</h2>

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

              {!tokenValidated ? (
                <form onSubmit={handleValidateToken}>
                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={18} />
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="token">
                      <Lock size={18} />
                      Token de recuperación
                    </label>
                    <input
                      id="token"
                      type="text"
                      value={token}
                      onChange={(event) => setToken(event.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Validando...' : 'Validar token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label htmlFor="password">
                      <Lock size={18} />
                      Nueva contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password_confirmation">
                      <Lock size={18} />
                      Confirmar contraseña
                    </label>
                    <input
                      id="password_confirmation"
                      type="password"
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </form>
              )}

              <div className="login-helper">
                <p><Link to="/login">Volver al login</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
