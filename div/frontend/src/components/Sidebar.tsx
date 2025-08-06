import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaServer, FaLink, FaCogs, FaFileAlt, FaTable, FaTools, FaClock, FaCode } from 'react-icons/fa';
import { useSystemCounts } from '../hooks/useSystemCounts';
import '../styles/globals.css';
import '../styles/sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { counts, loading } = useSystemCounts();

  const getNavItems = () => [
    { to: '/', label: 'Inicio', icon: <FaHome />, badge: null },
    { 
      to: '/servidores', 
      label: 'Servidores', 
      icon: <FaServer />, 
      badge: loading ? '...' : (counts.servidores > 0 ? counts.servidores.toString() : null)
    },
    { 
      to: '/canales', 
      label: 'Canales', 
      icon: <FaLink />, 
      badge: loading ? '...' : (counts.canales > 0 ? counts.canales.toString() : null)
    },
    { 
      to: '/procesos', 
      label: 'Procesos', 
      icon: <FaCogs />, 
      badge: loading ? '...' : (counts.procesos > 0 ? counts.procesos.toString() : null)
    },
    { 
      to: '/tareas-programadas', 
      label: 'Tareas Programadas', 
      icon: <FaClock />, 
      badge: loading ? '...' : (counts.tareas > 0 ? counts.tareas.toString() : null)
    },
    { 
      to: '/parametros', 
      label: 'Parámetros', 
      icon: <FaFileAlt />, 
      badge: loading ? '...' : (counts.parametros > 0 ? counts.parametros.toString() : null)
    },
    { 
      to: '/tablas', 
      label: 'Tablas', 
      icon: <FaTable />, 
      badge: loading ? '...' : (counts.tablas > 0 ? counts.tablas.toString() : null)
    },
    { to: '/configuracion', label: 'Configuración', icon: <FaTools />, badge: null },
  ];

  const navItems = getNavItems();

  return (
    <div className="sidebar-modern">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <FaCode />
          <span>DIV</span>
        </div>
        <div className="sidebar-title">Designer de Integración</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`sidebar-item ${location.pathname === item.to ? 'active' : ''}`}
          >
            <div className="sidebar-item-icon">
              {item.icon}
            </div>
            <span className="sidebar-item-label">{item.label}</span>
            {item.badge && (
              <span className={`sidebar-item-badge ${loading ? 'loading' : ''}`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            <FaTools />
          </div>
          <div className="user-info">
            <div className="user-name">Sistema</div>
            <div className="user-status">En línea</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

