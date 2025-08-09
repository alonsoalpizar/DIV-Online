import { useEffect, useState } from 'react';
import axios from 'axios';
import { Proceso } from '../types/proceso';
import { Canal } from '../types/canal';
import { CanalProceso } from '../types/canalProceso';
import { getApiBase } from '../utils/configuracion';
import { FaCogs, FaLink, FaTrash, FaEdit, FaCheck, FaExclamationTriangle, FaGlobe, FaServer, FaFile } from 'react-icons/fa';
import './AsignarProcesosACanal.css';



  interface Props {
  canal: Canal | null;
  onCancelar: () => void;
  onAsignar?: (
    asignaciones: { canalId: string; procesoId: string; trigger: string }[]
  ) => Promise<void>;
}


// Métodos HTTP válidos
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

// Endpoints de ejemplo para autocompletar
const EXAMPLE_ENDPOINTS = ['usuarios', 'productos', 'pedidos', 'reportes', 'configuracion', 'ejecutarconsulta', 'obtenerDatos', 'procesarOrden'];

const AsignarProcesosACanal: React.FC<Props> = ({ canal, onCancelar, onAsignar }) => {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [asignados, setAsignados] = useState<CanalProceso[]>([]);
  const [triggers, setTriggers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Estados para la UX mejorada
  const [triggerErrors, setTriggerErrors] = useState<Record<string, string>>({});
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);
  const [restConfigs, setRestConfigs] = useState<Record<string, {ruta: string, metodo: string}>>({});

  useEffect(() => {
    if (!canal) return;

    axios.get(`${getApiBase()}/procesos`) 
      .then(res => setProcesos(res.data))
      .catch(err => console.error('Error al cargar procesos:', err));

    axios.get(`${getApiBase()}/canal-procesos/${canal.id}`)
      .then(res => setAsignados(res.data))
      .catch(err => console.error('Error al cargar asignaciones:', err))
      .finally(() => setLoading(false));
  }, [canal]);

  // Funciones de validación y utilidad
  const validateRestTrigger = (trigger: string): string | null => {
    if (!trigger.trim()) return 'El endpoint es obligatorio';
    
    if (!trigger.includes('|')) {
      return 'Formato incorrecto. Use: endpoint|METODO';
    }
    
    const [endpoint, metodo] = trigger.split('|');
    
    if (!endpoint || !endpoint.trim()) {
      return 'El endpoint no puede estar vacío';
    }
    
    if (!metodo || !HTTP_METHODS.includes(metodo.toUpperCase())) {
      return `Método HTTP inválido. Use: ${HTTP_METHODS.join(', ')}`;
    }
    
    // Verificar si ya existe esta combinación
    const exists = asignados.some(a => a.trigger === trigger);
    if (exists) {
      return 'Esta combinación de ruta y método ya existe';
    }
    
    return null;
  };

  const validateSoapTrigger = (trigger: string): string | null => {
    if (!trigger.trim()) return 'El soapAction es obligatorio';
    if (trigger.length < 3) return 'El soapAction debe tener al menos 3 caracteres';
    
    // Verificar si ya existe
    const exists = asignados.some(a => a.trigger === trigger);
    if (exists) {
      return 'Este soapAction ya existe';
    }
    
    return null;
  };

  const validateSimpleTrigger = (trigger: string): string | null => {
    if (!trigger.trim()) return 'El trigger es obligatorio';
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trigger)) {
      return 'Use solo letras, números y guiones bajos. Debe comenzar con letra';
    }
    
    // Verificar si ya existe
    const exists = asignados.some(a => a.trigger === trigger);
    if (exists) {
      return 'Este trigger ya existe';
    }
    
    return null;
  };

  const validateTrigger = (procesoId: string, trigger: string): string | null => {
    switch (canal?.tipoPublicacion) {
      case 'REST':
        return validateRestTrigger(trigger);
      case 'SOAP':
        return validateSoapTrigger(trigger);
      case 'SIMPLE':
        return validateSimpleTrigger(trigger);
      default:
        return trigger.trim() ? null : 'El trigger es obligatorio';
    }
  };

  const updateRestConfig = (procesoId: string, ruta: string, metodo: string) => {
    setRestConfigs(prev => ({
      ...prev,
      [procesoId]: { ruta, metodo }
    }));
    
    const trigger = `${ruta}|${metodo}`;
    setTriggers(prev => ({ ...prev, [procesoId]: trigger }));
    
    const error = validateTrigger(procesoId, trigger);
    setTriggerErrors(prev => ({
      ...prev,
      [procesoId]: error || ''
    }));
  };

