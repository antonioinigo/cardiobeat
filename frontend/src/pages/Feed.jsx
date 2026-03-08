import { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Send, MoreVertical, Users, X } from 'lucide-react';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [feedError, setFeedError] = useState('');
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [feedSearch, setFeedSearch] = useState('');
  const [feedFilter, setFeedFilter] = useState('all');

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setFeedError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error cargando feed:', error);
      setFeedError('No se pudo cargar el feed. Inténtalo de nuevo en unos segundos.');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    try {
      setPosting(true);
      setFeedError('');
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/posts', {
        content: newPost,
        visibility
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts([response.data, ...posts]);
      setNewPost('');
      setShowCreatePost(false);
      setVisibility('public');
    } catch (error) {
      console.error('Error creando post:', error);
      setFeedError('No se pudo crear la publicación. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            user_liked: !post.user_liked,
            likes_count: post.user_liked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error en like:', error);
    }
  };

  const loadComments = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data);
      setSelectedPost(postId);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      setCommenting(true);
      setFeedError('');
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/posts/${selectedPost}/comments`, {
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments([...comments, response.data]);
      setNewComment('');

      setPosts(posts.map(post => {
        if (post.id === selectedPost) {
          return { ...post, comments_count: post.comments_count + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error añadiendo comentario:', error);
      setFeedError('No se pudo enviar el comentario.');
    } finally {
      setCommenting(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const normalizedSearch = feedSearch.trim().toLowerCase();

    const bySearch = normalizedSearch === ''
      || String(post.content || '').toLowerCase().includes(normalizedSearch)
      || String(post.author_name || '').toLowerCase().includes(normalizedSearch);

    const byFilter = feedFilter === 'all'
      || (feedFilter === 'liked' && Boolean(post.user_liked))
      || (feedFilter === 'commented' && Number(post.comments_count || 0) > 0)
      || (feedFilter === 'public' && post.visibility === 'public')
      || (feedFilter === 'connections' && post.visibility === 'connections')
      || (feedFilter === 'private' && post.visibility === 'private');

    return bySearch && byFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Cargando feed...</div>;
  }

  return (
    <div className="feed-page guest-info-page">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Crear Post */}
        <div className="create-post-card glass" style={{ padding: '24px', marginBottom: '24px', borderRadius: '16px' }}>
          <div className="create-post-header">
            <div className="user-avatar">
              <Users size={24} />
            </div>
            <button 
              className="create-post-input"
              onClick={() => setShowCreatePost(true)}
            >
              ¿En qué estás pensando?
            </button>
          </div>

          <div className="feed-toolbar">
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Buscar por autor o contenido"
            />
            <select value={feedFilter} onChange={(e) => setFeedFilter(e.target.value)}>
              <option value="all">Todo</option>
              <option value="liked">Me gustan</option>
              <option value="commented">Con comentarios</option>
              <option value="public">Visibilidad pública</option>
              <option value="connections">Solo conexiones</option>
              <option value="private">Privadas</option>
            </select>
          </div>

          <p className="feed-toolbar-meta">Mostrando {filteredPosts.length} de {posts.length} publicaciones</p>
        </div>

        {feedError && <p className="smart-error">{feedError}</p>}

        {/* Modal Crear Post */}
        {showCreatePost && (
          <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Crear publicación</h3>
                <button onClick={() => setShowCreatePost(false)} className="close-btn">
                  <X size={24} />
                </button>
              </div>

              <textarea
                className="post-textarea"
                placeholder="¿Qué quieres compartir?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={6}
                autoFocus
              />

              <div className="post-visibility">
                <label>Visibilidad:</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">Público</option>
                  <option value="connections">Solo conexiones</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              <button 
                className="btn-primary"
                onClick={createPost}
                disabled={!newPost.trim() || posting}
              >
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        )}

        {/* Feed de Posts */}
        <div className="posts-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <div className="post-header">
                <div className="post-author">
                  <div className="user-avatar">
                    {post.author_photo ? (
                      <img src={post.author_photo} alt={post.author_name} />
                    ) : (
                      <Users size={24} />
                    )}
                  </div>
                  <div className="author-info">
                    <h4>{post.author_name}</h4>
                    <p className="post-meta">
                      {post.author_role} • {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>
                <button className="post-menu">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="post-image" />
                )}
              </div>

              <div className="post-stats">
                <span>{post.likes_count} me gusta</span>
                <span>{post.comments_count} comentarios</span>
              </div>

              <div className="post-actions">
                <button 
                  className={`action-btn ${post.user_liked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart size={20} fill={post.user_liked ? 'currentColor' : 'none'} />
                  Me gusta
                </button>
                <button 
                  className="action-btn"
                  onClick={() => loadComments(post.id)}
                >
                  <MessageCircle size={20} />
                  Comentar
                </button>
                <button className="action-btn">
                  <Send size={20} />
                  Compartir
                </button>
              </div>

              {/* Sección de Comentarios */}
              {selectedPost === post.id && (
                <div className="comments-section">
                  <div className="comments-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <div className="user-avatar small">
                          {comment.author_photo ? (
                            <img src={comment.author_photo} alt={comment.author_name} />
                          ) : (
                            <Users size={16} />
                          )}
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <strong>{comment.author_name}</strong>
                            <span className="comment-role">{comment.author_role}</span>
                          </div>
                          <p>{comment.content}</p>
                          <span className="comment-time">{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="add-comment">
                    <div className="user-avatar small">
                      <Users size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    />
                    <button onClick={addComment} disabled={!newComment.trim() || commenting}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="empty-feed">
              <Users size={64} />
              <h3>No hay publicaciones para este filtro</h3>
              <p>Prueba con otra búsqueda o cambia el filtro para ver más actividad.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
