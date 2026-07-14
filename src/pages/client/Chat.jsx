import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
    >
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
        {(conv.name || 'U').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium text-gray-900 truncate ${!conv.is_read ? 'font-semibold' : ''}`}>{conv.name}</span>
          {conv.last_at && <span className="text-xs text-gray-400 shrink-0 ml-2">{new Date(conv.last_at).toLocaleDateString()}</span>}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message || 'Start a conversation'}</p>
      </div>
      {!conv.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
    </button>
  );
}

export default function Chat() {
  const { userId: selectedUserId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, is_read, created_at, sender:sender_id(full_name, avatar_url, role), recipient:recipient_id(full_name, avatar_url, role)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const convMap = new Map();
      (data || []).forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const other = msg.sender_id === user.id ? msg.recipient : msg.sender;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            id: otherId,
            name: other?.full_name || 'User',
            avatar: other?.avatar_url,
            last_message: msg.content,
            last_at: msg.created_at,
            is_read: msg.recipient_id !== user.id || msg.is_read,
          });
        }
      });
      setConversations(Array.from(convMap.values()));
      setLoading(false);

      if (selectedUserId) {
        const found = Array.from(convMap.values()).find(c => c.id === selectedUserId);
        if (found) setActiveUser(found);
        else {
          const { data: profileData } = await supabase.from('profiles').select('id,full_name,avatar_url').eq('id', selectedUserId).maybeSingle();
          if (profileData) setActiveUser({ id: profileData.id, name: profileData.full_name, avatar: profileData.avatar_url });
        }
      }
    };
    load();
  }, [user, selectedUserId]);

  // Load messages for active conversation
  useEffect(() => {
    if (!user || !activeUser) return;
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      // Mark as read
      await supabase.from('messages').update({ is_read: true }).eq('sender_id', activeUser.id).eq('recipient_id', user.id).eq('is_read', false);
      setTimeout(scrollToBottom, 100);
    };
    load();

    const channel = supabase
      .channel(`chat-${activeUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === user.id && msg.recipient_id === activeUser.id) ||
            (msg.sender_id === activeUser.id && msg.recipient_id === user.id)) {
          setMessages(prev => [...prev, msg]);
          setTimeout(scrollToBottom, 100);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeUser, user]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({ sender_id: user.id, recipient_id: activeUser.id, content });
    setSending(false);
  };

  if (loading) return <LoadingSpinner text="Loading messages..." />;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Conversations list */}
      <div className={`w-72 shrink-0 card flex flex-col ${activeUser ? 'hidden lg:flex' : 'flex w-full'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="section-title mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 text-sm" placeholder="Search conversations..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages" description="Start a conversation from a worker's profile." />
          ) : conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={activeUser?.id === conv.id}
              onClick={() => { setActiveUser(conv); navigate(`/${profile?.role}/chat/${conv.id}`); }}
            />
          ))}
        </div>
      </div>

      {/* Chat window */}
      {activeUser ? (
        <div className="flex-1 card flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 shrink-0">
            <button onClick={() => { setActiveUser(null); navigate(`/${profile?.role}/chat`); }} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {(activeUser.name || 'U').charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{activeUser.name}</div>
              <div className="text-xs text-gray-400">Online</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => {
              const isOwn = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              className="input flex-1"
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary px-4">
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 card items-center justify-center">
          <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the left to start chatting." />
        </div>
      )}
    </div>
  );
}
