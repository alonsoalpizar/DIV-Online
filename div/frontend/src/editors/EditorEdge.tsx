import React, { useEffect, useState } from 'react';
import { Edge, Node, useReactFlow } from 'reactflow';
import { aplanarCampos, CampoPlano } from '../utils/aplanarCampos';
import AyudaFuncionTabla from '../components/Callouts/AyudaFuncionTabla';
import { obtenerFuncionesGlobales, FuncionGlobal } from '../utils/funcionesGlobales';
import { getApiBase } from '../utils/configuracion';



// --- Tipos e interfaces ---
interface Asignacion {
  destino: string;
  tipo: 'campo' | 'literal' | 'tabla' | 'sistema';
  valor: string;
  tabla?: string;
  campo?: string;
  valorEsCampo?: boolean;
}

interface Tabla {
  nombre: string;
  campos: { nombre: string; tipo: string }[];
}

interface CamposGrupo {
  grupo: string;
  entradas?: CampoPlano[];
  salidas?: CampoPlano[];
  errores?: CampoPlano[];
  campos?: CampoPlano[]; // Para especiales
}

interface Props {
  edge: Edge;
  onClose: () => void;
  onGuardar: (edgeId: string, asignaciones: Asignacion[]) => void;
}

// --- Componente principal ---
const EditorEdge: React.FC<Props> = ({ edge, onClose, onGuardar }) => {
  // --- Hooks de ReactFlow y estados ---
  const { getNode, getNodes } = useReactFlow();
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [camposGlobalesAgrupados, setCamposGlobalesAgrupados] = useState<CamposGrupo[]>([]);
  const [funcionesSistema, setFuncionesSistema] = useState<FuncionGlobal[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);

  // --- Obtención de nodos origen y destino ---
  const nodoOrigen = getNode(edge.source);
  const nodoDestino = getNode(edge.target);

  // Refuerzo visual: solo si el origen está a la izquierda del destino
  const nodoOrigenSeguro =
    nodoOrigen && nodoDestino && nodoOrigen.position.x < nodoDestino.position.x
      ? nodoOrigen
      : undefined;

  // --- Utilidades para campos y tablas ---
  const obtenerCamposDeTabla = (nombreTabla: string | undefined): { nombre: string; tipo: string }[] => {
    if (!nombreTabla) return [];
    const tabla = tablas.find(t => t.nombre === nombreTabla);
    return tabla?.campos || [];
  };

  const getCamposDisponibles = (nodo: Node | undefined, tipo: 'origen' | 'destino'): { nombre: string; tipo: string }[] => {
    if (!nodo || !nodo.data) return [];
    switch (nodo.type) {
      case 'entrada':
        return nodo.data.parametrosSalida || nodo.data.campos || [];
      case 'salida':
      case 'salidaError':
        return nodo.data.parametrosEntrada || nodo.data.campos || [];
      case 'proceso': {
        const entradas = nodo.data.parametrosEntrada || [];
        const salidas = nodo.data.parametrosSalida || [];
        const errores = nodo.data.parametrosError || [];
        if (tipo === 'origen') return edge.data?.esError ? errores : salidas;
        return entradas;
      }
      case 'splitter': {
        const modo = nodo.data.modoOperacion;
        if (modo === 'unir') {
          return tipo === 'origen'
            ? [{ nombre: nodo.data.campoSalida, tipo: 'string' }]
            : nodo.data.parametrosEntrada || [];
        } else {
          return tipo === 'origen'
            ? nodo.data.parametrosSalida || []
            : nodo.data.campoEntrada
              ? [{ nombre: nodo.data.campoEntrada, tipo: 'string' }]
              : [];
        }
      }
      case 'subproceso': {
        const entradas = nodo.data.parametrosEntrada || [];
        const salidas = nodo.data.parametrosSalida || [];
        return tipo === 'origen' ? salidas : entradas;
      }


      case 'condicion': {
      const salidas = nodo.data.parametrosSalida || [];
      const errores = nodo.data.parametrosError || [];
      if (tipo === 'origen') {
        return edge.data?.esError ? errores : salidas;
      }
      return nodo.data.parametrosEntrada || [];
    }

    default:
      return [];

      
      }
  };

  // --- Efecto: Agrupa campos globales por nodo ---
  useEffect(() => {
    const nodos = getNodes();
    const camposPorNodo: CamposGrupo[] = [];
    const nodosAnteriores = nodos.filter(n => n.id !== edge.target);

    for (const nodo of nodosAnteriores) {
      const tipo = nodo.type;
      const data = nodo.data;
      if (!data) continue;

      let entradas: CampoPlano[] = [];
      let salidas: CampoPlano[] = [];
      let errores: CampoPlano[] = [];

      switch (tipo) {
        case 'entrada':
          entradas = aplanarCampos(data.campos || []);
          break;
        case 'proceso':
          entradas = aplanarCampos(data.parametrosEntrada || []);
          salidas = aplanarCampos(data.parametrosSalida || []);
          errores = aplanarCampos(data.parametrosError || []);
          break;
        case 'splitter':
        case 'subproceso':
          entradas = aplanarCampos(data.parametrosEntrada || []);
          salidas = aplanarCampos(data.parametrosSalida || []);
          break;
        case 'condicion':
          salidas = aplanarCampos(data.parametrosSalida || []);
          errores = aplanarCampos(data.parametrosError || []);  // ✅ Agregamos esto
          break;
        case 'salida':
        case 'salidaError':
          salidas = aplanarCampos(data.campos || []);
          break;
      }

      if (entradas.length || salidas.length || errores.length) {
        camposPorNodo.push({
          grupo: data.label || nodo.id,
          entradas,
          salidas,
          errores
        });
      }
    }

    // Campos especiales
    camposPorNodo.push({
      grupo: '🌀 Especiales',
      campos: [
        { nombre: 'Usuario', ruta: 'Usuario', tipo: 'string' },
        { nombre: 'Fecha', ruta: 'Fecha', tipo: 'date' },
        { nombre: 'NombreFlujo', ruta: 'NombreFlujo', tipo: 'string' },
      ]
    });

    setCamposGlobalesAgrupados(camposPorNodo);
  }, [edge, getNodes]);

  // --- Efecto: Carga tablas y funciones de sistema ---
  useEffect(() => {
    fetch(`${getApiBase()}/tablas`)
      .then(res => res.json())
      .then(data => setTablas(data))
      .catch(err => console.error('Error cargando tablas:', err));

    obtenerFuncionesGlobales().then(funcs => {
      setFuncionesSistema(funcs.filter(f => f.origen === 'estatica'));
    });
  }, []);

  // --- Efecto: Inicializa asignaciones según campos destino ---
  useEffect(() => {
    const camposDestinoPlanos: CampoPlano[] = aplanarCampos(getCamposDisponibles(nodoDestino, 'destino') || []);
    const prevAsignaciones = nodoDestino?.data?.asignaciones?.[edge.source];
    const destinosActuales = camposDestinoPlanos.map(dest => dest.ruta);

    if (prevAsignaciones && prevAsignaciones.length > 0) {
     const yaAsignados = prevAsignaciones.map((a: Asignacion) => a.destino);
      const faltantes: Asignacion[] = destinosActuales
        .filter(dest => !yaAsignados.includes(dest))
        .map(dest => ({
          destino: dest,
          tipo: 'campo',
          valor: ''
        }));
      setAsignaciones([...prevAsignaciones, ...faltantes]);
    } else {
      const iniciales: Asignacion[] = camposDestinoPlanos.map(dest => ({
        destino: dest.ruta,
        tipo: 'campo',
        valor: ''
      }));
      setAsignaciones(iniciales);
    }
  }, [edge.id, nodoDestino?.id]);

  // --- Handlers de asignaciones ---
  const actualizarAsignacion = (index: number, campo: Partial<Asignacion>) => {
    const nuevas = [...asignaciones];
    nuevas[index] = { ...nuevas[index], ...campo };
    setAsignaciones(nuevas);
  };

  const agregarAsignacion = () => {
    setAsignaciones([...asignaciones, { destino: '', tipo: 'campo', valor: '' }]);
  };

  const eliminarAsignacion = (index: number) => {
    const nuevas = asignaciones.filter((_, i) => i !== index);
    setAsignaciones(nuevas);
  };

  const guardar = () => {
    const incompletas = asignaciones.some(a => !a.destino || !a.tipo || !a.valor);
    if (incompletas) {
      alert('⚠️ Hay asignaciones incompletas. Verifica los campos.');
      return;
    }
    onGuardar(edge.id, asignaciones);
    onClose();
  };

  // --- Obtención de campos planos para selects ---
  const camposOrigen = getCamposDisponibles(nodoOrigenSeguro, 'origen');
  const camposDestino = getCamposDisponibles(nodoDestino, 'destino');
  const camposOrigenPlanos: CampoPlano[] = aplanarCampos(camposOrigen || []);
  const camposDestinoPlanos: CampoPlano[] = aplanarCampos(camposDestino || []);

  // --- Render ---
  return (
    <div className="modal">
      <div
        className="modal-content"
        style={{
          width: 'fit-content',
          maxWidth: '95vw',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          gap: '20px',
          overflowX: 'auto'
        }}
      >
        {/* Panel izquierdo: campos disponibles */}
        <div style={{ minWidth: '200px', borderRight: '1px solid #ddd', paddingRight: '10px' }}>
          <h4>Campos disponibles</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85em' }}>
           {camposOrigenPlanos.map((c: CampoPlano, idx: number) => (
  <li key={c.ruta + '-' + idx}>
    <button
      aria-label={`Copiar campo ${c.ruta} al portapapeles`}
      title={`Copiar campo ${c.ruta} al portapapeles`}
      onClick={() => {
        navigator.clipboard.writeText(c.ruta);
        setCopiado(c.ruta);
        setTimeout(() => setCopiado(null), 2000);
      }}
      style={{
        background: '#f4f4f4',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '4px 6px',
        marginBottom: '4px',
        cursor: 'copy',
        width: '100%',
        textAlign: 'left',
        color: '#222',
        fontWeight: 500
      }}
    >
      📋 {c.ruta}
    </button>
    {copiado === c.ruta && (
      <div style={{ fontSize: '0.75em', color: 'green' }}>¡Copiado al portapapeles!</div>
    )}
  </li>
))}
          </ul>
        </div>

        {/* Panel derecho: asignaciones */}
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '10px' }}>Asignaciones entre nodos</h3>
          {asignaciones.map((asig, index) => (
            <div
              key={index}
              className="asignacion-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '5px',
                alignItems: 'start',
                marginBottom: '5px',
                width: '100%'
              }}
            >
              {/* Select destino */}
              <select
                value={asig.destino}
                onChange={e => actualizarAsignacion(index, { destino: e.target.value })}
              >
                <option value="">-- Campo destino --</option>
                {camposDestinoPlanos.map((c: CampoPlano, idx: number) => (
  <option key={c.ruta + '-' + idx} value={c.ruta}>{c.ruta}</option>
))}
              </select>

              {/* Select tipo de asignación */}
              <select
                value={asig.tipo}
                onChange={e => actualizarAsignacion(index, { tipo: e.target.value as Asignacion['tipo'] })}
              >
                <option value="campo">📥 Campo</option>
                <option value="literal">✍️ Literal</option>
                <option value="tabla">📊 Función de Tabla</option>
                <option value="sistema">⚙️ Función de Sistema</option>
              </select>

              {/* Valor de asignación según tipo */}
              <div style={{ display: 'grid', gap: '6px', maxWidth: '100%' }}>
                {/* Tipo campo: agrupados por entradas/salidas/errores */}
                {asig.tipo === 'campo' && (
                  <select
                    value={asig.valor}
                    onChange={e => actualizarAsignacion(index, { valor: e.target.value })}
                  >
                        <option value="">-- Campo origen (global) --</option>
                        {camposGlobalesAgrupados.map((grupo: CamposGrupo) => (
                        <React.Fragment key={grupo.grupo}>
                        {grupo.entradas && grupo.entradas.length > 0 && (
                        <optgroup label={`${grupo.grupo} ▸ Entradas`}>
                        {grupo.entradas.map((c: CampoPlano, idx: number) => (
                        <option key={grupo.grupo + '-in-' + c.ruta + '-' + idx} value={c.ruta}>{c.ruta}</option>
                        ))}
                        </optgroup>
                        )}
                        {grupo.salidas && grupo.salidas.length > 0 && (
                        <optgroup label={`${grupo.grupo} ▸ Salidas`}>
                        {grupo.salidas.map((c: CampoPlano, idx: number) => (
                        <option key={grupo.grupo + '-out-' + c.ruta + '-' + idx} value={c.ruta}>{c.ruta}</option>
                        ))}
                        </optgroup>
                        )}
                        {grupo.errores && grupo.errores.length > 0 && (
                        <optgroup label={`${grupo.grupo} ▸ Errores`}>
                        {grupo.errores.map((c: CampoPlano, idx: number) => (
                        <option key={grupo.grupo + '-err-' + c.ruta + '-' + idx} value={c.ruta}>{c.ruta}</option>
                        ))}
                        </optgroup>
                        )}
                        {grupo.campos && grupo.campos.length > 0 && (
                        <optgroup label={`${grupo.grupo}`}>
                        {grupo.campos.map((c: CampoPlano, idx: number) => (
                        <option key={grupo.grupo + '-campo-' + c.ruta + '-' + idx} value={c.ruta}>{c.ruta}</option>
                        ))}
                        </optgroup>
                        )}
                        </React.Fragment>
                        ))}
                  </select>
                )}

                {/* Tipo literal */}
                {asig.tipo === 'literal' && (
                  <input
                    placeholder="Valor literal"
                    style={{ width: '100%' }}
                    value={asig.valor}
                    onChange={e => actualizarAsignacion(index, { valor: e.target.value })}
                  />
                )}

                {/* Tipo tabla */}
                {asig.tipo === 'tabla' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <select
                      value={asig.tabla || ''}
                      onChange={(e) => actualizarAsignacion(index, { tabla: e.target.value })}
                    >
                      <option value="">-- Seleccione tabla --</option>
                      {tablas.map((t: Tabla) => (
                        <option key={t.nombre} value={t.nombre}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>

                    <label style={{ fontSize: '0.85em' }}>
                      <input
                        type="checkbox"
                        checked={asig.valorEsCampo || false}
                        onChange={(e) =>
                          actualizarAsignacion(index, { valorEsCampo: e.target.checked })
                        }
                      />{' '}
                      Usar clave como campo
                    </label>

                    {asig.valorEsCampo ? (
                      <select
                        value={asig.valor}
                        onChange={(e) => actualizarAsignacion(index, { valor: e.target.value })}
                      >
                        <option value="">-- Campo origen --</option>
                        {camposOrigenPlanos.map((c: CampoPlano) => (
                          <option key={c.ruta} value={c.ruta}>
                            {c.ruta}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        placeholder="Valor literal de clave"
                        style={{ width: '100%' }}
                        value={asig.valor}
                        onChange={(e) => actualizarAsignacion(index, { valor: e.target.value })}
                      />
                    )}

                    <select
                      value={asig.campo || ''}
                      onChange={(e) => actualizarAsignacion(index, { campo: e.target.value })}
                    >
                      <option value="">-- Campo resultado --</option>
                      {obtenerCamposDeTabla(asig.tabla).map((c) => (
                        <option key={c.nombre} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>

                    <div
                      style={{
                        background: '#f3f3f3',
                        padding: '4px 6px',
                        fontFamily: 'monospace',
                        fontSize: '0.85em',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    >
                      {asig.tabla && asig.valor && asig.campo
                        ? `Tabla("${asig.tabla}", ${asig.valorEsCampo ? asig.valor : `"${asig.valor}"`}).${asig.campo}`
                        : '🔧 Define tabla, clave y campo'}
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <AyudaFuncionTabla />
                    </div>
                  </div>
                )}

                {/* Tipo sistema */}
                {asig.tipo === 'sistema' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      placeholder='Ej: Parametro("clave")'
                      style={{ width: '100%' }}
                      value={asig.valor}
                      onChange={e => actualizarAsignacion(index, { valor: e.target.value })}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.8em' }}>
                      <select
                        onChange={e => {
                          const seleccionada = funcionesSistema.find(f => f.nombre === e.target.value);
                          if (seleccionada) {
                            actualizarAsignacion(index, { valor: seleccionada.ejemplo || `${seleccionada.nombre}()` });
                          }
                        }}
                        defaultValue=""
                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9em' }}
                      >
                        <option value="">🧠 Elegir función de sistema...</option>
                        {funcionesSistema.map(func => (
                          <option key={func.nombre} value={func.nombre}>
                            {func.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón eliminar asignación */}
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => eliminarAsignacion(index)}>❌</button>
              </div>
            </div>
          ))}

          {/* Acciones de asignación */}
          {/* Si quieres permitir agregar asignaciones manualmente, descomenta la siguiente línea */}
          {/* <div className="asignacion-actions" style={{ marginTop: '20px' }}>
            <button onClick={agregarAsignacion}>➕ Agregar Asignación</button>
          </div> */}

          {/* Footer de modal */}
          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={guardar}>💾 Guardar</button>
            <button onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorEdge;