import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// filter: { column: 'room_id' | 'conversation_id', value: string }
export default function ChatRoom({ filter, title, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq(filter.column, filter.value)
        .order('created_at', { ascending: true })
        .limit(200);

      if (!error && isMounted) setMessages(data || []);
    };

    loadMessages();

    const channel = supabase
      .channel(`thread:${filter.column}:${filter.value}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `${filter.column}=eq.${filter.value}`
        },
        payload => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [filter.column, filter.value]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async e => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setDraft('');

    const { error } = await supabase.from('messages').insert({
      [filter.column]: filter.value,
      user_id: currentUser.id,
      display_name: currentUser.display_name,
      content: trimmed
    });

    if (error) {
      console.error(error);
      setDraft(trimmed);
    }
    setSending(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          fontSize: 13,
          color: 'var(--text-muted)'
        }}
      >
        {title}
      </div>

      <div
        className="scrollbar-thin"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', fontSize: 13 }}
      >
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>
            no messages yet — say something{'  '}
            <span className="cursor-blink" />
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 8, lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-muted)' }}>[{formatTime(msg.created_at)}]</span>{' '}
            <span
              style={{
                color: msg.user_id === currentUser.id ? 'var(--accent)' : 'var(--amber)',
                fontWeight: 600
              }}
            >
              {msg.display_name}:
            </span>{' '}
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid var(--border)'
        }}
      >
        <span style={{ color: 'var(--accent)', alignSelf: 'center' }}>&gt;</span>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="type a message..."
          style={{
            flex: 1,
            background: 'var(--panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '9px 12px',
            color: 'var(--text)',
            fontSize: 13,
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          style={{
            background: 'var(--accent)',
            color: '#0a0e14',
            border: 'none',
            borderRadius: 4,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            opacity: sending || !draft.trim() ? 0.5 : 1
          }}
        >
          send
        </button>
      </form>
    </div>
  );
}
