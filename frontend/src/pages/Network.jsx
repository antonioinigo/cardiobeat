import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Search, UserPlus, UserCheck, UserX, Check, X } from 'lucide-react';

export default function Network() {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') === 'requests'
    ? 'requests'
    : 'connections';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'requests' || tab === 'connections' || tab === 'search') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setNetworkError('');

    try {
      const token = localStorage.getItem('token');
      const [connectionsResponse, requestsResponse] = await Promise.all([
        axios.get('/api/connections', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/connections/requests', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setConnections(Array.isArray(connectionsResponse.data) ? connectionsResponse.data : []);
      setRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setNetworkError('No se pudo cargar tu red en este momento. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/connections/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
      setActiveTab('search');
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    }
  };

  const sendRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/connections/request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Solicitud enviada');
      searchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al enviar solicitud');
    }
  };

  const acceptRequest = async (connectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/connections/accept/${connectionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
    }
  };

  const rejectRequest = async (connectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/connections/reject/${connectionId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
    }
  };

  return (
    <div className="network-page guest-info-page">
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="network-header glass" style={{ padding: '32px', borderRadius: '16px', marginBottom: '24px' }}>
          <h1 style={{ marginTop: 0 }}>Mi Red Profesional</h1>
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar profesionales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <button onClick={searchUsers}>Buscar</button>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={activeTab === 'connections' ? 'active' : ''}
            onClick={() => setActiveTab('connections')}
          >
            <Users size={18} /> Conexiones ({connections.length})
          </button>
          <button 
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus size={18} /> Solicitudes ({requests.length})
          </button>
        </div>

        <div className="network-content">
          {networkError && <p className="smart-error">{networkError}</p>}

          {loading ? (
            <div className="loading">Cargando...</div>
          ) : (
            <>
              {activeTab === 'connections' && (
                <div className="connections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {connections.map((user) => (
                    <div key={user.id} className="user-card glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                      <div className="user-avatar" style={{ margin: '0 auto 16px', width: '80px', height: '80px' }}>
                        {user.profile_photo ? (
                          <img src={user.profile_photo} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-placeholder" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-red), #ff4d4d)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>{user.name.charAt(0)}</div>
                        )}
                      </div>
                      <h3 onClick={() => navigate(`/profile/${user.id}`)} style={{ cursor: 'pointer', margin: '0 0 8px', color: 'var(--brand-teal-dark)' }}>{user.name}</h3>
                      <p className="role" style={{ margin: '0 0 4px', fontWeight: '600' }}>{user.role}</p>
                      {user.location && <p className="location" style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' }}>{user.location}</p>}
                      <button className="btn-primary" style={{ width: '100%' }}>Enviar mensaje</button>
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <div className="empty-state">
                      <Users size={64} />
                      <p>No tienes conexiones todavía</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="requests-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {requests.map((request) => (
                    <div key={request.connection_id} className="request-card glass" style={{ display: 'flex', alignItems: 'center', padding: '20px', borderRadius: '16px', gap: '20px' }}>
                      <div className="user-avatar" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                        {request.profile_photo ? (
                          <img src={request.profile_photo} alt={request.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-placeholder" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-red), #ff4d4d)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>{request.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="request-info" style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px' }}>{request.name}</h3>
                        <p style={{ margin: '0 0 4px', color: 'var(--brand-teal-dark)', fontWeight: '600' }}>{request.role}</p>
                        {request.bio && <p className="bio" style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>{request.bio}</p>}
                      </div>
                      <div className="request-actions" style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          className="btn-primary"
                          onClick={() => acceptRequest(request.connection_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Check size={18} /> Aceptar
                        </button>
                        <button 
                          className="btn-outline"
                          onClick={() => rejectRequest(request.connection_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <X size={18} /> Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="empty-state">
                      <UserPlus size={64} />
                      <p>No tienes solicitudes pendientes</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'search' && (
                <div className="connections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {searchResults.map((user) => (
                    <div key={user.id} className="user-card glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                      <div className="user-avatar" style={{ margin: '0 auto 16px', width: '80px', height: '80px' }}>
                        {user.profile_photo ? (
                          <img src={user.profile_photo} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-placeholder" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-red), #ff4d4d)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>{user.name.charAt(0)}</div>
                        )}
                      </div>
                      <h3 onClick={() => navigate(`/profile/${user.id}`)} style={{ cursor: 'pointer', margin: '0 0 8px', color: 'var(--brand-teal-dark)' }}>{user.name}</h3>
                      <p className="role" style={{ margin: '0 0 4px', fontWeight: '600' }}>{user.role}</p>
                      {user.location && <p className="location" style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' }}>{user.location}</p>}
                      {user.connection_status === 'none' && (
                        <button 
                          className="btn-primary"
                          onClick={() => sendRequest(user.id)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <UserPlus size={16} /> Conectar
                        </button>
                      )}
                      {user.connection_status === 'connected' && (
                        <button className="btn-outline" disabled style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.7 }}>
                          <UserCheck size={16} /> Conectado
                        </button>
                      )}
                      {user.connection_status === 'pending_sent' && (
                        <button className="btn-outline" disabled style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.7 }}>
                          Pendiente
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
