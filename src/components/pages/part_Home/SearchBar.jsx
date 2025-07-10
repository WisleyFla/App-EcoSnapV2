import { Search } from 'lucide-react';

export function SearchBar({ onRefresh, refreshing }) {
  return (
    <div className="search-bar">
      <Search className="search-icon-bar" />
      <input type="text" className="search-input" placeholder="Buscar no EcoSnap..." />
      <button 
        className="refresh-btn" 
        onClick={onRefresh}
        disabled={refreshing}
        title="Atualizar feed"
      >
        🔄
      </button>
    </div>
  );
}