import { useState, useEffect } from 'react';
import { Canal } from '../types/canal';
import { extrasPorTipoCanal } from '../hooks/configExtrasPorTipoCanal';
import { getApiBase } from '../utils/configuracion';
import { FaLink, FaGlobe, FaServer, FaFile, FaPlus, FaTimes } from 'react-icons/fa';
import './CanalForm.css';

interface Props {
  canal?: Canal | null;
  onGuardar: (canal: Canal) => void;
  onCancelar: () => void;
}

const tiposAgrupados = {
  'APIs Web': ['REST', 'SOAP'],
  'Comunicación Simple': ['SIMPLE'],
  'Archivos': ['FILE']
};

const CanalForm: React.FC<Props> = ({ canal, onGuardar, onCancelar }) => {
  const [id, setId] = useState(canal?.id || undefined);
  const [codigo, setCodigo] = useState(canal?.codigo || '');
  const [nombre, setNombre] = useState(canal?.nombre || '');
  const [tipoPublicacion, setTipoPublicacion] = useState(canal?.tipoPublicacion || '');
  const [puerto, setPuerto] = useState(canal?.puerto || '');
  const [tipoData, setTipoData] = useState<string>(String(canal?.tipoData || 'JSON'));
  const [extras, setExtras] = useState<Record<string, string>>(canal?.extras || {});
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  // Función para obtener próximo código automático
  const obtenerProximoCodigo = async () => {
    try {
      setGenerandoCodigo(true);
      const response = await fetch(`${getApiBase()}/consecutivo/canal`);
      const data = await response.json();
      setCodigo(data.proximoCodigo);
    } catch (error) {
      console.error('Error al obtener próximo código:', error);
      // Fallback: generar código simple
      const timestamp = Date.now().toString().slice(-3);
      setCodigo(`CNL-${timestamp}`);
    } finally {
      setGenerandoCodigo(false);
    }
  };

  useEffect(() => {
    if (canal) {
      // Editando canal existente
      setId(canal.id || undefined);
      setCodigo(canal.codigo || '');
      setNombre(canal.nombre || '');
      setTipoPublicacion(canal.tipoPublicacion || '');
      setPuerto(canal.puerto || '');
      setTipoData(String(canal.tipoData || 'JSON'));
      setExtras(canal.extras || {});
    } else {
      // Nuevo canal: generar código automático
      obtenerProximoCodigo();
    }
  }, [canal]);

  const handleGuardar = () => {
    // Validación más detallada
    const camposFaltantes = [];
    if (!codigo) camposFaltantes.push('Código');
    if (!nombre) camposFaltantes.push('Nombre');
    if (!tipoPublicacion) camposFaltantes.push('Tipo de Publicación');
    if (!puerto) camposFaltantes.push('Puerto');
    
    if (camposFaltantes.length > 0) {
      alert(`Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`);
      return;
    }

    // Validar que el puerto sea un número válido
    const puertoNumero = Number(puerto);
    if (isNaN(puertoNumero) || puertoNumero <= 0 || puertoNumero > 65535) {
      alert('El puerto debe ser un número válido entre 1 y 65535');
      return;
    }

    const nuevoCanal: any = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      tipoPublicacion,
      puerto,
      tipoData,
      extras: extras || {},
    };

    // Solo agregar id si existe y no es vacío
    if (id) {
      nuevoCanal.id = id;
    }

    // Solo agregar fechaCreacion si ya existe
    if (canal?.fechaCreacion) {
      nuevoCanal.fechaCreacion = canal.fechaCreacion;
    }

    console.log('Enviando canal desde formulario:', nuevoCanal);
    onGuardar(nuevoCanal);
  };

  const handleTipoChange = (nuevoTipo: string) => {
    setTipoPublicacion(nuevoTipo);
    const defaults = extrasPorTipoCanal[nuevoTipo];
    if (defaults) {
      const confirmar = confirm("¿Desea reemplazar la configuración actual por la sugerida para este tipo de canal?");
      if (confirmar) {
        setExtras({ ...defaults });
      }
    }
  };

  const handleExtraChange = (key: string, value: string) => {
    setExtras(prev => ({ ...prev, [key]: value }));
  };

  const agregarCampoExtra = () => {
    const clave = prompt('Nombre del campo extra:');
    if (clave && !extras[clave]) {
      setExtras(prev => ({ ...prev, [clave]: '' }));
    }
  };

  const eliminarCampoExtra = (key: string) => {
    const { [key]: _, ...rest } = extras;
    setExtras(rest);
  };

  const getChannelIcon = () => {
    switch (tipoPublicacion) {
      case 'REST': return <FaGlobe className="channel-icon rest" />;
      case 'SOAP': return <FaServer className="channel-icon soap" />;
      case 'FILE': return <FaFile className="channel-icon file" />;
      default: return <FaLink className="channel-icon default" />;
    }
  };

  return (
    <div className="canal-form">
      {/* Header */}
      <div className="canal-form-header">
        <div className="form-title-section">
          {getChannelIcon()}
          <div>
            <h2>{canal ? 'Editar Canal' : 'Nuevo Canal'}</h2>
            <p>Configure un canal para exponer procesos como servicios</p>
          </div>
        </div>
        <button className="btn-close" onClick={onCancelar}>
          <FaTimes />
        </button>
      </div>

      {/* Form Body */}
      <div className="canal-form-body">
        {/* Información Básica */}
        <div className="form-section">
          <h3>Información Básica</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Código:</label>
              <div className="input-group">
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="CNL-001"
                  disabled={generandoCodigo}
                />
                {!canal && (
                  <button 
                    type="button"
                    className="btn-generate"
                    onClick={obtenerProximoCodigo}
                    disabled={generandoCodigo}
                    title="Generar código automático"
                  >
                    {generandoCodigo ? '⏳' : '🔄'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre Canal"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Publicación:</label>
              <select value={tipoPublicacion} onChange={e => handleTipoChange(e.target.value)}>
                <option value="">Seleccione un tipo</option>
                {Object.entries(tiposAgrupados).map(([grupo, tipos]) => (
                  <optgroup key={grupo} label={grupo}>
                    {tipos.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Puerto:</label>
              <input
                type="number"
                value={puerto}
                onChange={(e) => setPuerto(e.target.value)}
                placeholder="8080"
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Datos:</label>
              <select value={tipoData} onChange={e => setTipoData(e.target.value)}>
                <option value="JSON">JSON</option>
                <option value="XML">XML</option>
                <option value="STRING">STRING</option>
              </select>
            </div>
          </div>
        </div>

        {/* Configuración Adicional */}
        <div className="form-section">
          <div className="section-header">
            <h3>Configuración Adicional</h3>
            <a 
              href="/docs/canales" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-docs"
            >
              📖 Ver Documentación
            </a>
          </div>
          
          <button onClick={agregarCampoExtra} className="btn-add-field">
            <FaPlus /> Agregar Campo Extra
          </button>
          
          {Object.keys(extras).length === 0 ? (
            <div className="empty-extras">
              <p>No hay campos extras configurados</p>
            </div>
          ) : (
            <div className="extras-grid">
              {Object.entries(extras).map(([key, value]) => (
                <div key={key} className="extra-field">
                  <div className="extra-field-header">
                    <label>{key}</label>
                    <button 
                      onClick={() => eliminarCampoExtra(key)}
                      className="btn-remove-field"
                      title="Eliminar campo"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <input
                    value={value}
                    onChange={e => handleExtraChange(key, e.target.value)}
                    placeholder={`Valor para ${key}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview del Canal */}
        {tipoPublicacion && puerto && (
          <div className="form-section">
            <h3>Vista Previa</h3>
            <div className="channel-preview">
              <div className="preview-info">
                <div className="preview-item">
                  <strong>Tipo:</strong> {tipoPublicacion}
                </div>
                <div className="preview-item">
                  <strong>Puerto:</strong> {puerto}
                </div>
                <div className="preview-item">
                  <strong>URL Base:</strong> 
                  <code>
                    http://servidor:{puerto}
                    {tipoPublicacion === 'SOAP' ? '/soap' : ''}
                    {tipoPublicacion === 'SIMPLE' ? '/execute' : ''}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="canal-form-footer">
        <button onClick={onCancelar} className="btn btn-secondary">
          Cancelar
        </button>
        <button onClick={handleGuardar} className="btn btn-primary">
          💾 Guardar Canal
        </button>
      </div>
    </div>
  );
};

export default CanalForm;