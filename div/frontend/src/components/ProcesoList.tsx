import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Proceso } from '../types/proceso';
import { getApiBase } from '../utils/configuracion';

interface Props {
  procesos: Proceso[];
  onEditar: (proceso: Proceso) => void;
  onEliminar: (id: string) => void;
}

interface Categoria {
  id: string;
  nombre: string;
  color?: string;
}

interface ProcesoAgrupado {
  categoria: Categoria | null;
  procesos: Proceso[];
}

const ProcesoList: React.FC<Props> = ({ procesos, onEditar, onEliminar }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());
  const [vistaAgrupada, setVistaAgrupada] = useState(true);
  
  // Cargar categorías desde el backend
  useEffect(() => {
    fetch(`${getApiBase()}/categorias?ambito=proceso`)
      .then(res => res.json())
      .then(data => {
        setCategorias(data || []);
        // Inicializar todas las categorías como comprimidas por defecto
        setCategoriasExpandidas(new Set());
      })
      .catch(err => console.log('Error cargando categorías de procesos:', err));
  }, []);

  // Filtrar procesos por búsqueda
  const procesosFiltrados = useMemo(() => {
    if (!searchTerm) return procesos;
    
    const term = searchTerm.toLowerCase();
    return procesos.filter(p => 
      p.codigo?.toLowerCase().includes(term) ||
      p.nombre?.toLowerCase().includes(term) ||
      p.descripcion?.toLowerCase().includes(term)
    );
  }, [procesos, searchTerm]);

  // Agrupar procesos por categoría
  const procesosAgrupados = useMemo((): ProcesoAgrupado[] => {
    const grupos: Map<string, ProcesoAgrupado> = new Map();
    
    // Inicializar grupos con todas las categorías
    categorias.forEach(cat => {
      grupos.set(cat.id, {
        categoria: cat,
        procesos: []
      });
    });
    
    // Grupo para procesos sin categoría
    grupos.set('sin-categoria', {
      categoria: null,
      procesos: []
    });
    
    // Agrupar procesos
    procesosFiltrados.forEach(proceso => {
      const catId = (proceso as any).categoria_id || 'sin-categoria';
      const grupo = grupos.get(catId) || grupos.get('sin-categoria')!;
      grupo.procesos.push(proceso);
    });
    
    // Convertir a array y filtrar grupos vacíos si hay búsqueda
    return Array.from(grupos.values()).filter(
      grupo => !searchTerm || grupo.procesos.length > 0
    );
  }, [procesosFiltrados, categorias, searchTerm]);

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

  if (procesos.length === 0) return <p>No hay procesos registrados.</p>;

  return (
    <div className="card">
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Listado de Procesos</h3>
          
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
              {procesosFiltrados.length} {procesosFiltrados.length === 1 ? 'proceso' : 'procesos'}
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
              title={vistaAgrupada ? 'Cambiar a vista de tabla simple' : 'Cambiar a vista agrupada'}
            >
              {vistaAgrupada ? '📁 Agrupada' : '📊 Tabla'}
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
          placeholder="🔍 Buscar por código, nombre o descripción..."
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
          {procesosAgrupados.map(grupo => {
            const categoriaId = grupo.categoria?.id || 'sin-categoria';
            const isExpanded = categoriasExpandidas.has(categoriaId);
            const cantidadProcesos = grupo.procesos.length;
            
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
                      {cantidadProcesos}
                    </span>
                  </div>
                  
                  {cantidadProcesos > 0 && (
                    <span style={{ color: '#666', fontSize: '0.9em' }}>
                      {isExpanded ? 'Click para colapsar' : 'Click para expandir'}
                    </span>
                  )}
                </div>

                {/* Tabla de Procesos */}
                {isExpanded && cantidadProcesos > 0 && (
                  <div style={{ padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9f9f9' }}>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                            Código
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                            Nombre
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                            Descripción
                          </th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.procesos.map((p, index) => (
                          <tr 
                            key={p.id}
                            style={{ 
                              borderBottom: index < grupo.procesos.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}
                          >
                            <td style={{ padding: '10px' }}>
                              <code style={{ 
                                background: '#f0f0f0', 
                                padding: '2px 6px', 
                                borderRadius: '3px',
                                fontSize: '0.9em'
                              }}>
                                {p.codigo}
                              </code>
                            </td>
                            <td style={{ padding: '10px', fontWeight: '500' }}>
                              {p.nombre}
                            </td>
                            <td style={{ padding: '10px', color: '#666' }}>
                              {p.descripcion || '-'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditar(p);
                                }}
                                style={{ marginRight: '5px' }}
                                title="Editar proceso"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`¿Eliminar proceso "${p.nombre}"?`)) {
                                    onEliminar(p.id);
                                  }
                                }}
                                style={{ marginRight: '5px' }}
                                title="Eliminar proceso"
                              >
                                🗑️
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/flujo/${p.id}`);
                                }}
                                title="Diseñar flujo"
                              >
                                🧩 Diseñar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Mensaje cuando no hay procesos */}
                {isExpanded && cantidadProcesos === 0 && (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    No hay procesos en esta categoría
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista de Tabla Simple (original) */
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {procesosFiltrados.map(p => {
              const categoria = categorias.find(c => c.id === (p as any).categoria_id);
              return (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.descripcion}</td>
                  <td>
                    {categoria ? (
                      <span style={{ 
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: categoria.color || '#e0e0e0',
                        color: '#fff',
                        fontSize: '0.9em'
                      }}>
                        {categoria.nombre}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>Sin categoría</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => onEditar(p)}>✏️</button>
                    <button onClick={() => {
                      if (confirm(`¿Eliminar proceso "${p.nombre}"?`)) {
                        onEliminar(p.id);
                      }
                    }}>🗑️</button>
                    <button onClick={() => navigate(`/flujo/${p.id}`)}>🧩 Diseñar Flujo</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

    </div>
  );
};

export default ProcesoList;