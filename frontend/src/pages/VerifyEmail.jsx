import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token') || '';

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando tu email...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Enlace inválido: falta el token de verificación.');
        return;
      }

      try {
        const response = await axios.get('/api/auth/verify-email', {
          params: { token },
        });

        setStatus('ok');
        setMessage(response.data?.message || 'Email verificado correctamente.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'No se pudo verificar el email.');
      }
    };

    run();
  }, [token]);

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-form-container" style={{ maxWidth: 620, margin: '0 auto' }}>
          <div className="login-card">
            <h2>Verificación de email</h2>

            {status === 'loading' && (
              <div className="alert">
                <Loader2 size={20} />
                <span>{message}</span>
              </div>
            )}

            {status === 'ok' && (
              <div className="alert alert-success">
                <CheckCircle2 size={20} />
                <span>{message}</span>
              </div>
            )}

            {status === 'error' && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{message}</span>
              </div>
            )}

            <div className="login-helper">
              <p><Link to="/login">Ir a iniciar sesión</Link></p>
              <p><Link to="/register">Crear cuenta</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
