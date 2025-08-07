// Editor de Nodo Proceso con soporte para subcampos anidados y parseo automático de outputs

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '../utils/configuracion';
import { Servidor } from '../types/servidor';
import SortableParametrosList from '../components/SortableParametrosList';
import { Parametro } from '../components/SortableParametroItem';



import React, { JSX } from 'react';

// --- Tipos e interfaces ---
interface Campo {
  nombre: string;
  tipo: string;
  subcampos?: Campo[];
  enviarAServidor?: boolean;
  orden?: number;
}

interface Props {
  label: string;
  servidorId: string;
  tipoObjeto: string;
  objeto: string;
  nodoId: string;
  edges: any[]; // Edge[] si lo necesitas tipar mejor
  parametrosEntrada: Parametro[];
  parametrosSalida: Parametro[];
  parametrosError: Campo[];
  tagPadre?: string;
  fullOutput?: string;
  tipoRespuesta?: string;
  parsearFullOutput?: boolean;
onGuardar: (
  label: string,
  servidorId: string,
  tipoObjeto: string,
  objeto: string,
  parametrosEntrada: Parametro[],
  parametrosSalida: Parametro[],
  parametrosError: Parametro[],
  metodoHttp: string,
  tagPadre: string,
  parsearFullOutput: boolean,
  tipoRespuesta: string,
  fullOutput: string
) => void;

  onCancelar: () => void;
}

