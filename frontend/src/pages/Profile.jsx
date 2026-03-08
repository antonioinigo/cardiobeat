import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Link as LinkIcon, Briefcase, GraduationCap, Award, UserPlus, UserCheck, MessageCircle, Activity, TrendingUp, Clock } from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    role: 'student',
    bio: '',
    profile_photo: '',
    cover_photo: '',
    location: '',
    website: '',
    linkedin: '',
  });

  const [experienceForm, setExperienceForm] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });

  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });

  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: '',
  });

  const [savingExperience, setSavingExperience] = useState(false);
  const [savingEducation, setSavingEducation] = useState(false);
  const [savingCertification, setSavingCertification] = useState(false);
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const currentUserId = Number(currentUser?.id || 0);
  const requestedUserId = Number(userId || 0);
  const isOwnProfile = requestedUserId === currentUserId;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    if (!requestedUserId || requestedUserId !== currentUserId) {
      navigate(`/profile/${currentUserId}`, { replace: true });
      return;
    }

    loadProfile();
  }, [userId, currentUserId]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, statsRes, progressRes] = await Promise.all([
        axios.get(`/api/profile/${currentUserId}`, { headers }),
        axios.get('/api/progress/stats', { headers }),
        axios.get('/api/progress', { headers })
      ]);

      setProfile(profileRes.data);
      setStats(statsRes.data);
      setProgress(progressRes.data.slice(0, 5));
      setEditForm({
        name: profileRes.data.user.name || '',
        role: profileRes.data.user.role || 'student',
        bio: profileRes.data.user.bio || '',
        profile_photo: profileRes.data.user.profile_photo || '',
        cover_photo: profileRes.data.user.cover_photo || '',
        location: profileRes.data.user.location || '',
        website: profileRes.data.user.website || '',
        linkedin: profileRes.data.user.linkedin || '',
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const roleLabel = (role) => {
    if (role === 'professional') return 'Medico';
    if (role === 'admin') return 'Administrador';
    return 'Estudiante';
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/uploads/image', formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.url || '';
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    setProfileError('');

    try {
      let nextProfilePhoto = editForm.profile_photo;
      let nextCoverPhoto = editForm.cover_photo;

      if (profileImageFile) {
        const uploadedUrl = await uploadImage(profileImageFile);
        if (uploadedUrl) {
          nextProfilePhoto = uploadedUrl;
        }
      }

      if (coverImageFile) {
        const uploadedUrl = await uploadImage(coverImageFile);
        if (uploadedUrl) {
          nextCoverPhoto = uploadedUrl;
        }
      }

      const payload = {
        name: editForm.name,
        role: editForm.role,
        bio: editForm.bio,
        profile_photo: nextProfilePhoto,
        cover_photo: nextCoverPhoto,
        location: editForm.location,
        website: editForm.website,
        linkedin: editForm.linkedin,
      };

      await axios.put('/api/profile', payload, { headers: getAuthHeaders() });

      const nextUser = {
        ...(currentUser || {}),
        name: payload.name,
        role: payload.role,
        profile_photo: payload.profile_photo,
        cover_photo: payload.cover_photo,
      };

      localStorage.setItem('user', JSON.stringify(nextUser));
      setProfileMessage('Perfil actualizado correctamente.');
      setProfileImageFile(null);
      setCoverImageFile(null);
      await loadProfile();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setProfileError(error.response?.data?.error || 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const addExperience = async () => {
    if (!experienceForm.title || !experienceForm.company || !experienceForm.start_date) {
      setProfileError('Completa titulo, empresa y fecha de inicio para la experiencia.');
      return;
    }

    setSavingExperience(true);
    setProfileError('');

    try {
      await axios.post('/api/profile/experience', {
        ...experienceForm,
        end_date: experienceForm.is_current ? null : (experienceForm.end_date || null),
      }, {
        headers: getAuthHeaders(),
      });

      setExperienceForm({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      });
      await loadProfile();
    } catch (error) {
      console.error('Error guardando experiencia:', error);
      setProfileError(error.response?.data?.error || 'No se pudo guardar la experiencia.');
    } finally {
      setSavingExperience(false);
    }
  };

  const addEducation = async () => {
    if (!educationForm.institution || !educationForm.degree || !educationForm.start_date) {
      setProfileError('Completa institucion, titulacion y fecha de inicio para la educacion.');
      return;
    }

    setSavingEducation(true);
    setProfileError('');

    try {
      await axios.post('/api/profile/education', {
        ...educationForm,
        end_date: educationForm.is_current ? null : (educationForm.end_date || null),
      }, {
        headers: getAuthHeaders(),
      });

      setEducationForm({
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      });
      await loadProfile();
    } catch (error) {
      console.error('Error guardando educacion:', error);
      setProfileError(error.response?.data?.error || 'No se pudo guardar la educacion.');
    } finally {
      setSavingEducation(false);
    }
  };

  const addCertification = async () => {
    if (!certificationForm.name || !certificationForm.issuing_organization || !certificationForm.issue_date) {
      setProfileError('Completa nombre, organizacion y fecha de emision para la certificacion.');
      return;
    }

    setSavingCertification(true);
    setProfileError('');

    try {
      await axios.post('/api/profile/certifications', {
        ...certificationForm,
        expiration_date: certificationForm.expiration_date || null,
        credential_id: certificationForm.credential_id || null,
        credential_url: certificationForm.credential_url || null,
      }, {
        headers: getAuthHeaders(),
      });

      setCertificationForm({
        name: '',
        issuing_organization: '',
        issue_date: '',
        expiration_date: '',
        credential_id: '',
        credential_url: '',
      });
      await loadProfile();
    } catch (error) {
      console.error('Error guardando certificacion:', error);
      setProfileError(error.response?.data?.error || 'No se pudo guardar la certificacion.');
    } finally {
      setSavingCertification(false);
    }
  };

  const deleteExperience = async (expId) => {
    try {
      await axios.delete(`/api/profile/experience/${expId}`, { headers: getAuthHeaders() });
      await loadProfile();
    } catch (error) {
      console.error('Error eliminando experiencia:', error);
      setProfileError(error.response?.data?.error || 'No se pudo eliminar la experiencia.');
    }
  };

  const deleteEducation = async (eduId) => {
    try {
      await axios.delete(`/api/profile/education/${eduId}`, { headers: getAuthHeaders() });
      await loadProfile();
    } catch (error) {
      console.error('Error eliminando educacion:', error);
      setProfileError(error.response?.data?.error || 'No se pudo eliminar la educacion.');
    }
  };

  const deleteCertification = async (certId) => {
    try {
      await axios.delete(`/api/profile/certifications/${certId}`, { headers: getAuthHeaders() });
      await loadProfile();
    } catch (error) {
      console.error('Error eliminando certificacion:', error);
      setProfileError(error.response?.data?.error || 'No se pudo eliminar la certificacion.');
    }
  };

  const sendConnectionRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/connections/request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Solicitud de conexión enviada');
      loadProfile();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert(error.response?.data?.error || 'Error al enviar solicitud');
    }
  };

  if (loading) return <div className="loading">Cargando perfil...</div>;
  if (!profile) return <div className="error">Perfil no encontrado</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header del Perfil */}
        <div className="profile-header-card">
          <div
            className="cover-photo"
            style={profile.user.cover_photo ? { backgroundImage: `url(${profile.user.cover_photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          ></div>
          <div className="profile-info">
            <div className="profile-avatar">
              {profile.user.profile_photo ? (
                <img src={profile.user.profile_photo} alt={profile.user.name} />
              ) : (
                <div className="avatar-placeholder">{profile.user.name?.charAt(0)}</div>
              )}
            </div>
            <div className="profile-details">
              <h1>{profile.user.name}</h1>
              <p className="profile-role">{roleLabel(profile.user.role)}</p>
              {profile.user.location && (
                <p className="profile-location">
                  <MapPin size={16} /> {profile.user.location}
                </p>
              )}
              <p className="connections-count">{profile.connectionsCount} conexiones</p>
            </div>
            {!isOwnProfile && (
              <div className="profile-actions">
                {profile.connectionStatus === 'none' && (
                  <button className="btn-primary" onClick={sendConnectionRequest}>
                    <UserPlus size={18} /> Conectar
                  </button>
                )}
                {profile.connectionStatus === 'connected' && (
                  <button className="btn-secondary">
                    <UserCheck size={18} /> Conectado
                  </button>
                )}
                {profile.connectionStatus === 'pending_sent' && (
                  <button className="btn-secondary" disabled>
                    Solicitud enviada
                  </button>
                )}
                <button className="btn-secondary">
                  <MessageCircle size={18} /> Mensaje
                </button>
              </div>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <div className="profile-section">
            <h2>Editar perfil profesional</h2>

            {profileError && <p className="smart-error">{profileError}</p>}
            {profileMessage && <p style={{ color: '#059669', fontWeight: 600 }}>{profileMessage}</p>}

            <div className="profile-form-grid card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px', padding: '24px' }}>
              <label>
                Nombre
                <input className="messages-search-input" type="text" name="name" value={editForm.name} onChange={handleEditFormChange} />
              </label>

              <label>
                Rol
                <select
                  className="messages-search-input"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditFormChange}
                  disabled={profile.user.role === 'admin'}
                >
                  <option value="student">Estudiante</option>
                  <option value="professional">Medico</option>
                </select>
              </label>

              <label>
                Ubicacion
                <input className="messages-search-input" type="text" name="location" value={editForm.location} onChange={handleEditFormChange} />
              </label>

              <label>
                Web
                <input className="messages-search-input" type="text" name="website" value={editForm.website} onChange={handleEditFormChange} />
              </label>

              <label>
                LinkedIn
                <input className="messages-search-input" type="text" name="linkedin" value={editForm.linkedin} onChange={handleEditFormChange} />
              </label>

              <label>
                URL foto perfil (opcional)
                <input className="messages-search-input" type="text" name="profile_photo" value={editForm.profile_photo} onChange={handleEditFormChange} placeholder="https://..." />
              </label>

              <label>
                URL foto portada (opcional)
                <input className="messages-search-input" type="text" name="cover_photo" value={editForm.cover_photo} onChange={handleEditFormChange} placeholder="https://..." />
              </label>
            </div>

            <div className="profile-form-grid card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px', padding: '24px' }}>
              <label>
                Subir foto de perfil
                <input type="file" accept="image/*" onChange={(event) => setProfileImageFile(event.target.files?.[0] || null)} />
              </label>

              <label>
                Subir foto de portada
                <input type="file" accept="image/*" onChange={(event) => setCoverImageFile(event.target.files?.[0] || null)} />
              </label>
            </div>

            <label style={{ display: 'block', marginBottom: '24px' }}>
              Bio
              <textarea
                className="messages-search-input"
                name="bio"
                value={editForm.bio}
                onChange={handleEditFormChange}
                rows={4}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </label>

            <button className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        )}

        <div className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <h1>Resumen de aprendizaje</h1>
              <p className="dashboard-subtitle">Tu información de actividad ahora está integrada en tu perfil</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Activity />
              </div>
              <div className="stat-content">
                <p className="stat-label">Actividades totales</p>
                <p className="stat-value">{stats?.total_activities || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp />
              </div>
              <div className="stat-content">
                <p className="stat-label">Completadas</p>
                <p className="stat-value">{stats?.completed_activities || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock />
              </div>
              <div className="stat-content">
                <p className="stat-label">Tiempo total (min)</p>
                <p className="stat-value">{Math.round((stats?.total_time || 0) / 60)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Progreso reciente</h2>
            {progress.length === 0 ? (
              <p className="empty-state">
                Aún no has completado ninguna actividad.
                ¡Comienza explorando los sonidos cardíacos!
              </p>
            ) : (
              <ul className="progress-list">
                {progress.map((item) => (
                  <li key={item.id} className="progress-item" style={{ cursor: 'pointer' }} onClick={() => {
                    if (item.sound_id) navigate('/sounds');
                    else if (item.case_id) navigate('/cases');
                    else if (item.smart_case_id) navigate('/cases/test');
                    else if (item.is_ecg) navigate('/simulador');
                  }}>
                    <div style={{ flex: 1 }}>
                      <p className="progress-title">
                        {item.sound_title || item.case_title || 'Actividad'}
                      </p>
                      <p className="progress-date">
                        {new Date(item.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    {item.completed && (
                      <span className="badge-completed">✓ Completado</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dashboard-card">
            <h2>Acciones rápidas</h2>
            <div className="quick-actions">
              <Link to="/sounds" className="quick-action-btn">
                <div className="quick-action-icon">🎵</div>
                <div>
                  <strong>Explorar sonidos</strong>
                  <p>Biblioteca de audios cardíacos</p>
                </div>
              </Link>
              <Link to="/cases" className="quick-action-btn">
                <div className="quick-action-icon">📋</div>
                <div>
                  <strong>Casos clínicos</strong>
                  <p>Practica con pacientes reales</p>
                </div>
              </Link>
              <Link to="/focus" className="quick-action-btn">
                <div className="quick-action-icon">🎯</div>
                <div>
                  <strong>Focos cardíacos</strong>
                  <p>Aprende la localización</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Acerca de */}
        {profile.user.bio && (
          <div className="profile-section">
            <h2>Acerca de</h2>
            <p>{profile.user.bio}</p>
          </div>
        )}

        {/* Experiencia Profesional */}
        <div className="profile-section">
          <h2><Briefcase size={20} /> Experiencia</h2>

          {isOwnProfile && (
            <div className="card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px', padding: '24px' }}>
              <input className="messages-search-input" type="text" placeholder="Puesto" value={experienceForm.title} onChange={(event) => setExperienceForm((prev) => ({ ...prev, title: event.target.value }))} />
              <input className="messages-search-input" type="text" placeholder="Empresa" value={experienceForm.company} onChange={(event) => setExperienceForm((prev) => ({ ...prev, company: event.target.value }))} />
              <input className="messages-search-input" type="text" placeholder="Ubicación" value={experienceForm.location} onChange={(event) => setExperienceForm((prev) => ({ ...prev, location: event.target.value }))} />
              <label>Inicio<input className="messages-search-input" type="date" value={experienceForm.start_date} onChange={(event) => setExperienceForm((prev) => ({ ...prev, start_date: event.target.value }))} style={{marginTop: '4px'}} /></label>
              <label>Fin<input className="messages-search-input" type="date" value={experienceForm.end_date} onChange={(event) => setExperienceForm((prev) => ({ ...prev, end_date: event.target.value }))} disabled={experienceForm.is_current} style={{marginTop: '4px'}} /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '32px' }}><input type="checkbox" checked={experienceForm.is_current} onChange={(event) => setExperienceForm((prev) => ({ ...prev, is_current: event.target.checked }))} /> Trabajo actual</label>
              <textarea className="messages-search-input" rows={3} placeholder="Descripción" value={experienceForm.description} onChange={(event) => setExperienceForm((prev) => ({ ...prev, description: event.target.value }))} style={{ gridColumn: '1 / -1' }} />
              <button className="btn-primary" onClick={addExperience} disabled={savingExperience} style={{ gridColumn: '1 / -1', maxWidth: '200px' }}>{savingExperience ? 'Guardando...' : 'Añadir experiencia'}</button>
            </div>
          )}

          {profile.experience && profile.experience.length > 0 ? (
            <div className="experience-list">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="experience-item">
                  <div className="item-icon"><Briefcase size={24} /></div>
                  <div className="item-content">
                    <h3>{exp.title}</h3>
                    <p className="company">{exp.company}</p>
                    <p className="date">
                      {new Date(exp.start_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} -
                      {exp.is_current ? ' Actualidad' : new Date(exp.end_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </p>
                    {exp.location && <p className="location">{exp.location}</p>}
                    {exp.description && <p className="description">{exp.description}</p>}
                    {isOwnProfile && <button className="btn-secondary" onClick={() => deleteExperience(exp.id)}>Eliminar</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay experiencia registrada todavia.</p>
          )}
        </div>

        {/* Educación */}
        <div className="profile-section">
          <h2><GraduationCap size={20} /> Educacion</h2>

          {isOwnProfile && (
            <div className="card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px', padding: '24px' }}>
              <input className="messages-search-input" type="text" placeholder="Institución" value={educationForm.institution} onChange={(event) => setEducationForm((prev) => ({ ...prev, institution: event.target.value }))} />
              <input className="messages-search-input" type="text" placeholder="Titulación" value={educationForm.degree} onChange={(event) => setEducationForm((prev) => ({ ...prev, degree: event.target.value }))} />
              <input className="messages-search-input" type="text" placeholder="Campo de estudio" value={educationForm.field_of_study} onChange={(event) => setEducationForm((prev) => ({ ...prev, field_of_study: event.target.value }))} />
              <label>Inicio<input className="messages-search-input" type="date" value={educationForm.start_date} onChange={(event) => setEducationForm((prev) => ({ ...prev, start_date: event.target.value }))} style={{marginTop: '4px'}} /></label>
              <label>Fin<input className="messages-search-input" type="date" value={educationForm.end_date} onChange={(event) => setEducationForm((prev) => ({ ...prev, end_date: event.target.value }))} disabled={educationForm.is_current} style={{marginTop: '4px'}} /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '32px' }}><input type="checkbox" checked={educationForm.is_current} onChange={(event) => setEducationForm((prev) => ({ ...prev, is_current: event.target.checked }))} /> En curso</label>
              <textarea className="messages-search-input" rows={3} placeholder="Descripción" value={educationForm.description} onChange={(event) => setEducationForm((prev) => ({ ...prev, description: event.target.value }))} style={{ gridColumn: '1 / -1' }} />
              <button className="btn-primary" onClick={addEducation} disabled={savingEducation} style={{ gridColumn: '1 / -1', maxWidth: '200px' }}>{savingEducation ? 'Guardando...' : 'Añadir educación'}</button>
            </div>
          )}

          {profile.education && profile.education.length > 0 ? (
            <div className="education-list">
              {profile.education.map((edu) => (
                <div key={edu.id} className="education-item">
                  <div className="item-icon"><GraduationCap size={24} /></div>
                  <div className="item-content">
                    <h3>{edu.institution}</h3>
                    <p className="degree">{edu.degree}{edu.field_of_study && ` en ${edu.field_of_study}`}</p>
                    <p className="date">
                      {new Date(edu.start_date).getFullYear()} -
                      {edu.is_current ? ' Actualidad' : new Date(edu.end_date).getFullYear()}
                    </p>
                    {isOwnProfile && <button className="btn-secondary" onClick={() => deleteEducation(edu.id)}>Eliminar</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay estudios registrados todavia.</p>
          )}
        </div>

        {/* Certificaciones */}
        <div className="profile-section">
          <h2><Award size={20} /> Certificaciones</h2>

          {isOwnProfile && (
            <div className="card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px', padding: '24px' }}>
              <input className="messages-search-input" type="text" placeholder="Nombre de certificación" value={certificationForm.name} onChange={(event) => setCertificationForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input className="messages-search-input" type="text" placeholder="Organización" value={certificationForm.issuing_organization} onChange={(event) => setCertificationForm((prev) => ({ ...prev, issuing_organization: event.target.value }))} />
              <label>Emisión<input className="messages-search-input" type="date" value={certificationForm.issue_date} onChange={(event) => setCertificationForm((prev) => ({ ...prev, issue_date: event.target.value }))} style={{marginTop: '4px'}} /></label>
              <label>Caducidad<input className="messages-search-input" type="date" value={certificationForm.expiration_date} onChange={(event) => setCertificationForm((prev) => ({ ...prev, expiration_date: event.target.value }))} style={{marginTop: '4px'}} /></label>
              <input className="messages-search-input" type="text" placeholder="ID de credencial" value={certificationForm.credential_id} onChange={(event) => setCertificationForm((prev) => ({ ...prev, credential_id: event.target.value }))} />
              <input className="messages-search-input" type="text" placeholder="URL de credencial" value={certificationForm.credential_url} onChange={(event) => setCertificationForm((prev) => ({ ...prev, credential_url: event.target.value }))} />
              <button className="btn-primary" onClick={addCertification} disabled={savingCertification} style={{ gridColumn: '1 / -1', maxWidth: '200px' }}>{savingCertification ? 'Guardando...' : 'Añadir certificación'}</button>
            </div>
          )}

          {profile.certifications && profile.certifications.length > 0 ? (
            <div className="certifications-list">
              {profile.certifications.map((cert) => (
                <div key={cert.id} className="certification-item">
                  <div className="item-icon"><Award size={24} /></div>
                  <div className="item-content">
                    <h3>{cert.name}</h3>
                    <p className="org">{cert.issuing_organization}</p>
                    <p className="date">
                      Emitido: {new Date(cert.issue_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </p>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="credential-link">
                        <LinkIcon size={14} /> Ver credencial
                      </a>
                    )}
                    {isOwnProfile && <button className="btn-secondary" onClick={() => deleteCertification(cert.id)}>Eliminar</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay certificaciones registradas todavia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
