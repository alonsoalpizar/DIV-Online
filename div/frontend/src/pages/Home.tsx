import { Link } from 'react-router-dom';
import { 
  FaServer, 
  FaLink, 
  FaCogs, 
  FaClock, 
  FaChartBar, 
  FaCode,
  FaArrowRight
} from 'react-icons/fa';

const Home = () => {
  const quickActions = [
    {
      title: 'Crear Servidor',
      description: 'Configura conexiones a bases de datos y servicios',
      icon: <FaServer />,
      link: '/servidores',
      color: 'primary'
    },
    {
      title: 'Nuevo Canal',
      description: 'Publica tus procesos como API REST o SOAP',
      icon: <FaLink />,
      link: '/canales', 
      color: 'success'
    },
    {
      title: 'Diseñar Proceso',
      description: 'Crea flujos visuales de integración',
      icon: <FaCogs />,
      link: '/procesos',
      color: 'warning'
    },
    {
      title: 'Programar Tarea',
      description: 'Automatiza ejecuciones con cron',
      icon: <FaClock />,
      link: '/tareas-programadas',
      color: 'error'
    }
  ];

  const stats = [
    { label: 'Procesos Activos', value: '12', change: '+3 este mes' },
    { label: 'Canales Publicados', value: '8', change: '+1 esta semana' },
    { label: 'Ejecuciones Hoy', value: '147', change: '+23% vs ayer' },
    { label: 'Tiempo Promedio', value: '1.2s', change: '-200ms optimizado' }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Designer de Integración Visual</span>
          </h1>
          <p className="hero-subtitle">
            Plataforma no-code para crear integraciones y automatizaciones empresariales
            con diseño visual y ejecución de alto rendimiento.
          </p>
          <div className="hero-actions">
            <Link to="/procesos" className="btn btn-primary btn-lg">
              <FaCode />
              Crear Proceso
              <FaArrowRight />
            </Link>
            <Link to="/canales" className="btn btn-secondary btn-lg">
              Ver Documentación
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="integration-diagram">
            <div className="diagram-node database">
              <FaServer />
              <span>DB</span>
            </div>
            <div className="diagram-flow"></div>
            <div className="diagram-node process">
              <FaCogs />
              <span>PROCESO</span>
            </div>
            <div className="diagram-flow"></div>
            <div className="diagram-node api">
              <FaLink />
              <span>API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.link} 
              className={`quick-action-card ${action.color}`}
            >
              <div className="action-icon">
                {action.icon}
              </div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <FaArrowRight className="action-arrow" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-section">
        <h2>Resumen del Sistema</h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-change">{stat.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <FaChartBar />
              Actividad Reciente
            </h2>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon success">
                <FaCogs />
              </div>
              <div className="activity-content">
                <div className="activity-title">Proceso "Validar Usuario" ejecutado</div>
                <div className="activity-meta">Canal C001 • hace 2 minutos</div>
              </div>
              <div className="badge badge-success">ÉXITO</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon primary">
                <FaServer />
              </div>
              <div className="activity-content">
                <div className="activity-title">Servidor SOAP "Servicios Bancarios" conectado</div>
                <div className="activity-meta">hace 15 minutos</div>
              </div>
              <div className="badge badge-primary">CONECTADO</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon warning">
                <FaClock />
              </div>
              <div className="activity-content">
                <div className="activity-title">Tarea programada "Reporte Diario" iniciada</div>
                <div className="activity-meta">hace 1 hora</div>
              </div>
              <div className="badge badge-warning">EJECUTANDO</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
