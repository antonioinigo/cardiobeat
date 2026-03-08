import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const extractRegisterError = (err) => {
    const data = err?.response?.data;
    if (!data) {
      return 'No se pudo conectar con el servidor. Intentalo de nuevo.';
    }

    if (typeof data.error === 'string' && data.error.trim() !== '') {
      return data.error;
    }

    if (typeof data.message === 'string' && data.message.trim() !== '') {
      return data.message;
    }

    if (data.errors && typeof data.errors === 'object') {
      const firstFieldErrors = Object.values(data.errors).find((value) => Array.isArray(value) && value.length > 0);
      if (firstFieldErrors) {
        return firstFieldErrors[0];
      }
    }

    return 'No se pudo completar el registro.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const email = form.email.trim().toLowerCase();
    if (!email || !form.password || !form.password_confirmation) {
      setError('Completa los campos obligatorios.');
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        name: form.name.trim() || null,
        email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      setMessage(response.data?.message || 'Registro completado. Revisa tu email para verificar la cuenta.');
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setError(extractRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-grid">
          <div className="login-info">
            <h1>Crear cuenta en CardioBeat</h1>
            <p>
              Regístrate para acceder a casos clínicos, biblioteca de sonidos, simulador ECG
              y seguimiento de progreso.
            </p>
          </div>

          <div className="login-form-container">
            <div className="login-card">
              <h2>Registro</h2>

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
                  <label htmlFor="name">
                    <User size={18} />
                    Nombre
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    placeholder="tuemail@dominio.com"
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
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    placeholder="••••••••"
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
                    value={form.password_confirmation}
                    onChange={(event) => update('password_confirmation', event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                </button>
              </form>

              <div className="login-helper">
                <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
