import { useEffect, useState } from 'react';
import axios from 'axios';
import { Volume2 } from 'lucide-react';

export default function Sounds() {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = async () => {
    try {
      const response = await axios.get('/api/sounds');
      setSounds(response.data);
    } catch (error) {
      console.error('Error cargando sonidos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando sonidos...</div>;
  }

  return (
    <div className="sounds-page">
      <div className="container">
        <div className="page-header">
          <h1>Biblioteca de Sonidos Cardíacos</h1>
          <p>Escucha y aprende de sonidos cardíacos reales en alta fidelidad</p>
        </div>

        <div className="sounds-grid">
          {sounds.map((sound) => (
            <div key={sound.id} className="sound-card">
              <div className="sound-header">
                <div className={`sound-type sound-type-${sound.sound_type}`}>
                  {sound.sound_type}
                </div>
                {sound.focus_name && (
                  <div className="sound-focus">{sound.focus_abbr}</div>
                )}
              </div>

              <h3 className="sound-title">{sound.title}</h3>
              
              {sound.pathology && (
                <p className="sound-pathology">
                  <strong>Patología:</strong> {sound.pathology}
                </p>
              )}

              <p className="sound-description">{sound.description}</p>

              <div className="sound-player">
                <audio controls preload="none" src={`/audios/${sound.audio_file}`}>
                  Tu navegador no soporta audio HTML5.
                </audio>
              </div>
            </div>
          ))}
        </div>

        {sounds.length === 0 && (
          <div className="empty-state">
            <Volume2 size={64} />
            <h3>No hay sonidos disponibles</h3>
            <p>Los sonidos cardíacos se cargarán una vez que se configure la base de datos</p>
          </div>
        )}
      </div>
    </div>
  );
}
