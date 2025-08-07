import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaUserCircle, FaCog, FaFlask } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';
import '../styles/globals.css';
import '../styles/topbar.css';

const Topbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const configDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target as Node)) {
        setShowConfigMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleConfigMenuToggle = () => {
    setShowConfigMenu(!showConfigMenu);
  };

  const handleNavigateToTestClient = () => {
    navigate('/test-client');
    setShowConfigMenu(false);
  };

  const handleNavigateToSystemConfig = () => {
    navigate('/configuracion');
    setShowConfigMenu(false);
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
            <div className="topbar-dropdown-container" ref={configDropdownRef}>
              <button 
                className="topbar-action" 
                title="Configuración"
                onClick={handleConfigMenuToggle}
              >
                <FaCog />
              </button>
              {showConfigMenu && (
                <div className="config-dropdown">
                  <div 
                    className="config-dropdown-item"
                    onClick={handleNavigateToTestClient}
                  >
                    <FaFlask className="config-icon" />
                    <span>Cliente de Pruebas</span>
                  </div>
                  <div 
                    className="config-dropdown-item"
                    onClick={handleNavigateToSystemConfig}
                  >
                    <FaCog className="config-icon" />
                    <span>Configuración Sistema</span>
                  </div>
                </div>
              )}
            </div>
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
