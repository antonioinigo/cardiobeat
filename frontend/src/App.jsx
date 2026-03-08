import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Sounds from './pages/Sounds';
import Cases from './pages/Cases';
import CasesTest from './pages/CasesTest';
import GuestSoundsInfo from './pages/GuestSoundsInfo';
import GuestCasesInfo from './pages/GuestCasesInfo';
import GuestSimulatorInfo from './pages/GuestSimulatorInfo';
import Focus from './pages/Focus';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Network from './pages/Network';
import Messages from './pages/Messages';
import Simulator from './pages/Simulator';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common.Authorization;
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common.Authorization;
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const requireAuth = (element) => (user ? element : <Navigate to="/login" replace />);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header user={user} onLogout={handleLogout} />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/feed" /> : <Login onLogin={handleLogin} />} 
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/feed" /> : <Register />}
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/forgot-password"
              element={user ? <Navigate to="/feed" /> : <ForgotPassword />}
            />
            <Route
              path="/reset-password"
              element={user ? <Navigate to="/feed" /> : <ResetPassword />}
            />
            <Route 
              path="/feed" 
              element={requireAuth(<Feed />)} 
            />
            <Route 
              path="/profile/:userId" 
              element={requireAuth(<Profile />)} 
            />
            <Route
              path="/profile"
              element={requireAuth(<Navigate to={`/profile/${user?.id}`} replace />)}
            />
            <Route 
              path="/network" 
              element={requireAuth(<Network />)} 
            />
            <Route 
              path="/messages" 
              element={requireAuth(<Messages />)} 
            />
            <Route path="/sounds" element={user ? <Sounds /> : <GuestSoundsInfo />} />
            <Route path="/cases" element={user ? <Cases /> : <GuestCasesInfo />} />
            <Route path="/cases/test" element={requireAuth(<CasesTest />)} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/simulador" element={user ? <Simulator /> : <GuestSimulatorInfo />} />
            <Route path="/juegocardico" element={<Navigate to="/simulador" replace />} />
            <Route path="/privacy" element={<Legal title="Política de Privacidad" />} />
            <Route path="/terms" element={<Legal title="Términos de Uso" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
