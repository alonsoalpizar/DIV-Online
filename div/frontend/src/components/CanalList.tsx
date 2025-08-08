import { Canal } from '../types/canal';
import { FaLink, FaEdit, FaTrash, FaCogs, FaGlobe, FaFile, FaServer, FaNetworkWired, FaDatabase } from 'react-icons/fa';
import './CanalList.css';

interface Props {
  canales: Canal[];
  onEditar: (canal: Canal) => void;
  onEliminar: (id: string) => void;
  onAsignar: (canal: Canal) => void;
}

const getChannelIcon = (tipo: string) => {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('rest') || tipoLower.includes('api')) {
    return <FaGlobe className="channel-type-icon api" />;
  }
  if (tipoLower.includes('soap') || tipoLower.includes('web')) {
    return <FaServer className="channel-type-icon soap" />;
  }
  if (tipoLower.includes('file') || tipoLower.includes('archivo')) {
    return <FaFile className="channel-type-icon file" />;
  }
  if (tipoLower.includes('database') || tipoLower.includes('db')) {
    return <FaDatabase className="channel-type-icon database" />;
  }
  if (tipoLower.includes('socket') || tipoLower.includes('tcp')) {
    return <FaNetworkWired className="channel-type-icon socket" />;
  }
  return <FaLink className="channel-type-icon default" />;
};

const getChannelTypeClass = (tipo: string) => {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('rest') || tipoLower.includes('api')) return 'api';
  if (tipoLower.includes('soap') || tipoLower.includes('web')) return 'soap';
  if (tipoLower.includes('file') || tipoLower.includes('archivo')) return 'file';
  if (tipoLower.includes('database') || tipoLower.includes('db')) return 'database';
  if (tipoLower.includes('socket') || tipoLower.includes('tcp')) return 'socket';
  return 'default';
};

const getStatusIndicator = () => {
  // Aquí podrías agregar lógica para determinar el estado del canal
  // Por ahora, asumimos que todos están activos
  return <div className="status-indicator active" title="Canal activo"></div>;
};

const CanalList: React.FC<Props> = ({ canales, onEditar, onEliminar, onAsignar }) => {

  if (canales.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FaLink />
        </div>
        <h3 className="empty-state-title">No hay canales</h3>
        <p className="empty-state-description">
          Crea tu primer canal para comenzar a configurar integraciones
        </p>
      </div>
    );
  }

  return (
    <div className="canales-grid">
      {canales.map(canal => (
        <div key={canal.id} className={`canal-card ${getChannelTypeClass(canal.tipoPublicacion)}`}>
          {/* Header */}
          <div className="canal-card-header">
            <div className="canal-info">
              {getChannelIcon(canal.tipoPublicacion)}
              <div>
                <h4 className="canal-nombre">{canal.nombre}</h4>
                <span className="canal-codigo">{canal.codigo}</span>
              </div>
            </div>
            <div className="canal-status">
              {getStatusIndicator()}
              <span className={`canal-tipo-badge ${getChannelTypeClass(canal.tipoPublicacion)}`}>
                {canal.tipoPublicacion}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="canal-card-body">
            <div className="canal-details">
              <div className="detail-item">
                <span className="detail-label">Puerto:</span>
                <span className="detail-value">{canal.puerto}</span>
              </div>
              
              {/* Información adicional del canal */}
              {(canal as any).descripcion && (
                <div className="detail-item full-width">
                  <span className="detail-label">Descripción:</span>
                  <span className="detail-value description">{(canal as any).descripcion}</span>
                </div>
              )}
              
              {/* Extras info si existe */}
              {canal.extras && Object.keys(canal.extras).length > 0 && (
                <div className="canal-extras">
                  <span className="extras-count">
                    +{Object.keys(canal.extras).length} configuración{Object.keys(canal.extras).length > 1 ? 'es' : ''} extra{Object.keys(canal.extras).length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="canal-card-actions">
            <button 
              className="btn-action btn-edit"
              onClick={() => onEditar(canal)}
              title="Editar canal"
            >
              <FaEdit />
              Editar
            </button>
            <button 
              className="btn-action btn-config"
              onClick={() => onAsignar(canal)}
              title="Configurar procesos"
            >
              <FaCogs />
              Procesos
            </button>
            <button 
              className="btn-action btn-delete"
              onClick={() => {
                if (confirm(`¿Eliminar canal "${canal.nombre}"?`)) {
                  onEliminar(canal.id);
                }
              }}
              title="Eliminar canal"
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

export default CanalList;
