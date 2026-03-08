import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Introduce tu email.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/password/forgot', {
        email: normalizedEmail,
      });
      setMessage(response.data?.message || 'Si el email existe, recibirás instrucciones.');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-grid">
          <div className="login-info">
            <h1>Recuperar contraseña</h1>
            <p>Te enviaremos un token por correo para validar la recuperación y crear una nueva contraseña.</p>
          </div>

          <div className="login-form-container">
            <div className="login-card">
              <h2>Solicitar token</h2>

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
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tuemail@dominio.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar token'}
                </button>
              </form>

              <div className="login-helper">
                <p><Link to="/reset-password">Ya tengo un token</Link></p>
                <p><Link to="/login">Volver al login</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
