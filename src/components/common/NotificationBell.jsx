import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnread(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        setUnread(prev => prev + 1);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleClick = () => {
    navigate(`/${profile?.role}/notifications`);
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
