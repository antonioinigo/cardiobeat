import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogOut, Menu, Home, Users, MessageCircle, User, Volume2, Activity, FileText, Stethoscope } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Header({ user, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  useEffect(() => {
    if (user) {
      loadNotificationCounts();
      const interval = setInterval(loadNotificationCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const [msgs, requests] = await Promise.all([
        axios.get('/api/messages/unread/count', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/connections/requests', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUnreadMessages(msgs.data.unread_count);
      setPendingRequests(Array.isArray(requests.data) ? requests.data.length : 0);
    } catch (error) {
      console.error('Error cargando conteos:', error);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="brand">
            <img src="/cardiobeat-logo.jpg" alt="CardioBeat" className="brand-logo" />
          </Link>

          <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={24} />
          </button>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {user ? (
              <>
                <NavLink to="/feed" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Home size={20} /><span>Inicio</span></NavLink>
                <NavLink to="/sounds" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Volume2 size={20} /><span>Sonidos</span></NavLink>
                <NavLink to="/focus" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Stethoscope size={20} /><span>Focos</span></NavLink>
                <NavLink to="/cases" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><FileText size={20} /><span>Casos</span></NavLink>
                <NavLink to="/simulador" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Activity size={20} /><span>Simulador</span></NavLink>
                <div className="nav-divider"></div>
                <NavLink to="/network" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Users size={20} /><span>Red</span>{pendingRequests > 0 && <span className="badge">{pendingRequests}</span>}</NavLink>
                <NavLink to="/messages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><MessageCircle size={20} /><span>Mensajes</span>{unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}</NavLink>
                <NavLink to={`/profile/${user?.id}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><User size={20} /><span>Perfil</span></NavLink>
                <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{marginLeft: '8px'}}><LogOut size={16} /><span>Salir</span></button>
              </>
            ) : (
              <>
                <Link to="/focus" className="nav-link">Focos</Link>
                <Link to="/cases" className="nav-link">Casos</Link>
                <Link to="/sounds" className="nav-link">Sonidos</Link>
                <Link to="/simulador" className="nav-link">Simulador</Link>
                <div className="nav-divider"></div>
                <Link to="/register" className="btn btn-ghost btn-xs">Crear cuenta</Link>
                <Link to="/login" className="btn btn-primary btn-xs">Acceder</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
