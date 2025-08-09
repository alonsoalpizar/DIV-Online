import { useState, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import { getApiBase } from '../utils/configuracion';
import { extrasPorTipoServidor } from '../hooks/configExtrasPorTipo';
import { FaServer, FaTimes, FaPlus } from 'react-icons/fa';
import './ServidorFormEnhanced.css';

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
  'Servicios de Comunicación': ['WhatsApp', 'SMS', 'Email', 'Telegram', 'Discord', 'Slack'],
  'Autenticación Externa': ['Google-OAuth', 'Facebook-OAuth', 'Microsoft-OAuth', 'GitHub-OAuth', 'Auth0', 'Okta'],
};

const ServidorForm: React.FC<Props> = ({ servidor, onGuardar, onCancelar }) => {
  const [id, setId] = useState(servidor?.id || undefined);
  const [codigo, setCodigo] = useState(servidor?.codigo || '');
  const [nombre, setNombre] = useState(servidor?.nombre || '');
  const [tipo, setTipo] = useState(servidor?.tipo || '');
  const [host, setHost] = useState(servidor?.host || '');
  const [puerto, setPuerto] = useState(servidor?.puerto || '');
  const [usuario, setUsuario] = useState(servidor?.usuario || '');
  const [clave, setClave] = useState(servidor?.clave || '');
  const [extras, setConfig] = useState<{ [key: string]: string }>(servidor?.extras || {});
  const [categoriaId, setCategoriaId] = useState((servidor as any)?.categoria_id || '');
  const [categorias, setCategorias] = useState<any[]>([]);
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

  // Cargar categorías de servidores
  const cargarCategorias = async () => {
    try {
      const response = await fetch(`${getApiBase()}/categorias?ambito=servidor`);
      const data = await response.json();
      setCategorias(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
    }
  };

  useEffect(() => {
    // Cargar categorías al inicio
    cargarCategorias();
    
    if (servidor) {
      // Editando servidor existente
      setId(servidor.id || undefined);
      setCodigo(servidor.codigo || '');
      setNombre(servidor.nombre || '');
      setTipo(servidor.tipo || '');
      setHost(servidor.host || '');
      setPuerto(servidor.puerto || '');
      setUsuario(servidor.usuario || '');
      setClave(servidor.clave || '');
      setConfig(servidor.extras || {});
      setCategoriaId((servidor as any)?.categoria_id || '');
    } else {
      // Nuevo servidor: limpiar el id y generar código automático
      setId(undefined);
      obtenerProximoCodigo();
    }
  }, [servidor]);

  const handleGuardar = () => {
    // Validación más detallada
    const camposFaltantes = [];
    if (!codigo) camposFaltantes.push('Código');
    if (!nombre) camposFaltantes.push('Nombre');
    if (!tipo) camposFaltantes.push('Tipo');
    if (!host) camposFaltantes.push('Host');
    if (!puerto) camposFaltantes.push('Puerto');
    if (!usuario) camposFaltantes.push('Usuario');
    if (!clave) camposFaltantes.push('Clave');
    
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

    const nuevoServidor: any = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      tipo,
      host: host.trim(),
      puerto: puertoNumero,
      usuario: usuario.trim(),
      clave,
      extras: extras || {},
      categoria_id: categoriaId || null,
    };

    // Solo agregar id si existe y no es vacío
    if (id) {
      nuevoServidor.id = id;
      // Solo agregar fechaCreacion si ya existe y es válida
      if (servidor?.fechaCreacion && servidor.fechaCreacion !== '') {
        nuevoServidor.fechaCreacion = servidor.fechaCreacion;
      }
    }
    // Para nuevos servidores, NO enviar fechaCreacion en absoluto
    // El backend la generará automáticamente

    console.log('Enviando servidor desde formulario:', nuevoServidor);
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
    <div className="servidor-form servidor-form-enhanced">
      {/* Header */}
      <div className="servidor-form-header">
        <div className="form-title-section">
          <FaServer className="servidor-icon" />
          <div>
            <h2>{servidor ? 'Editar Servidor' : 'Nuevo Servidor'}</h2>
            <p>Configure un servidor para conexiones externas</p>
          </div>
        </div>
        <button className="btn-close" onClick={onCancelar}>
          <FaTimes />
        </button>
      </div>

      {/* Form Body */}
      <div className="servidor-form-body">
        {/* Información Básica */}
        <div className="form-section">
          <h3>Información Básica</h3>
          
          <div className="form-row-2col">
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
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label>Tipo de Servidor:</label>
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
              <label>Categoría:</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Configuración de Conexión */}
        <div className="form-section">
          <h3>Configuración de Conexión</h3>
          
          <div className="form-row-3-1">
            <div className="form-group">
              <label>Host / Dirección:</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost, 192.168.1.100, servidor.empresa.com"
              />
            </div>
            <div className="form-group">
              <label>Puerto:</label>
              <input
                type="number"
                value={puerto}
                onChange={(e) => setPuerto(e.target.value)}
                placeholder="1433, 3306, 5432..."
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div className="form-row-equal">
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
              <label>Contraseña:</label>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Contraseña segura"
              />
            </div>
          </div>
        </div>

        {/* Configuración Adicional */}
        <div className="form-section">
          <h3>Configuración Adicional</h3>
          
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
      </div>

      {/* Footer Actions */}
      <div className="servidor-form-footer">
        <div className="servidor-form-footer-info">
          {servidor ? 'Editando servidor existente' : 'Creando nuevo servidor'}
        </div>
        <div className="servidor-form-footer-actions">
          <button onClick={onCancelar} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={generandoCodigo} className="btn btn-primary">
            {generandoCodigo ? '⏳ Generando...' : '💾 Guardar Servidor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServidorForm;