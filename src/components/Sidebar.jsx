import './Sidebar.css';

export default function Sidebar({
  rooms,
  people,
  activeKey,
  onSelectRoom,
  onSelectPerson,
  currentUser,
  isOpen,
  onClose
}) {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <div className={`sidebar${isOpen ? ' open' : ''}`}>
        <div
          style={{
            padding: '18px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>nexus</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              <span className="status-dot" style={{ marginRight: 6 }} />
              online
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }} className="scrollbar-thin">
          <div style={{ padding: '14px 8px 6px', fontSize: 11, color: 'var(--text-muted)' }}>
            # channels
          </div>
          {rooms.map(room => {
            const key = `room:${room.id}`;
            const active = key === activeKey;
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: active ? 'var(--panel-alt)' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  color: active ? 'var(--accent)' : 'var(--text)',
                  padding: '8px 10px',
                  fontSize: 13,
                  marginBottom: 2
                }}
              >
                # {room.name}
              </button>
            );
          })}

          <div style={{ padding: '18px 8px 6px', fontSize: 11, color: 'var(--text-muted)' }}>
            direct messages
          </div>
          {people.length === 0 && (
            <div style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
              no one else here yet
            </div>
          )}
          {people.map(person => {
            const key = `dm:${person.id}`;
            const active = key === activeKey;
            return (
              <button
                key={person.id}
                onClick={() => onSelectPerson(person)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: active ? 'var(--panel-alt)' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  color: active ? 'var(--accent)' : 'var(--text)',
                  padding: '8px 10px',
                  fontSize: 13,
                  marginBottom: 2
                }}
              >
                @ {person.display_name}
              </button>
            );
          })}
        </div>

        {currentUser && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-muted)'
            }}
          >
            logged in as{' '}
            <span style={{ color: 'var(--text)' }}>{currentUser.display_name}</span>
          </div>
        )}
      </div>
    </>
  );
}
