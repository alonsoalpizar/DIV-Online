import { useState, useMemo, useEffect } from 'react';
import { Canal } from '../types/canal';
import { FaLink, FaEdit, FaTrash, FaCogs, FaGlobe, FaFile, FaServer, FaNetworkWired, FaDatabase } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';
import './CanalList.css';

interface Props {
  canales: Canal[];
  onEditar: (canal: Canal) => void;
  onEliminar: (id: string) => void;
  onAsignar: (canal: Canal) => void;
}

interface Categoria {
  id: string;
  nombre: string;
  color?: string;
  activo: boolean;
}

interface CanalAgrupado {
  categoria: Categoria | null;
  canales: Canal[];
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());
  const [vistaAgrupada, setVistaAgrupada] = useState(true);

  // Cargar categorías de canales
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch(`${getApiBase()}/categorias?ambito=canal`);
        const data = await response.json();
        setCategorias(data || []);
        // Inicializar todas las categorías como comprimidas por defecto
        setCategoriasExpandidas(new Set());
      } catch (error) {
        console.error('Error cargando categorías de canales:', error);
      }
    };
    cargarCategorias();
  }, []);

  // Filtrar canales por búsqueda
  const canalesFiltrados = useMemo(() => {
    if (!searchTerm) return canales;
    
    const term = searchTerm.toLowerCase();
    return canales.filter(c => 
      c.codigo?.toLowerCase().includes(term) ||
      c.nombre?.toLowerCase().includes(term) ||
      c.tipoPublicacion?.toLowerCase().includes(term) ||
      c.puerto?.toLowerCase().includes(term)
    );
  }, [canales, searchTerm]);

  // Agrupar canales por categoría
  const canalesAgrupados = useMemo((): CanalAgrupado[] => {
    const grupos: Map<string, CanalAgrupado> = new Map();
    
    // Inicializar grupos con todas las categorías
    categorias.forEach(cat => {
      grupos.set(cat.id, {
        categoria: cat,
        canales: []
      });
    });
    
    // Grupo para canales sin categoría
    grupos.set('sin-categoria', {
      categoria: null,
      canales: []
    });
    
    // Agrupar canales
    canalesFiltrados.forEach(canal => {
      const catId = canal.categoria_id || 'sin-categoria';
      const grupo = grupos.get(catId) || grupos.get('sin-categoria')!;
      grupo.canales.push(canal);
    });
    
    // Convertir a array y filtrar grupos vacíos si hay búsqueda
    return Array.from(grupos.values()).filter(
      grupo => !searchTerm || grupo.canales.length > 0
    );
  }, [canalesFiltrados, categorias, searchTerm]);

  // Toggle expandir/colapsar categoría
  const toggleCategoria = (categoriaId: string) => {
    const nuevasExpandidas = new Set(categoriasExpandidas);
    if (nuevasExpandidas.has(categoriaId)) {
      nuevasExpandidas.delete(categoriaId);
    } else {
      nuevasExpandidas.add(categoriaId);
    }
    setCategoriasExpandidas(nuevasExpandidas);
  };

  // Expandir/Colapsar todas
  const toggleTodasCategorias = (expandir: boolean) => {
    if (expandir) {
      const ids = new Set(categorias.map(c => c.id));
      ids.add('sin-categoria');
      setCategoriasExpandidas(ids);
    } else {
      setCategoriasExpandidas(new Set());
    }
  };

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
    <div className="card">
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Listado de Canales</h3>
          
          {/* Controles de vista */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ 
              padding: '4px 12px',
              background: '#f0f0f0',
              borderRadius: '12px',
              fontSize: '0.9em',
              fontWeight: 'bold',
              color: '#666'
            }}>
              {canalesFiltrados.length} {canalesFiltrados.length === 1 ? 'canal' : 'canales'}
            </span>
            
            <button
              onClick={() => setVistaAgrupada(!vistaAgrupada)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: vistaAgrupada ? '#f0f0f0' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={vistaAgrupada ? 'Cambiar a vista de tarjetas' : 'Cambiar a vista agrupada'}
            >
              {vistaAgrupada ? '📁 Agrupada' : '🗃️ Tarjetas'}
            </button>
            
            {vistaAgrupada && (
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => toggleTodasCategorias(true)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                  title="Expandir todas"
                >
                  ➕
                </button>
                <button
                  onClick={() => toggleTodasCategorias(false)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                  title="Colapsar todas"
                >
                  ➖
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="🔍 Buscar por código, nombre, tipo o puerto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.95em'
          }}
        />
      </div>

      {/* Vista Agrupada por Categorías */}
      {vistaAgrupada ? (
        <div style={{ marginTop: '20px' }}>
          {canalesAgrupados.map(grupo => {
            const categoriaId = grupo.categoria?.id || 'sin-categoria';
            const isExpanded = categoriasExpandidas.has(categoriaId);
            const cantidadCanales = grupo.canales.length;
            
            return (
              <div 
                key={categoriaId}
                style={{ 
                  marginBottom: '15px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* Header de Categoría */}
                <div
                  onClick={() => toggleCategoria(categoriaId)}
                  style={{
                    padding: '12px 15px',
                    background: grupo.categoria?.color ? `${grupo.categoria.color}15` : '#f5f5f5',
                    borderLeft: `4px solid ${grupo.categoria?.color || '#999'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = grupo.categoria?.color 
                      ? `${grupo.categoria.color}25` 
                      : '#eeeeee';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = grupo.categoria?.color 
                      ? `${grupo.categoria.color}15` 
                      : '#f5f5f5';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2em' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <div style={{ color: grupo.categoria?.color || '#666', marginRight: '8px' }}>
                      <FaLink />
                    </div>
                    <strong style={{ fontSize: '1.1em' }}>
                      {grupo.categoria?.nombre || 'Sin Categoría'}
                    </strong>
                    <span 
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: grupo.categoria?.color || '#999',
                        color: '#fff',
                        fontSize: '0.9em',
                        fontWeight: 'bold'
                      }}
                    >
                      {cantidadCanales}
                    </span>
                  </div>
                  
                  {cantidadCanales > 0 && (
                    <span style={{ color: '#666', fontSize: '0.9em' }}>
                      {isExpanded ? 'Click para colapsar' : 'Click para expandir'}
                    </span>
                  )}
                </div>

                {/* Lista de Canales */}
                {isExpanded && cantidadCanales > 0 && (
                  <div style={{ padding: '15px' }}>
                    <div className="canales-grid">
                      {grupo.canales.map(canal => (
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista de Tarjetas Original */
        <div className="canales-grid" style={{ marginTop: '20px' }}>
          {canalesFiltrados.map(canal => (
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
      )}
    </div>
  );
};

export default CanalList;
