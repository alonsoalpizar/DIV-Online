import { Servidor } from '../types/servidor';
import { FaServer, FaEdit, FaTrash, FaDatabase, FaCloud, FaCode, FaNetworkWired } from 'react-icons/fa';
import './ServidorList.css';

interface Props {
  servidores: Servidor[];
  onEditar: (servidor: Servidor) => void;
  onEliminar: (id: string) => void;
}

const getServerIcon = (tipo: string) => {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('sql') || tipoLower.includes('mysql') || tipoLower.includes('postgres')) {
    return <FaDatabase className="server-type-icon database" />;
  }
  if (tipoLower.includes('rest') || tipoLower.includes('soap')) {
    return <FaCode className="server-type-icon api" />;
  }
  if (tipoLower.includes('mongo') || tipoLower.includes('redis')) {
    return <FaCloud className="server-type-icon nosql" />;
  }
  if (tipoLower.includes('kafka') || tipoLower.includes('rabbit')) {
    return <FaNetworkWired className="server-type-icon messaging" />;
  }
  return <FaServer className="server-type-icon default" />;
};

const getServerTypeClass = (tipo: string) => {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('sql') || tipoLower.includes('mysql') || tipoLower.includes('postgres')) return 'database';
  if (tipoLower.includes('rest') || tipoLower.includes('soap')) return 'api';
  if (tipoLower.includes('mongo') || tipoLower.includes('redis')) return 'nosql';
  if (tipoLower.includes('kafka') || tipoLower.includes('rabbit')) return 'messaging';
  return 'default';
};

const ServidorList: React.FC<Props> = ({ servidores, onEditar, onEliminar }) => {
  if (servidores.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FaServer />
        </div>
        <h3 className="empty-state-title">No hay servidores</h3>
        <p className="empty-state-description">
          Crea tu primer servidor para comenzar a configurar conexiones
        </p>
      </div>
    );
  }

  return (
    <div className="servidores-grid">
      {servidores.map(servidor => (
        <div key={servidor.id} className={`servidor-card ${getServerTypeClass(servidor.tipo)}`}>
          {/* Header */}
          <div className="servidor-card-header">
            <div className="servidor-info">
              {getServerIcon(servidor.tipo)}
              <div>
                <h4 className="servidor-nombre">{servidor.nombre}</h4>
                <span className="servidor-codigo">{servidor.codigo}</span>
              </div>
            </div>
            <span className={`servidor-tipo-badge ${getServerTypeClass(servidor.tipo)}`}>
              {servidor.tipo}
            </span>
          </div>

          {/* Body */}
          <div className="servidor-card-body">
            <div className="servidor-connection">
              <div className="connection-item">
                <span className="connection-label">Host:</span>
                <span className="connection-value">{servidor.host}</span>
              </div>
              <div className="connection-item">
                <span className="connection-label">Puerto:</span>
                <span className="connection-value">{servidor.puerto}</span>
              </div>
              <div className="connection-item">
                <span className="connection-label">Usuario:</span>
                <span className="connection-value">{servidor.usuario}</span>
              </div>
            </div>
            
            {/* Extras info si existe */}
            {servidor.extras && Object.keys(servidor.extras).length > 0 && (
              <div className="servidor-extras">
                <span className="extras-count">
                  +{Object.keys(servidor.extras).length} configuración{Object.keys(servidor.extras).length > 1 ? 'es' : ''} extra{Object.keys(servidor.extras).length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="servidor-card-actions">
            <button 
              className="btn-action btn-edit"
              onClick={() => onEditar(servidor)}
              title="Editar servidor"
            >
              <FaEdit />
              Editar
            </button>
            <button 
              className="btn-action btn-delete"
              onClick={() => {
                if (servidor.id && confirm(`¿Eliminar servidor "${servidor.nombre}"?`)) {
                  onEliminar(servidor.id);
                }
              }}
              title="Eliminar servidor"
            >
              <FaTrash />
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServidorList;
