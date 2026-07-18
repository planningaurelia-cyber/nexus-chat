import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AuthGate from './components/AuthGate';
import Sidebar from './components/Sidebar';
import ChatRoom from './components/ChatRoom';
import EvilEye from './components/EvilEye';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [people, setPeople] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);

  // active thread: either { type: 'room', id, name } or { type: 'dm', id (conversation id), name }
  const [activeThread, setActiveThread] = useState(null);
  const [openingDm, setOpeningDm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore existing anonymous session on reload, if any
  useEffect(() => {
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setCurrentUser({ id: session.user.id, display_name: profile.display_name });
        }
      }
      setCheckingSession(false);
    };
    restore();
  }, []);

  // Load rooms + other people once we have a user
  useEffect(() => {
    if (!currentUser) return;

    const loadRooms = async () => {
      const { data, error } = await supabase.from('rooms').select('*').order('name');
      if (!error && data) {
        setRooms(data);
        if (data.length > 0) {
          setActiveThread(prev => prev || { type: 'room', id: data[0].id, name: data[0].name });
        }
      }
    };

    const loadPeople = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .order('display_name');
      if (!error && data) setPeople(data);
    };

    loadRooms();
    loadPeople();
  }, [currentUser]);

  const handleSelectRoom = roomId => {
    const room = rooms.find(r => r.id === roomId);
    if (room) setActiveThread({ type: 'room', id: room.id, name: room.name });
    setSidebarOpen(false);
  };

  const handleSelectPerson = async person => {
    setOpeningDm(true);
    try {
      // Look for an existing conversation between the two of us, in either order
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(user_a.eq.${currentUser.id},user_b.eq.${person.id}),and(user_a.eq.${person.id},user_b.eq.${currentUser.id})`
        )
        .maybeSingle();

      if (findError) throw findError;

      let conversationId = existing?.id;

      if (!conversationId) {
        const { data: created, error: createError } = await supabase
          .from('conversations')
          .insert({ user_a: currentUser.id, user_b: person.id })
          .select()
          .single();
        if (createError) throw createError;
        conversationId = created.id;
      }

      setActiveThread({ type: 'dm', id: conversationId, name: person.display_name });
      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setOpeningDm(false);
    }
  };

  if (checkingSession) {
    return <div className="app-shell" />;
  }

  const filter =
    activeThread?.type === 'room'
      ? { column: 'room_id', value: activeThread.id }
      : activeThread?.type === 'dm'
        ? { column: 'conversation_id', value: activeThread.id }
        : null;

  const title =
    activeThread?.type === 'room' ? `# ${activeThread.name}` : activeThread?.type === 'dm' ? `@ ${activeThread.name}` : '';

  return (
    <div className="app-shell">
      <div className="app-topbar">
        {currentUser && (
          <button
            className={`mobile-menu-toggle${sidebarOpen ? ' open' : ''}`}
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="bar" />
            <span className="bar" />
          </button>
        )}
        <div className="evil-eye-wrapper">
          <EvilEye />
        </div>
      </div>
      <div className="app-body">
        {!currentUser ? (
          <AuthGate onReady={setCurrentUser} />
        ) : (
          <>
            <Sidebar
              rooms={rooms}
              people={people}
              activeKey={
                activeThread?.type === 'room'
                  ? `room:${activeThread.id}`
                  : activeThread?.type === 'dm'
                    ? `dm:${activeThread.id}`
                    : null
              }
              onSelectRoom={handleSelectRoom}
              onSelectPerson={handleSelectPerson}
              currentUser={currentUser}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            {openingDm && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                opening conversation...
              </div>
            )}
            {!openingDm && filter && (
              <ChatRoom key={`${filter.column}:${filter.value}`} filter={filter} title={title} currentUser={currentUser} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
