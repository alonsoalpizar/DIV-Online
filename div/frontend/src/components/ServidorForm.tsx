import { useState, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import { getApiBase } from '../utils/configuracion';
import { extrasPorTipoServidor } from '../hooks/configExtrasPorTipo';
import './ServidorForm.css';

interface Props {
  servidor?: Servidor | null;
  onGuardar: (servidor: Servidor) => void;
  onCancelar: () => void;
}

const tiposAgrupados = {
  'Bases de Datos Relacionales': ['SQLServer', 'Oracle', 'MySQL', 'PostgreSQL'],
  'Bases de Datos NoSQL': ['MongoDB', 'Redis'],
  'Bases de Datos Analíticas': ['Snowflake', 'BigQuery'],
  'APIs y Servicios': ['REST', 'SOAP'],
  'Servicios en Tiempo Real': ['Kafka', 'RabbitMQ'],
  'Servicios Híbridos': ['Firebase', 'Supabase'],
  'Conexiones por Socket': ['SocketTCP'],
};

const ServidorForm: React.FC<Props> = ({ servidor, onGuardar, onCancelar }) => {
  const [id, setId] = useState(servidor?.id || '');
  const [codigo, setCodigo] = useState(servidor?.codigo || '');
  const [nombre, setNombre] = useState(servidor?.nombre || '');
  const [tipo, setTipo] = useState(servidor?.tipo || '');
  const [host, setHost] = useState(servidor?.host || '');
  const [puerto, setPuerto] = useState(servidor?.puerto || '');
  const [usuario, setUsuario] = useState(servidor?.usuario || '');
  const [clave, setClave] = useState(servidor?.clave || '');
  const [extras, setConfig] = useState<{ [key: string]: string }>(servidor?.extras || {});
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  // Función para obtener próximo código automático
  const obtenerProximoCodigo = async () => {
    try {
      setGenerandoCodigo(true);
      const response = await fetch(`${getApiBase()}/consecutivo/servidor`);
      const data = await response.json();
      setCodigo(data.proximoCodigo);
    } catch (error) {
      console.error('Error al obtener próximo código:', error);
      // Fallback: generar código simple
      const timestamp = Date.now().toString().slice(-3);
      setCodigo(`SRV-${timestamp}`);
    } finally {
      setGenerandoCodigo(false);
    }
  };

  useEffect(() => {
    if (servidor) {
      // Editando servidor existente
      setId(servidor.id || '');
      setCodigo(servidor.codigo || '');
      setNombre(servidor.nombre || '');
      setTipo(servidor.tipo || '');
      setHost(servidor.host || '');
      setPuerto(servidor.puerto || '');
      setUsuario(servidor.usuario || '');
      setClave(servidor.clave || '');
      setConfig(servidor.extras || {});
    } else {
      // Nuevo servidor: generar código automático
      obtenerProximoCodigo();
    }
  }, [servidor]);

  const handleGuardar = () => {
    if (!codigo || !nombre || !tipo || !host || !puerto || !usuario || !clave) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    const nuevoServidor: Servidor = {
      id,
      codigo,
      nombre,
      tipo,
      host,
      puerto: Number(puerto),
      usuario,
      clave,
      fechaCreacion: servidor?.fechaCreacion || '',
      extras,
    };

    onGuardar(nuevoServidor);
  };

  const handleTipoChange = (nuevoTipo: string) => {
    setTipo(nuevoTipo);
    const extrasDefault = extrasPorTipoServidor[nuevoTipo];
    if (extrasDefault) {
      const confirmar = confirm("¿Desea reemplazar la configuración actual por la sugerida para este tipo?");
      if (confirmar) {
        setConfig({ ...extrasDefault });
      }
    }
  };

  const handleExtraChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const agregarCampoExtra = () => {
    const clave = prompt('Nombre del campo extra:');
    if (clave && !extras[clave]) {
      setConfig(prev => ({ ...prev, [clave]: '' }));
    }
  };

  const eliminarCampoExtra = (key: string) => {
    const { [key]: _, ...rest } = extras;
    setConfig(rest);
  };

  return (
    <div className="servidor-form">
      <h3>{servidor ? 'Editar Servidor' : 'Nuevo Servidor'}</h3>
      
      <div className="form-group">
        <label>Código:</label>
        <div className="codigo-input-group">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="SRV-001"
            disabled={generandoCodigo}
          />
          {!servidor && (
            <button 
              type="button"
              className="btn-generar-codigo"
              onClick={obtenerProximoCodigo}
              disabled={generandoCodigo}
              title="Generar código automático"
            >
              {generandoCodigo ? '⏳' : '🔄'}
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre descriptivo del servidor"
        />
      </div>

      <div className="form-group">
        <label>Tipo:</label>
        <select value={tipo} onChange={(e) => handleTipoChange(e.target.value)}>
          <option value="">Seleccione un tipo</option>
          {Object.entries(tiposAgrupados).map(([grupo, tipos]) => (
            <optgroup key={grupo} label={grupo}>
              {tipos.map((tipoOpcion) => (
                <option key={tipoOpcion} value={tipoOpcion}>
                  {tipoOpcion}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Host:</label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="Dirección del servidor"
        />
      </div>

      <div className="form-group">
        <label>Puerto:</label>
        <input
          type="number"
          value={puerto}
          onChange={(e) => setPuerto(e.target.value)}
          placeholder="Puerto de conexión"
        />
      </div>

      <div className="form-group">
        <label>Usuario:</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuario de conexión"
        />
      </div>

      <div className="form-group">
        <label>Clave:</label>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Contraseña"
        />
      </div>

      <div className="config-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0 }}>Campos Extras</h4>
          <a 
            href="/docs/campos-servidor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-documentacion"
          >
            📖 Ver Documentación
          </a>
        </div>
        <button onClick={agregarCampoExtra} className="btn-agregar">➕ Agregar Campo</button>
        {Object.entries(extras).map(([key, value]) => (
          <div key={key} className="config-row">
            <label>{key}</label>
            <input
              value={value}
              onChange={e => handleExtraChange(key, e.target.value)}
            />
            <button onClick={() => eliminarCampoExtra(key)}>❌</button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button onClick={handleGuardar} className="btn-guardar">💾 Guardar</button>
        <button onClick={onCancelar} className="btn-cancelar">Cancelar</button>
      </div>
    </div>
  );
};

export default ServidorForm;