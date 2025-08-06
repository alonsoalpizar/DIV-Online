import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaUserCircle, FaCog } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';
import '../styles/globals.css';
import '../styles/topbar.css';

const Topbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Llamada real a la API
      const apiUrl = `${getApiBase()}/search?q=${encodeURIComponent(term)}`;
      console.log('🔍 Buscando en:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📡 Respuesta:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      
      setSearchResults(data.results || []);
      setShowResults(data.results && data.results.length > 0);
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleResultClick = (result: any) => {
    const routes: Record<string, string> = {
      proceso: '/procesos',
      canal: '/canales',
      servidor: '/servidores',
      parametro: '/parametros',
      tarea: '/tareas-programadas'
    };
    
    navigate(routes[result.type] || '/');
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <header className="topbar-modern">
      <div className="topbar-content">
        <div className="topbar-left">
          <div className="topbar-search">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar procesos, canales, servidores..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {showResults && (
              <div className="search-dropdown">
                {searchResults.map(result => (
                  <div 
                    key={result.id}
                    className="search-result-item"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="result-type">{result.type}</div>
                    <div className="result-name">{result.name}</div>
                    <div className="result-description">{result.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="topbar-right">
          <div className="topbar-actions">
            <button className="topbar-action" title="Notificaciones">
              <FaBell />
              <span className="notification-badge">3</span>
            </button>
            <button className="topbar-action" title="Configuración">
              <FaCog />
            </button>
            <button className="topbar-profile">
              <FaUserCircle />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
