import { useState, useMemo, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import { FaServer, FaEdit, FaTrash, FaDatabase, FaCloud, FaCode, FaNetworkWired } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';
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

interface Categoria {
  id: string;
  nombre: string;
  color?: string;
  activo: boolean;
}

interface ServidorAgrupado {
  categoria: Categoria | null;
  servidores: Servidor[];
}

const ServidorList: React.FC<Props> = ({ servidores, onEditar, onEliminar }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());
  const [vistaAgrupada, setVistaAgrupada] = useState(true);

  // Cargar categorías de servidores
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch(`${getApiBase()}/categorias?ambito=servidor`);
        const data = await response.json();
        setCategorias(data || []);
        // Inicializar todas las categorías como comprimidas por defecto
        setCategoriasExpandidas(new Set());
      } catch (error) {
        console.error('Error cargando categorías de servidores:', error);
      }
    };
    cargarCategorias();
  }, []);

  // Filtrar servidores por búsqueda
  const servidoresFiltrados = useMemo(() => {
    if (!searchTerm) return servidores;
    
    const term = searchTerm.toLowerCase();
    return servidores.filter(s => 
      s.codigo?.toLowerCase().includes(term) ||
      s.nombre?.toLowerCase().includes(term) ||
      s.host?.toLowerCase().includes(term) ||
      s.tipo?.toLowerCase().includes(term)
    );
  }, [servidores, searchTerm]);

  // Agrupar servidores por categoría
  const servidoresAgrupados = useMemo((): ServidorAgrupado[] => {
    const grupos: Map<string, ServidorAgrupado> = new Map();
    
    // Inicializar grupos con todas las categorías
    categorias.forEach(cat => {
      grupos.set(cat.id, {
        categoria: cat,
        servidores: []
      });
    });
    
    // Grupo para servidores sin categoría
    grupos.set('sin-categoria', {
      categoria: null,
      servidores: []
    });
    
    // Agrupar servidores
    servidoresFiltrados.forEach(servidor => {
      const catId = (servidor as any).categoria_id || 'sin-categoria';
      const grupo = grupos.get(catId) || grupos.get('sin-categoria')!;
      grupo.servidores.push(servidor);
    });
    
    // Convertir a array y filtrar grupos vacíos si hay búsqueda
    return Array.from(grupos.values()).filter(
      grupo => !searchTerm || grupo.servidores.length > 0
    );
  }, [servidoresFiltrados, categorias, searchTerm]);

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
    <div className="card">
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Listado de Servidores</h3>
          
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
              {servidoresFiltrados.length} {servidoresFiltrados.length === 1 ? 'servidor' : 'servidores'}
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
          placeholder="🔍 Buscar por código, nombre, host o tipo..."
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

      {/* Vista Agrupada por Tipo */}
      {vistaAgrupada ? (
        <div style={{ marginTop: '20px' }}>
          {servidoresAgrupados.map(grupo => {
            const categoriaId = grupo.categoria?.id || 'sin-categoria';
            const isExpanded = categoriasExpandidas.has(categoriaId);
            const cantidadServidores = grupo.servidores.length;
            
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
                      <FaServer />
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
                      {cantidadServidores}
                    </span>
                  </div>
                  
                  {cantidadServidores > 0 && (
                    <span style={{ color: '#666', fontSize: '0.9em' }}>
                      {isExpanded ? 'Click para colapsar' : 'Click para expandir'}
                    </span>
                  )}
                </div>

                {/* Lista de Servidores */}
                {isExpanded && cantidadServidores > 0 && (
                  <div style={{ padding: '15px' }}>
                    <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                      {grupo.servidores.map(servidor => (
                        <div key={servidor.id} style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '12px',
                          background: '#fff',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                          {/* Header compacto */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '1.1em', fontWeight: 'bold' }}>
                                {servidor.nombre}
                              </h5>
                              <code style={{ 
                                background: '#f0f0f0', 
                                padding: '2px 6px', 
                                borderRadius: '3px',
                                fontSize: '0.85em',
                                color: '#666'
                              }}>
                                {servidor.codigo}
                              </code>
                            </div>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: grupo.categoria?.color || '#999',
                              color: '#fff',
                              fontSize: '0.8em',
                              fontWeight: 'bold'
                            }}>
                              {servidor.tipo}
                            </span>
                          </div>

                          {/* Info compacta */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#666' }}>
                              <span><strong>Host:</strong> {servidor.host}</span>
                              <span><strong>Puerto:</strong> {servidor.puerto}</span>
                            </div>
                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                              <strong>Usuario:</strong> {servidor.usuario}
                            </div>
                            {servidor.extras && Object.keys(servidor.extras).length > 0 && (
                              <div style={{ fontSize: '0.8em', color: '#999', marginTop: '4px' }}>
                                +{Object.keys(servidor.extras).length} configuración{Object.keys(servidor.extras).length > 1 ? 'es' : ''} extra{Object.keys(servidor.extras).length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          {/* Acciones */}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => onEditar(servidor)}
                              style={{
                                padding: '6px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Editar servidor"
                            >
                              <FaEdit size={12} />
                              Editar
                            </button>
                            <button 
                              onClick={() => {
                                if (servidor.id && confirm(`¿Eliminar servidor "${servidor.nombre}"?`)) {
                                  onEliminar(servidor.id);
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                border: '1px solid #dc2626',
                                borderRadius: '4px',
                                background: '#fff',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Eliminar servidor"
                            >
                              <FaTrash size={12} />
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
        /* Vista de Tarjetas Original (más compacta) */
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '20px' }}>
          {servidoresFiltrados.map(servidor => (
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
      )}
    </div>
  );
};

export default ServidorList;
