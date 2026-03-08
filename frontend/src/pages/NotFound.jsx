import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container" style={{ padding: '56px 0' }}>
      <div className="card" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <h1>404</h1>
        <p>La página que buscas no existe o ha sido movida.</p>
        <p style={{ marginTop: 16 }}>
          <Link to="/" className="btn btn-primary btn-sm">Ir al inicio</Link>
        </p>
      </div>
    </section>
  );
}