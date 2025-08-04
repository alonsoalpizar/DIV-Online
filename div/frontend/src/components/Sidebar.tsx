import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaServer, FaLink, FaCogs, FaFileAlt, FaTable, FaTools } from 'react-icons/fa';

import '../styles/globals.css';



const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Inicio', icon: <FaHome /> },
    { to: '/servidores', label: 'Servidores', icon: <FaServer /> },
    { to: '/canales', label: 'Canales', icon: <FaLink /> },
    { to: '/procesos', label: 'Procesos', icon: <FaCogs /> },
    { to: '/parametros', label: 'Parámetros', icon: <FaFileAlt /> },
    { to: '/tablas', label: 'Tablas', icon: <FaTable /> },
      { to: '/configuracion', label: 'Configuración', icon: <FaTools /> },

  ];

  return (
    <div className="sidebar">
      {navItems.map(item => (
        <Link
          key={item.to}
          to={item.to}
          className={location.pathname === item.to ? 'active' : ''}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;

