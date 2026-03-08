import { useEffect, useState } from 'react';
import axios from 'axios';
import { Send, Users } from 'lucide-react';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setMessagesError('');
      setLoadingConversations(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      setMessagesError('No se pudieron cargar las conversaciones.');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setMessagesError('');
      setLoadingMessages(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/messages/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      setMessagesError('No se pudieron cargar los mensajes de esta conversación.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const conversation = conversations.find(c => c.conversation_id === selectedConversation);
    if (!conversation) return;

    try {
      setSendingMessage(true);
      setMessagesError('');
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/messages/${conversation.other_user_id}`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setMessages([...messages, response.data.message]);
      setNewMessage('');
      loadConversations();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setMessagesError('No se pudo enviar el mensaje.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter((conv) => {
    const normalizedSearch = conversationSearch.trim().toLowerCase();
    if (normalizedSearch === '') return true;

    return String(conv.other_user_name || '').toLowerCase().includes(normalizedSearch)
      || String(conv.last_message || '').toLowerCase().includes(normalizedSearch);
  });

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Lista de Conversaciones */}
        <div className="conversations-sidebar">
          <h2>Mensajes</h2>
          <div className="messages-search">
            <input
              type="text"
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Buscar conversación"
            />
          </div>
          <div className="conversations-list">
            {loadingConversations && (
              <div className="empty-conversations">
                <p>Cargando conversaciones...</p>
              </div>
            )}

            {!loadingConversations && filteredConversations.map((conv) => (
              <div
                key={conv.conversation_id}
                className={`conversation-item ${selectedConversation === conv.conversation_id ? 'active' : ''}`}
                onClick={() => loadMessages(conv.conversation_id)}
              >
                <div className="user-avatar">
                  {conv.other_user_photo ? (
                    <img src={conv.other_user_photo} alt={conv.other_user_name} />
                  ) : (
                    <Users size={20} />
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{conv.other_user_name}</h4>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                  <p className="last-message">{conv.last_message}</p>
                </div>
              </div>
            ))}

            {!loadingConversations && filteredConversations.length === 0 && (
              <div className="empty-conversations">
                <Users size={48} />
                <p>No hay conversaciones para ese filtro</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="chat-area">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <h3>{conversations.find(c => c.conversation_id === selectedConversation)?.other_user_name}</h3>
              </div>

              {messagesError && <p className="smart-error messages-error">{messagesError}</p>}

              <div className="messages-list">
                {loadingMessages && <p className="smart-muted">Cargando mensajes...</p>}

                {!loadingMessages && messages.length === 0 && (
                  <p className="smart-muted">Aún no hay mensajes en esta conversación.</p>
                )}

                {!loadingMessages && messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="message-input">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} disabled={!newMessage.trim() || sendingMessage}>
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <Users size={64} />
              <p>Selecciona una conversación para empezar a chatear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
