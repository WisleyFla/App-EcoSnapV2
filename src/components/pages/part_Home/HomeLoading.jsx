// src/components/pages/part_Home/HomeLoading.jsx
import { Search } from 'lucide-react'; // Adicione esta linha

export function HomeLoading() {
  return (
    <main className="main-content">
      <div className="search-bar">
        <Search className="search-icon-bar" />
        <input type="text" className="search-input" placeholder="Buscar no EcoSnap..." />
      </div>
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text-color)' }}>
        Carregando posts...
      </div>
    </main>
  );
}