// --- Componente principal ---
const EditorProceso: React.FC<Props> = ({
  label,
  servidorId,
  tipoObjeto,
  objeto,
  edges,
  nodoId,
  parametrosEntrada,
  parametrosSalida,
  parametrosError,
  tagPadre,
  parsearFullOutput,
  tipoRespuesta,
  fullOutput,
  onGuardar,
  onCancelar
}) => {
  // --- Estados principales ---
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [nuevoServidor, setNuevoServidor] = useState(servidorId);
  const [nuevoTipoObjeto, setNuevoTipoObjeto] = useState(tipoObjeto);
  const [nuevoObjeto, setNuevoObjeto] = useState(objeto);
  const [entrada, setEntrada] = useState<Parametro[]>(
    parametrosEntrada?.map(param => ({
      ...param,
      enviarAServidor: param.enviarAServidor ?? true,
      orden: param.orden ?? (parametrosEntrada.indexOf(param) + 1)
    })) || []
  );
  const [salida, setSalida] = useState<Parametro[]>([]);
  const [servidores, setServidores] = useState<any[]>([]);
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);
  const [metodoHttp, setMetodoHttp] = useState('GET');
  const [bufferStack, setBufferStack] = useState<Parametro[][]>([]);
  const [contextStack, setContextStack] = useState<{ lista: Parametro[]; index: number; nivel: number }[]>([]);
  const [nivelesConfirmados, setNivelesConfirmados] = useState<number[]>([0]);
  const [modoLectura, setModoLectura] = useState(false);
  const [campoJerarquia, setCampoJerarquia] = useState<string | null>(null);
  const [jerarquiaVisible, setJerarquiaVisible] = useState<Parametro[] | null>(null);
  const [errores, setErrores] = useState<Parametro[]>([]);
  const [nuevoTagPadre, setNuevoTagPadre] = useState(tagPadre || '');
  const [usarFullOutput, setUsarFullOutput] = useState(parsearFullOutput || false);
  const [nuevotipoRespuesta, setTipoRespuesta] = useState<string>(tipoRespuesta || 'json');
  const [nuevofullOutput, setFullOutput] = useState<string>(fullOutput || '');
  const [mostrarPreviewFullOutput, setMostrarPreviewFullOutput] = useState(false);

  // --- Diccionarios de ayuda y tipos por servidor ---
  const tiposPorServidor: { [key: string]: string[] } = {
    sqlserver: ['sp', 'funcion', 'vista', 'query', 'trigger'],
    oracle: ['plsql_procedure', 'package', 'funcion', 'vista', 'cursor_ref'],
    mysql: ['stored_procedure', 'query', 'funcion', 'view'],
    postgresql: [ 'plpgsql_procedure','plpgsql_function', 'query', 'view'],
    mongodb: ['operacion', 'aggregation', 'comando', 'transaccion', 'bulk_write'],
    redis: ['comando', 'lua_script', 'pubsub', 'pipeline', 'transaction'],
    snowflake: ['stored_procedure', 'query', 'udf', 'udtf', 'task', 'stream'],
    bigquery: ['query', 'stored_procedure', 'udf', 'script', 'scheduled_query'],
    rest: ['endpoint', 'webhook', 'graphql_query', 'graphql_mutation'],
    soap: ['metodo_ws', 'rpc_call'],
    graphql: ['query', 'mutation', 'subscription'],
    kafka: ['topic', 'stream', 'table', 'connector'],
    rabbitmq: ['queue', 'exchange', 'binding', 'rpc'],
    firebase: ['document', 'collection', 'cloud_function', 'realtime_db_path'],
    supabase: ['rpc', 'table', 'storage_bucket', 'auth_hook'],
    sockettcp: ['mensaje', 'binary_stream', 'custom_protocol'],
    websocket: ['mensaje', 'evento', 'binary_frame']
  };

  const ayudaPorTipoServidor: { [key: string]: string } = {
    sqlserver: 'Usa el nombre del procedimiento almacenado (ej: "sp_clientes_crear") o función. Los parámetros deben coincidir con los definidos en SQL Server.',
    oracle: 'Nombre del procedimiento/función PL/SQL (ej: "pkg_clientes.crear_cliente"). Usa la notación "paquete.procedimiento" cuando aplique.',
    mysql: 'Nombre del stored procedure (ej: "crear_cliente") o consulta SQL directa. Para consultas, usa el formato "SELECT * FROM tabla WHERE id = ?".',
    postgresql: 'Nombre de la función PL/pgSQL (ej: "crear_cliente") o consulta SQL. Usa $1, $2 para parámetros en funciones.',
    mongodb: 'Operación a realizar (ej: "find", "insertOne"). Los parámetros deben ser documentos JSON válidos (ej: { "nombre": "valor" }).',
    redis: 'Comando Redis (ej: "HGETALL usuarios:1") o nombre del script Lua almacenado (ej: "EVAL sha1_script").',
    snowflake: 'Procedimiento almacenado (ej: "call sp_procesar_datos()") o consulta SQL.',
    bigquery: 'Consulta SQL estándar o nombre de procedimiento almacenado (ej: "proyecto.dataset.sp_procesar").',
    rest: 'Endpoint (ej: "/api/clientes"). Especifica método HTTP (GET/POST/etc)',
    soap: 'Nombre exacto del método SOAP (ej: "CreateCustomer") como aparece en el WSDL. Los parámetros deben coincidir con el XSD.',
    graphql: 'Nombre de la mutación/query (ej: "createClient") o query directa. Los parámetros son variables GraphQL.',
    kafka: 'Nombre del topic (ej: "pedidos-nuevos") y mensaje en formato JSON. Opcionalmente especifica key y partition.',
    rabbitmq: 'Nombre del exchange/queue (ej: "pedidos") y mensaje en formato JSON. Especifica routing_key si aplica.',
    sockettcp: 'Mensaje base (ej: "TramaXML o string"). Binario si es necesario.',
    websocket: 'Mensaje en formato JSON o texto plano (ej: {"tipo":"chat","mensaje":"hola"}). Evento opcional para suscripción.',
    firebase: 'Ruta de documento/colección (ej: "usuarios/123") o nombre de función Cloud (ej: "onUserCreated").',
    supabase: 'Nombre de función PostgreSQL RPC (ej: "crear_usuario") o tabla para operaciones CRUD (ej: "clientes").',
  };



   useEffect(() => {
  if (tipoObjeto) {
    setNuevoTipoObjeto(tipoObjeto);
  }
}, [tipoObjeto]);
  


  // --- Efectos para cargar datos y sincronizar props ---
  useEffect(() => {
    axios.get(`${getApiBase()}/servidores`).then(res => {
      setServidores(res.data.map((s: Servidor) => ({ ...s, tipo: s.tipo.replace(/\s+/g, '').toLowerCase() })));

    });
  }, []);

  useEffect(() => {
    if (nodoId && parametrosError && parametrosError.length > 0) {
      // Convertir campos de error al nuevo formato
      const erroresConvertidos: Parametro[] = parametrosError.map(campo => ({
        ...campo,
        enviarAServidor: false,
        orden: 0
      }));
      setErrores(erroresConvertidos);
    }
  }, [nodoId, parametrosError]);

  useEffect(() => {
  const servidor = servidores.find(s => s.id === nuevoServidor);
  const tipos = servidor ? tiposPorServidor[servidor.tipo] || ['PROCESO'] : ['PROCESO'];
  setTiposDisponibles(tipos);

  // Solo asignar el tipo si no se ha definido aún
  if (!nuevoTipoObjeto && tipos.length > 0) {
    setNuevoTipoObjeto(tipos[0]);
  }
}, [nuevoServidor, servidores]);



  useEffect(() => {
    const salidaConvertida: Parametro[] = parametrosSalida?.map(param => ({
      ...param,
      enviarAServidor: param.enviarAServidor ?? false, // Los de salida por defecto no se envían
      orden: param.orden ?? 0
    })) || [];
    setSalida(salidaConvertida);
  }, [parametrosSalida]);

  useEffect(() => {
    setUsarFullOutput(parsearFullOutput || false);
  }, [parsearFullOutput]);

  useEffect(() => {
    setTipoRespuesta(tipoRespuesta || 'json');
  }, [tipoRespuesta]);

  useEffect(() => {
    setFullOutput(fullOutput || '');
  }, [fullOutput]);

  

  // --- Funciones auxiliares ---
  const agregarCampo = (lista: Parametro[], setLista: (l: Parametro[]) => void, nivel = 0) => {
    const nombres = lista.map(c => c.nombre.trim());
    if (nombres.includes('')) return alert('Complete todos los nombres antes de agregar uno nuevo.');
    const nuevoParametro: Parametro = {
      nombre: '',
      tipo: 'string',
      enviarAServidor: true,
      orden: lista.filter(p => p.enviarAServidor ?? true).length + 1
    };
    setLista([...lista, nuevoParametro]);
  };

  // Renderiza campos y subcampos recursivamente
  const renderCampos = (campos: Parametro[], setCampos: (v: Parametro[]) => void, nivel: number): JSX.Element[] => {
    return campos.map((campo, i) => {
      const tipoSimple = ["string", "int", "bool", "date", "float", "json"];
      const puedeAgregarSubnivel = nivelesConfirmados.includes(nivel);
      const mostrarTipo = puedeAgregarSubnivel || campo.subcampos;
      const esCampoDeError = ['codigoError', 'mensajeError', 'detalleError'].includes(campo.nombre);

      return (
        <div key={i} style={{ marginLeft: nivel * 20, marginBottom: 5, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            value={campo.nombre}
            onChange={e => {
              const copia = [...campos];
              copia[i].nombre = e.target.value;
              setCampos(copia);
            }}
            disabled={esCampoDeError}
            readOnly={esCampoDeError}
          />
          <select
            value={campo.tipo}
            onChange={e => {
              const copia = [...campos];
              copia[i].tipo = e.target.value;
              setCampos(copia);
            }}
            disabled={esCampoDeError}
          >
            {tipoSimple.map(t => <option key={t} value={t}>{t}</option>)}
            {mostrarTipo && (
              <>
                <option value="object">object</option>
                <option value="array">array</option>
              </>
            )}
          </select>
          {puedeAgregarSubnivel && (campo.tipo === 'object' || campo.tipo === 'array') && (
            <button
              title={`Nivel ${nivel}`}
              style={{
                backgroundColor:
                  nivel === 0 ? '#1565c0' :
                  nivel === 1 ? '#6a1b9a' :
                  nivel === 2 ? '#c62828' :
                  nivel === 3 ? '#ef6c00' :
                  '#572fb4ff',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setBufferStack([campo.subcampos || [], ...bufferStack]);
                setContextStack([{ lista: campos, index: i, nivel }, ...contextStack]);
                setModoLectura(true);
              }}
            >
              Ir a Subcampos {`Nivel ${nivel + 1}`}
            </button>
          )}
          {(campo.tipo === 'array' || campo.tipo === 'object') && campo.subcampos && (
            <button
              title="Ver jerarquía"
              onClick={() => {
                setJerarquiaVisible([campo]);
                setCampoJerarquia(campo.nombre);
              }}
            >🔍</button>
          )}
          {!esCampoDeError && (
            <button
              title="Eliminar campo"
              onClick={() => {
                const nueva = [...campos];
                nueva.splice(i, 1);
                setCampos(nueva);
              }}
            >❌</button>
          )}
        </div>
      );
    });
  };

  // Confirma la edición de subcampos y vuelve al nivel anterior
  const confirmarSubnivel = () => {
    if (contextStack.length === 0) return;
    const [actual, ...restoContexto] = contextStack;
    const [buffer, ...restoBuffer] = bufferStack;
    actual.lista[actual.index].subcampos = buffer;
    setContextStack(restoContexto);
    setBufferStack(restoBuffer);
    setEntrada([...entrada]);
    setNivelesConfirmados([...nivelesConfirmados, actual.nivel + 1]);
    setModoLectura(false);
  };

  // Renderiza la jerarquía de campos recursivamente
  const renderJerarquia = (campos: Parametro[], nivel = 0): JSX.Element[] => {
    return campos.map((campo, i) => (
      <div key={i} style={{ marginLeft: nivel * 20 }}>
        └─ {campo.nombre} ({campo.tipo})
        {campo.enviarAServidor && <span style={{ color: '#28a745', fontSize: '12px' }}> ✓ Servidor</span>}
        {campo.subcampos && renderJerarquia(campo.subcampos, nivel + 1)}
      </div>
    ));
  };

  // --- Render principal ---
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
    >
      <div
        style={{
          background: 'white', padding: '20px', borderRadius: '8px',
          minWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)', display: 'flex', gap: '20px'
        }}
      >
        {/* Panel principal izquierdo */}
        <div style={{ flex: 2 }}>
          <h3>⚙️ Editar Nodo de Proceso</h3>
          <label>Label:</label>
          <input value={nuevoLabel} onChange={e => setNuevoLabel(e.target.value)} />

          <label>Servidor:</label>
          <select value={nuevoServidor} onChange={e => setNuevoServidor(e.target.value)}>
            <option value="">-- Seleccione --</option>
            {servidores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>

          <label>Tipo de Objeto:</label>
          <select value={nuevoTipoObjeto} onChange={e => setNuevoTipoObjeto(e.target.value)}>
            {tiposDisponibles.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
          </select>

          <label>Nombre del Objeto:</label>
          <input value={nuevoObjeto} onChange={e => setNuevoObjeto(e.target.value)} />

          {/* Método HTTP solo para REST */}
          {servidores.find(s => s.id === nuevoServidor)?.tipo === 'rest' && (
            <>
              <label>Método HTTP:</label>
              <select value={metodoHttp} onChange={e => setMetodoHttp(e.target.value)}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </>
          )}

          <label>Tag Padre (opcional):</label>
          <input
            value={nuevoTagPadre}
            onChange={e => setNuevoTagPadre(e.target.value)}
            placeholder="Ej: respuesta"
          />

          {/* Ayuda contextual */}
          {servidores.find(s => s.id === nuevoServidor)?.tipo && (
            <div style={{
              backgroundColor: '#f0f4f8', border: '1px solid #ccc', padding: '10px',
              borderRadius: '5px', marginTop: '10px', fontSize: '0.9em', color: '#333'
            }}>
              <strong>Ayuda:</strong> {ayudaPorTipoServidor[servidores.find(s => s.id === nuevoServidor)?.tipo]}
            </div>
          )}

          {/* Parámetros de Entrada */}
          <h4>🧩 Parámetros de Entrada</h4>
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={() => agregarCampo(entrada, setEntrada, 0)}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              ➕ Agregar Parámetro
            </button>
          </div>
          <SortableParametrosList 
            parametros={entrada}
            setParametros={setEntrada}
            onEditarSubcampos={(index) => {
              const campo = entrada[index];
              setBufferStack([campo.subcampos || [], ...bufferStack]);
              setContextStack([{ lista: entrada, index, nivel: 0 }, ...contextStack]);
              setModoLectura(true);
            }}
            onVerJerarquia={(index) => {
              const campo = entrada[index];
              setJerarquiaVisible([campo]);
              setCampoJerarquia(campo.nombre);
            }}
            mostrarCheckbox={true}
          />



          {/* Tratamiento de FullOutput */}
          <h4>📦 Tratamiento de FullOutput</h4>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={usarFullOutput}
                onChange={(e) => setUsarFullOutput(e.target.checked)}
              />
              {' '}Parsear FullOutput automáticamente
            </label>
          </div>
          {usarFullOutput && (
            <>
              <label>Tipo de Respuesta:</label>
              <select
                value={nuevotipoRespuesta}
                onChange={(e) => setTipoRespuesta(e.target.value)}
              >
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="string">String</option>
                <option value="plano">Plano</option>
              </select>
              <br />
              <label>Contenido FullOutput: </label>
              <button
                type="button"
                onClick={() => setMostrarPreviewFullOutput(true)}
              >
                🔍 Ver contenido
              </button>
            </>
          )}

          {/* Parámetros de Salida */}
          <h4>📤 Parámetros de Salida</h4>
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={() => agregarCampo(salida, setSalida, 0)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              ➕ Agregar Parámetro
            </button>
          </div>
          <SortableParametrosList 
            parametros={salida}
            setParametros={setSalida}
            onEditarSubcampos={(index) => {
              const campo = salida[index];
              setBufferStack([campo.subcampos || [], ...bufferStack]);
              setContextStack([{ lista: salida, index, nivel: 0 }, ...contextStack]);
              setModoLectura(true);
            }}
            onVerJerarquia={(index) => {
              const campo = salida[index];
              setJerarquiaVisible([campo]);
              setCampoJerarquia(campo.nombre);
            }}
            mostrarCheckbox={false}
          />


          {/* Parámetros de Error */}
          <h4>❗ Parámetros de Error</h4>
          <div style={{ opacity: 0.8 }}>
            {errores.map((campo, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                <input value={campo.nombre} disabled readOnly />
                <select value={campo.tipo} disabled>
                  <option value={campo.tipo}>{campo.tipo}</option>
                </select>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
  <button
    onClick={() => {
      // --- Validación de campos vacíos en entrada y salida (incluye subcampos) ---
      const tieneVacios = (lista: Parametro[]): boolean =>
        lista.some(
          c =>
            !c.nombre ||
            c.nombre.trim() === '' ||
            (c.subcampos && tieneVacios(c.subcampos))
        );

      // --- Validación de duplicados a nivel raíz ---
      const tieneDuplicadosNivel1 = (lista: Parametro[]): boolean => {
        const nombres = lista.map(c => c.nombre.trim());
        return nombres.some((n, i) => n && nombres.indexOf(n) !== i);
      };

      if (tieneVacios(entrada)) {
        alert('Hay campos vacíos en los parámetros de entrada.');
        return;
      }
      if (tieneVacios(salida)) {
        alert('Hay campos vacíos en los parámetros de salida.');
        return;
      }
      if (tieneDuplicadosNivel1(entrada)) {
        alert('No puede haber campos duplicados en los parámetros de entrada (nivel raíz).');
        return;
      }
      if (tieneDuplicadosNivel1(salida)) {
        alert('No puede haber campos duplicados en los parámetros de salida (nivel raíz).');
        return;
      }
      onGuardar(
  nuevoLabel,
  nuevoServidor,
  nuevoTipoObjeto,
  nuevoObjeto,
  entrada,
  salida,
  errores,
  metodoHttp,         // ❗antes decía '' incorrectamente
  nuevoTagPadre,
  usarFullOutput,
  nuevotipoRespuesta,
  nuevofullOutput      // ❗usar el estado que se actualiza
);

    }}
  >💾 Guardar</button>
  <button onClick={onCancelar}>Cancelar</button>
</div>
        </div>

        {/* Panel derecho: edición de subcampos */}
        {(bufferStack.length > 0 && contextStack.length > 0) && (
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
            <h5>Subcampos - Nivel {contextStack[0]?.nivel + 1}</h5>
            {renderCampos(bufferStack[0], campos => {
              const nuevaPila = [...bufferStack];
              nuevaPila[0] = campos;
              setBufferStack(nuevaPila);
            }, contextStack[0]?.nivel + 1)}
            <button onClick={() => agregarCampo(bufferStack[0], campos => {
              const nuevaPila = [...bufferStack];
              nuevaPila[0] = campos;
              setBufferStack(nuevaPila);
            }, contextStack[0]?.nivel + 1)}>➕ Crear Subcampo en este nivel</button>
            <button onClick={confirmarSubnivel}>
              ⬅️ Volver (Refrescar Nivel {contextStack[0]?.nivel + 1})
            </button>
            <button
              style={{
                backgroundColor: '#757575', color: '#fff', border: 'none',
                padding: '4px 8px', borderRadius: '4px', marginTop: '10px', cursor: 'pointer'
              }}
              onClick={() => {
                setBufferStack([]);
                setContextStack([]);
                setModoLectura(false);
              }}
            >
              ❌ Cancelar Subcampos
            </button>
          </div>
        )}

        {/* Panel de jerarquía de campos */}
        {jerarquiaVisible && (
          <div style={{
            position: 'absolute', top: 50, right: 20, background: '#f9f9f9',
            border: '1px solid #ccc', borderRadius: '8px', padding: '10px',
            maxHeight: '80vh', overflowY: 'auto', zIndex: 1100
          }}>
            <h5>Jerarquía de "{campoJerarquia}"</h5>
            {renderJerarquia(jerarquiaVisible)}
            <button onClick={() => setJerarquiaVisible(null)} style={{ marginTop: '10px' }}>⬅️ Cerrar</button>
          </div>
        )}

        {/* Modal para editar y parsear FullOutput */}
        {mostrarPreviewFullOutput && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{
              backgroundColor: 'white', padding: '20px', borderRadius: '8px',
              maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)', position: 'relative'
            }}>
              <h3>🔍 Editor de contenido FullOutput</h3>
              <textarea
                value={nuevofullOutput}
                onChange={(e) => setFullOutput(e.target.value)}
                style={{
                  width: '100%', minHeight: '300px', fontFamily: 'monospace',
                  fontSize: '0.85em', padding: '10px', border: '1px solid #ddd',
                  borderRadius: '4px', backgroundColor: '#f9f9f9', whiteSpace: 'pre-wrap'
                }}
              />
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => {
                    if (!usarFullOutput) {
                      alert('Debe activar el checkbox para permitir el parseo automático.');
                      return;
                    }
                    if (!nuevofullOutput || nuevofullOutput.trim() === '') {
                      alert('El contenido está vacío.');
                      return;
                    }
                    try {
                      // --- Parseo de JSON ---
                      const camposDesdeObjeto = (obj: any): Parametro[] => {
                        if (typeof obj !== 'object' || obj === null) return [];
                        return Object.entries(obj).map(([key, value]) => {
                          const tipo = Array.isArray(value) ? 'array' :
                            typeof value === 'object' ? 'object' :
                            typeof value;
                          const campo: Parametro = {
                            nombre: key,
                            tipo: tipo === 'number' ? 'int' :
                                  tipo === 'boolean' ? 'bool' :
                                  tipo,
                            enviarAServidor: false, // Por defecto false para parámetros de salida parseados
                            orden: 0
                          };
                          if (tipo === 'object') campo.subcampos = camposDesdeObjeto(value);
                          if (tipo === 'array' && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
  campo.subcampos = camposDesdeObjeto(value[0]);
}

                          return campo;
                        });
                      };

                      if (nuevotipoRespuesta === 'json') {
                        const json = JSON.parse(nuevofullOutput);
                        const base = nuevoTagPadre && json[nuevoTagPadre] ? json[nuevoTagPadre] : json;
                        setSalida(camposDesdeObjeto(base));
                        alert('✅ JSON parseado correctamente.');
                      }
                      // --- Parseo de XML ---
                      else if (nuevotipoRespuesta === 'xml') {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(nuevofullOutput, "text/xml");
                        const parseXMLElement = (element: Element): Parametro[] => {
                          const children = Array.from(element.children);
                          const uniqueNames = new Set(children.map(c => c.tagName));
                          return Array.from(uniqueNames).map(name => {
                            const sample = children.find(c => c.tagName === name)!;
                            const sub = parseXMLElement(sample);
                            const campo: Parametro = {
                              nombre: name,
                              tipo: sub.length > 0 ? 'object' : 'string',
                              enviarAServidor: false, // Por defecto false para parámetros de salida parseados
                              orden: 0
                            };
                            if (sub.length > 0) campo.subcampos = sub;
                            return campo;
                          });
                        };
                        let root: Element | null = xmlDoc.documentElement;
                        if (nuevoTagPadre) {
                          const tagElement = xmlDoc.getElementsByTagName(nuevoTagPadre)[0];
                          if (tagElement) root = tagElement;
                        }
                        if (!root) throw new Error("No se encontró el nodo raíz para el tag indicado");
                        const campos = parseXMLElement(root);
                        setSalida(campos);
                        alert('✅ XML parseado correctamente.');
                      }
                      else {
                        alert('El tipo de respuesta debe ser JSON o XML para aplicar el parseo.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('⚠️ Error al procesar el contenido. Asegúrese que sea válido.');
                    }
                  }}
                  style={{ backgroundColor: '#1565c0', color: 'white', padding: '6px 12px', borderRadius: '4px' }}
                >
                  ✅ Aplicar Parseo
                </button>
                <button
                  onClick={() => setMostrarPreviewFullOutput(false)}
                  style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorProceso;