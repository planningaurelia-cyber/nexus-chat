import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthGate({ onReady }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async e => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name needs at least 2 characters.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Sign in anonymously (Supabase Auth > Providers > Anonymous must be enabled)
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, display_name: trimmed }, { onConflict: 'id' });
      if (profileError) throw profileError;

      onReady({ id: userId, display_name: trimmed });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong joining.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <form
        onSubmit={handleJoin}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '32px 28px',
          width: 340,
          maxWidth: '90vw'
        }}
      >
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>
          <span className="status-dot" style={{ marginRight: 8 }} />
          nexus // identify yourself
        </div>
        <h1 style={{ fontSize: 20, margin: '0 0 20px', color: 'var(--text)' }}>
          &gt; enter a display name
        </h1>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. reddy"
          maxLength={24}
          style={{
            width: '100%',
            background: 'var(--panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '10px 12px',
            color: 'var(--text)',
            fontSize: 14,
            marginBottom: 12,
            outline: 'none'
          }}
        />
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'var(--accent-dim)' : 'var(--accent)',
            color: '#0a0e14',
            border: 'none',
            borderRadius: 4,
            padding: '10px 12px',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {loading ? 'connecting...' : 'join_chat()'}
        </button>
      </form>
    </div>
  );
}
