import { Link } from 'react-router-dom';

export default function Legal({ title }) {
  return (
    <section className="container" style={{ padding: '56px 0' }}>
      <div className="card" style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1>{title}</h1>
        <p>
          Esta sección está en proceso de formalización legal. Para versión de producción,
          define aquí el contenido final validado por tu asesoría legal.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link to="/" className="btn btn-ghost btn-sm">Volver al inicio</Link>
        </p>
      </div>
    </section>
  );
}