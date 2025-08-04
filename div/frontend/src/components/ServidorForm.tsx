/* import { useState, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import './ServidorForm.css';

interface Props {
  servidor?: Servidor | null;
  onGuardar: (servidor: Servidor) => void;
  onCancelar: () => void;
}

const tiposAgrupados = {
  'Bases de Datos Relacionales': ['SQL Server', 'Oracle', 'MySQL', 'PostgreSQL'],
  'Bases de Datos NoSQL': ['MongoDB', 'Redis'],
  'Bases de Datos Analíticas': ['Snowflake', 'BigQuery'],
  'APIs y Servicios': ['REST', 'SOAP'],
  'Servicios en Tiempo Real': ['Kafka', 'RabbitMQ'],
  'Servicios Híbridos': ['Firebase', 'Supabase'],
  'Conexiones por Socket': ['Socket TCP'],
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

  useEffect(() => {
    if (servidor) {
      setId(servidor.id || '');
      setCodigo(servidor.codigo || '');
      setNombre(servidor.nombre || '');
      setTipo(servidor.tipo || '');
      setHost(servidor.host || '');
      setPuerto(servidor.puerto || '');
      setUsuario(servidor.usuario || '');
      setClave(servidor.clave || '');
      setConfig(servidor.extras || {});
    }
  }, [servidor]);

  const handleGuardar = () => {
  if (!codigo || !nombre || !tipo || !host || !puerto || !usuario || !clave) {
    alert('Todos los campos son obligatorios.');
    return;
  }

  const nuevoServidor = {
  ...(id && { id }), // este es el truco que asegura que PUT se use en lugar de POST
  codigo,
  nombre,
  tipo,
  host,
  puerto: parseInt(puerto, 10),
  usuario,
  clave,
  fechaCreacion: servidor?.fechaCreacion || new Date().toISOString(),
  extras: extras,
};
  onGuardar(nuevoServidor);
};


  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const agregarCampo = () => {
    const nuevoKey = prompt('Nombre del nuevo campo:');
    if (nuevoKey && !extras[nuevoKey]) {
      setConfig(prev => ({ ...prev, [nuevoKey]: '' }));
    }
  };

  const eliminarCampo = (key: string) => {
    const { [key]: _, ...rest } = extras;
    setConfig(rest);
  };

  return (
    <div className="form-container">
      <h2>{servidor ? 'Editar Servidor' : 'Nuevo Servidor'}</h2>
      <div className="form-grid">
        <label>Código:</label>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} />

        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />

        <label>Tipo:</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Seleccione un tipo</option>
          {Object.entries(tiposAgrupados).map(([grupo, tipos]) => (
            <optgroup key={grupo} label={grupo}>
              {tipos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <label>Host:</label>
        <input value={host} onChange={e => setHost(e.target.value)} />

        <label>Puerto:</label>
        <input value={puerto} onChange={e => setPuerto(e.target.value)} />

        <label>Usuario:</label>
        <input value={usuario} onChange={e => setUsuario(e.target.value)} />

        <label>Clave:</label>
        <input type="password" value={clave} onChange={e => setClave(e.target.value)} />
      </div>

      <div className="config-section">
        <h4>Configuración Adicional</h4>
        <button onClick={agregarCampo} className="btn-agregar">➕ Agregar Campo</button>
        {Object.entries(extras).map(([key, value]) => (
          <div key={key} className="config-row">
            <label>{key}</label>
            <input
              value={value}
              onChange={e => handleConfigChange(key, e.target.value)}
            />
            <button onClick={() => eliminarCampo(key)}>❌</button>
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
 */
import { useState, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import './ServidorForm.css';
import { extrasPorTipoServidor } from '../hooks/configExtrasPorTipo';

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
  const [extras, setExtras] = useState<{ [key: string]: string }>(servidor?.extras || {});

  useEffect(() => {
    if (servidor) {
      setId(servidor.id || '');
      setCodigo(servidor.codigo || '');
      setNombre(servidor.nombre || '');
      setTipo(servidor.tipo || '');
      setHost(servidor.host || '');
      setPuerto(servidor.puerto || '');
      setUsuario(servidor.usuario || '');
      setClave(servidor.clave || '');
      setExtras(servidor.extras || {});
    }
  }, [servidor]);

  const handleGuardar = () => {
    if (!codigo || !nombre || !tipo || !host || !puerto || !usuario || !clave) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    const nuevoServidor: Servidor = {
      ...(id && { id }),
      codigo,
      nombre,
      tipo,
      host,
      puerto: parseInt(String(puerto), 10),
      usuario,
      clave,
      fechaCreacion: servidor?.fechaCreacion || new Date().toISOString(),
      extras
    };
    onGuardar(nuevoServidor);
  };

  const handleTipoChange = (nuevoTipo: string) => {
    setTipo(nuevoTipo);
    const extrasDefault = extrasPorTipoServidor[nuevoTipo];
    if (extrasDefault) {
      const confirmar = confirm("¿Desea reemplazar la configuración actual por la sugerida para este tipo?");
      if (confirmar) {
        setExtras({ ...extrasDefault });
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

  return (
    <div className="form-container">
      <h2>{servidor ? 'Editar Servidor' : 'Nuevo Servidor'}</h2>
      <div className="form-grid">
        <label>Código:</label>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} />

        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />

        <label>Tipo:</label>
        <select value={tipo} onChange={e => handleTipoChange(e.target.value)}>
          <option value="">Seleccione un tipo</option>
          {Object.entries(tiposAgrupados).map(([grupo, tipos]) => (
            <optgroup key={grupo} label={grupo}>
              {tipos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <label>Host:</label>
        <input value={host} onChange={e => setHost(e.target.value)} />

        <label>Puerto:</label>
        <input value={puerto} onChange={e => setPuerto(e.target.value)} />

        <label>Usuario:</label>
        <input value={usuario} onChange={e => setUsuario(e.target.value)} />

        <label>Clave:</label>
        <input type="password" value={clave} onChange={e => setClave(e.target.value)} />
      </div>

      <div className="config-section">
        <h4>Campos Extras</h4>
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