const handleAsignar = async (procesoId: string) => {
  const trigger = triggers[procesoId];
  if (!trigger || !canal) {
    alert('Todos los campos son obligatorios');
    return;
  }

  // Validar antes de enviar
  const error = validateTrigger(procesoId, trigger);
  if (error) {
    setTriggerErrors(prev => ({ ...prev, [procesoId]: error }));
    return;
  }

  const nuevaAsignacion = {
    canalId: canal.id,
    procesoId,
    trigger,
  };

  try {
    if (onAsignar) {
      // usar la función externa pasada desde Canales.tsx
      await onAsignar([nuevaAsignacion]);
    } else {
      // lógica por defecto (autónoma)
      await axios.post(`${getApiBase()}/canal-procesos`, nuevaAsignacion);
    }

    // Limpiar estados después de asignación exitosa
    setTriggers(prev => ({ ...prev, [procesoId]: '' }));
    setTriggerErrors(prev => ({ ...prev, [procesoId]: '' }));
    setRestConfigs(prev => ({ ...prev, [procesoId]: { ruta: '', metodo: 'POST' } }));
    
    const res = await axios.get(`${getApiBase()}/canal-procesos/${canal.id}`);
    setAsignados(res.data);
  } catch (err) {
    console.error('Ocurrió un error al asignar el proceso:', err);
    alert("Error al asignar el proceso.");
  }
};



  const handleDesasignar = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/canal-procesos/${id}`);
      const res = await axios.get(`${getApiBase()}/canal-procesos/${canal?.id}`);
      setAsignados(res.data);
    } catch (err) {
      console.error('Error al desasignar proceso:', err);
    }
  };

  const handleEditarTrigger = async (id: string, nuevoTrigger: string) => {
    try {
      await axios.put(`${getApiBase()}/canal-procesos/${id}`, {
        trigger: nuevoTrigger,
      });
      const res = await axios.get(`${getApiBase()}/canal-procesos/${canal?.id}`);
      setAsignados(res.data);
    } catch (err) {
      console.error('Error al actualizar trigger:', err);
    }
  };

  if (!canal) {
    return <p style={{ color: 'red' }}>Error: No se ha proporcionado un canal válido.</p>;
  }

  const procesosDisponibles = procesos.filter(
    p => !asignados.some(a => a.procesoId === p.id)
  );

  const getChannelIcon = () => {
    switch (canal?.tipoPublicacion) {
      case 'REST': return <FaGlobe className="channel-icon rest" />;
      case 'SOAP': return <FaServer className="channel-icon soap" />;
      case 'FILE': return <FaFile className="channel-icon file" />;
      default: return <FaLink className="channel-icon default" />;
    }
  };

  const renderRestTriggerInput = (procesoId: string) => {
    const config = restConfigs[procesoId] || { ruta: '', metodo: 'POST' };
    const error = triggerErrors[procesoId];

    return (
      <div className="rest-trigger-input">
        <div className="rest-input-group">
          <div className="rest-route">
            <input
              type="text"
              value={config.ruta}
              onChange={(e) => updateRestConfig(procesoId, e.target.value, config.metodo)}
              placeholder="ejecutarconsulta"
              className={error ? 'error' : ''}
              list={`endpoints-${procesoId}`}
            />
            <datalist id={`endpoints-${procesoId}`}>
              {EXAMPLE_ENDPOINTS.map(endpoint => (
                <option key={endpoint} value={endpoint} />
              ))}
            </datalist>
          </div>
          <div className="rest-separator">|</div>
          <select
            value={config.metodo}
            onChange={(e) => updateRestConfig(procesoId, config.ruta, e.target.value)}
            className="rest-method"
          >
            {HTTP_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
        <div className="url-preview">
          <strong>URL final:</strong> http://servidor:{canal?.puerto}{config.ruta || '/ruta'}
        </div>
      </div>
    );
  };

  const renderSimpleTriggerInput = (procesoId: string) => {
    const error = triggerErrors[procesoId];
    const trigger = triggers[procesoId] || '';

    return (
      <div className="simple-trigger-input">
        <input
          type="text"
          value={trigger}
          onChange={(e) => {
            const value = e.target.value;
            setTriggers(prev => ({ ...prev, [procesoId]: value }));
            const error = validateTrigger(procesoId, value);
            setTriggerErrors(prev => ({ ...prev, [procesoId]: error || '' }));
          }}
          placeholder="ConsultaRecibo"
          className={error ? 'error' : ''}
        />
        {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
        <div className="trigger-preview">
          <strong>Payload de ejemplo:</strong> {`{ "trigger": "${trigger || 'ConsultaRecibo'}", "data": {...} }`}
        </div>
      </div>
    );
  };

  const renderSoapTriggerInput = (procesoId: string) => {
    const error = triggerErrors[procesoId];
    const trigger = triggers[procesoId] || '';

    return (
      <div className="soap-trigger-input">
        <input
          type="text"
          value={trigger}
          onChange={(e) => {
            const value = e.target.value;
            setTriggers(prev => ({ ...prev, [procesoId]: value }));
            const error = validateTrigger(procesoId, value);
            setTriggerErrors(prev => ({ ...prev, [procesoId]: error || '' }));
          }}
          placeholder="procesarPago"
          className={error ? 'error' : ''}
        />
        {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
        <div className="soap-preview">
          <strong>SOAP Action:</strong> "{trigger || 'procesarPago'}"
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-state">
        <FaCogs className="loading-icon" />
        <p>Cargando procesos...</p>
      </div>
    );
  }

  return (
    <div className="asignar-procesos-container">
      <div className="asignar-header">
        <div className="channel-info">
          {getChannelIcon()}
          <div>
            <h2>Configuración de Procesos</h2>
            <p className="channel-details">
              Canal: <strong>{canal.nombre}</strong> • Tipo: <strong>{canal.tipoPublicacion}</strong> • Puerto: <strong>{canal.puerto}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Procesos Disponibles */}
      <div className="section">
        <h3><FaLink /> Procesos Disponibles</h3>
        {procesosDisponibles.length === 0 ? (
          <div className="empty-state">
            <p>Todos los procesos ya están asignados a este canal</p>
          </div>
        ) : (
          <div className="procesos-grid">
            {procesosDisponibles.map((proceso) => (
              <div key={proceso.id} className="proceso-card disponible">
                <div className="proceso-info">
                  <h4>{proceso.nombre}</h4>
                  <p className="proceso-codigo">{proceso.codigo}</p>
                </div>
                
                <div className="trigger-config">
                  {canal.tipoPublicacion === 'REST' && renderRestTriggerInput(proceso.id)}
                  {canal.tipoPublicacion === 'SOAP' && renderSoapTriggerInput(proceso.id)}
                  {canal.tipoPublicacion === 'SIMPLE' && renderSimpleTriggerInput(proceso.id)}
                </div>

                <div className="proceso-actions">
                  <button 
                    className="btn-assign"
                    onClick={() => handleAsignar(proceso.id)}
                    disabled={!!triggerErrors[proceso.id] || !triggers[proceso.id]}
                  >
                    <FaCheck /> Asignar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Procesos Asignados */}
      <div className="section">
        <h3><FaCogs /> Procesos Asignados ({asignados.length})</h3>
        {asignados.length === 0 ? (
          <div className="empty-state">
            <p>No hay procesos asignados a este canal</p>
          </div>
        ) : (
          <div className="procesos-grid">
            {asignados.map(asignacion => (
              <div key={asignacion.id} className="proceso-card asignado">
                <div className="proceso-info">
                  <h4>{asignacion.proceso?.nombre}</h4>
                  <p className="proceso-codigo">{asignacion.proceso?.codigo}</p>
                </div>
                
                <div className="trigger-display">
                  {editingTrigger === asignacion.id ? (
                    <div className="edit-trigger">
                      <input
                        type="text"
                        value={asignacion.trigger}
                        onChange={(e) => {
                          const updated = asignados.map(item =>
                            item.id === asignacion.id ? { ...item, trigger: e.target.value } : item
                          );
                          setAsignados(updated);
                        }}
                        onBlur={(e) => {
                          handleEditarTrigger(asignacion.id, e.target.value);
                          setEditingTrigger(null);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditarTrigger(asignacion.id, asignacion.trigger);
                            setEditingTrigger(null);
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="trigger-value">
                      <code>{asignacion.trigger}</code>
                      <button 
                        className="btn-edit-trigger"
                        onClick={() => setEditingTrigger(asignacion.id)}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </div>

                <div className="proceso-actions">
                  <button 
                    className="btn-remove"
                    onClick={() => handleDesasignar(asignacion.id)}
                  >
                    <FaTrash /> Desasignar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información de ayuda */}
      <div className="help-section">
        <h4>Información del Canal</h4>
        {canal.tipoPublicacion === 'REST' && (
          <div className="help-content">
            <p><strong>Canal REST</strong> - Los clientes pueden invocar procesos mediante HTTP:</p>
            <ul>
              <li>URL base: <code>http://servidor:{canal.puerto}</code></li>
              <li>Cada proceso se accede por su ruta específica</li>
              <li>Métodos HTTP soportados: {HTTP_METHODS.join(', ')}</li>
            </ul>
          </div>
        )}
        
        {canal.tipoPublicacion === 'SOAP' && (
          <div className="help-content">
            <p><strong>Canal SOAP</strong> - Servicios web con WSDL:</p>
            <ul>
              <li>Endpoint: <code>http://servidor:{canal.puerto}/soap</code></li>
              <li>Cada proceso tiene su SOAPAction único</li>
              <li>Soporta envelope SOAP estándar</li>
            </ul>
          </div>
        )}

        {canal.tipoPublicacion === 'SIMPLE' && (
          <div className="help-content">
            <p><strong>Canal Simple</strong> - Comunicación mediante triggers:</p>
            <ul>
              <li>Endpoint: <code>http://servidor:{canal.puerto}/execute</code></li>
              <li>Payload: <code>{`{ "trigger": "nombre", "data": {...} }`}</code></li>
              <li>Triggers deben ser únicos por canal</li>
            </ul>
          </div>
        )}
      </div>

      <div className="footer-actions">
        <button className="btn-secondary" onClick={onCancelar}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default AsignarProcesosACanal;
