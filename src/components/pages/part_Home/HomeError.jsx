// src/components/pages/part_Home/HomeError.jsx
export function HomeError({ error, onRetry }) {
  return (
    <main className="main-content">
      <div className="search-bar">
        <Search className="search-icon-bar" />
        <input type="text" className="search-input" placeholder="Buscar no EcoSnap..." />
      </div>
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text-color)' }}>
        <h3>❌ Erro ao carregar posts</h3>
        <p>{error}</p>
        <button onClick={onRetry} style={{ 
          background: '#10b981', 
          color: 'white', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '6px', 
          cursor: 'pointer' 
        }}>
          Tentar Novamente
        </button>
      </div>
    </main>
  );
}