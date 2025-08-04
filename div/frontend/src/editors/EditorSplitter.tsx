import type { Campo } from '../types/tabla';
import React, { useEffect, useState } from 'react';

// --- Props del componente ---
interface Props {
  label: string;
  modoOperacion: 'descomponer' | 'unir';
  campoEntrada: string;
  campoSalida: string;
  modoParseo: 'delimitado' | 'plano';
  delimitadorPrincipal: string;
  separadorClaveValor: string;
  segmentosFijos: any[];
  camposUnir: Campo[];
  parametrosSalida: Campo[];
  onGuardar: (
    nuevoLabel: string,
    modoOperacion: 'descomponer' | 'unir',
    campoEntrada: string,
    campoSalida: string,
    modoParseo: 'delimitado' | 'plano',
    delimitador: string,
    separador: string,
    segmentos: any[],
    camposUnir: Campo[],
    salida: Campo[]
  ) => void;
  onCancelar: () => void;
}

// --- Funciones de validación ---
const tieneDuplicados = (arr: Campo[]) => {
  const nombres = arr.map(c => (c.nombre || '').trim());
  return nombres.some((n, i) => n && nombres.indexOf(n) !== i);
};
const tieneVacios = (arr: Campo[]) => arr.some(c => !c.nombre || !c.tipo);

const tieneDuplicadosSegmentos = (arr: any[]) => {
  const nombres = arr.map(s => (s.nombre || '').trim());
  return nombres.some((n, i) => n && nombres.indexOf(n) !== i);
};
const tieneVaciosSegmentos = (arr: any[]) =>
  arr.some(s => !s.nombre || !s.tipo || !s.longitud);

const EditorSplitter: React.FC<Props> = ({
  label,
  modoOperacion,
  campoEntrada,
  campoSalida,
  modoParseo,
  delimitadorPrincipal,
  separadorClaveValor,
  segmentosFijos,
  camposUnir,
  parametrosSalida,
  onGuardar,
  onCancelar,
}) => {
  // --- Estados principales ---
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [modo, setModo] = useState<'descomponer' | 'unir'>(modoOperacion);
  const [entrada] = useState("CampoIN");
  const [salida, setSalida] = useState(campoSalida || 'resultado');
  const [modoParseoLocal, setModoParseoLocal] = useState(modoParseo);
  const [delimitador, setDelimitador] = useState(delimitadorPrincipal || '|');
  const [separador, setSeparador] = useState(separadorClaveValor || '=');
  const [tramaEjemplo, setTramaEjemplo] = useState("codigo=123|cliente=Alonso|monto=5000");

  // --- Estados para campos y segmentos ---
  const [camposDetectados, setCamposDetectados] = useState<Campo[]>(
    Array.isArray(parametrosSalida) ? parametrosSalida : []
  );
  const [camposManual, setCamposManual] = useState<Campo[]>(
    Array.isArray(camposUnir) ? camposUnir : []
  );
  const [segmentosFijosLocal, setSegmentosFijosLocal] = useState<any[]>(
    Array.isArray(segmentosFijos) ? segmentosFijos : []
  );

  const tiposDisponibles = ['string', 'int', 'float', 'decimal', 'date', 'boolean'];

  // --- Parseo de trama de ejemplo para modo delimitado ---
  const parsearTrama = () => {
    if (!tramaEjemplo || !delimitador || !separador) {
      alert("Por favor complete delimitador, separador y la trama de prueba.");
      return;
    }
    const partes = tramaEjemplo.split(delimitador);
    const campos: Campo[] = partes.map((segmento) => {
      const [clave, _valor] = segmento.split(separador);
      return { nombre: clave?.trim(), tipo: "string" };
    }).filter(c => c.nombre);
    setCamposDetectados(campos);
  };

  // --- Handlers para campos detectados ---
  const actualizarCampoDetectado = (index: number, campo: Partial<Campo>) => {
    const copia = [...camposDetectados];
    copia[index] = { ...copia[index], ...campo };
    setCamposDetectados(copia);
  };
  const eliminarCampoDetectado = (index: number) => {
    setCamposDetectados(camposDetectados.filter((_, i) => i !== index));
  };
  const agregarCampoDetectado = () => {
    setCamposDetectados([...camposDetectados, { nombre: '', tipo: 'string' }]);
  };

  // --- Handlers para campos manuales ---
  const actualizarCampoManual = (index: number, campo: Partial<Campo>) => {
    const copia = [...camposManual];
    copia[index] = { ...copia[index], ...campo };
    setCamposManual(copia);
  };
  const eliminarCampoManual = (index: number) => {
    setCamposManual(camposManual.filter((_, i) => i !== index));
  };
  const agregarCampoManual = () => {
    setCamposManual([...camposManual, { nombre: '', tipo: 'string' }]);
  };

  // --- Handlers para segmentos fijos ---
  const agregarSegmento = () => {
    setSegmentosFijosLocal([
      ...segmentosFijosLocal,
      { nombre: '', longitud: '', tipo: 'string', repeticiones: '' }
    ]);
  };
  const actualizarSegmento = (index: number, campo: Partial<any>) => {
    const nuevos = [...segmentosFijosLocal];
    nuevos[index] = { ...nuevos[index], ...campo };
    setSegmentosFijosLocal(nuevos);
  };
  const eliminarSegmento = (index: number) => {
    setSegmentosFijosLocal(segmentosFijosLocal.filter((_, i) => i !== index));
  };

  // --- Sincroniza modo si cambia desde props ---
  useEffect(() => {
    setModo(modoOperacion);
  }, [modoOperacion]);

  // --- Determina los campos finales a mostrar ---
  const camposFinales = modo === 'descomponer' ? camposDetectados : camposManual;

  // --- Render ---
  return (
    <div className="modal">
      <div
        className="modal-content"
        style={{
          width: '860px',
          maxWidth: '95vw',
          padding: '20px',
          overflowX: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <h3>✂️ Configurar Splitter</h3>

        {/* Configuración general */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
          <label>🔖 Nombre del nodo</label>
          <input value={nuevoLabel} onChange={e => setNuevoLabel(e.target.value)} />

          <label>⚙️ Modo de operación</label>
          <select value={modo} onChange={e => setModo(e.target.value as any)}>
            <option value="descomponer">Descomponer (parseo)</option>
            <option value="unir">Unir (construcción)</option>
          </select>

          {/* Modo descomponer */}
          {modo === 'descomponer' && (
            <>
              <label>📥 Campo de entrada</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={entrada} readOnly style={{ background: '#f9f9f9', border: '1px solid #ccc' }} />
                <span style={{ fontSize: '0.85em', color: '#666', alignSelf: 'center' }}>string</span>
              </div>

              <label>🧪 Tipo de parseo</label>
              <select value={modoParseoLocal} onChange={e => setModoParseoLocal(e.target.value as any)}>
                <option value="delimitado">Delimitado</option>
                <option value="plano">Por posición fija</option>
              </select>

              {/* Parseo delimitado */}
              {modoParseoLocal === 'delimitado' && (
                <>
                  <label>🔗 Delimitador principal</label>
                  <input value={delimitador} onChange={e => setDelimitador(e.target.value)} />

                  <label>🧩 Separador clave-valor</label>
                  <input value={separador} onChange={e => setSeparador(e.target.value)} />

                  <label>🧾 Trama de prueba</label>
                  <input value={tramaEjemplo} onChange={e => setTramaEjemplo(e.target.value)} />

                  <div /> <button onClick={parsearTrama}>🔍 Parsear</button>
                </>
              )}

              {/* Parseo por posición fija */}
              {modoParseoLocal === 'plano' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <h4>📐 Segmentos fijos</h4>
                  {segmentosFijosLocal.map((seg, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 40px', gap: '6px', marginBottom: '6px' }}>
                      <input placeholder="Campo" value={seg.nombre} onChange={e => actualizarSegmento(index, { nombre: e.target.value })} />
                      <input placeholder="Longitud" type="number" value={seg.longitud} onChange={e => actualizarSegmento(index, { longitud: Number(e.target.value) })} />
                      <select value={seg.tipo} onChange={e => actualizarSegmento(index, { tipo: e.target.value })}>
                        {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input placeholder="Repeticiones" type="number" value={seg.repeticiones || ''} onChange={e => actualizarSegmento(index, { repeticiones: e.target.value ? Number(e.target.value) : '' })} />
                      <button onClick={() => eliminarSegmento(index)}>❌</button>
                    </div>
                  ))}
                  <button onClick={agregarSegmento}>➕ Agregar segmento</button>
                </div>
              )}

              {/* Campos detectados */}
              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <h4>🧾 Campos detectados o añadidos manualmente</h4>
                {camposDetectados.map((campo, i) => (
                  <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '4px' }}>
                    <input value={campo.nombre} onChange={e => actualizarCampoDetectado(i, { nombre: e.target.value })} />
                    <select value={campo.tipo} onChange={e => actualizarCampoDetectado(i, { tipo: e.target.value })}>
                      {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => eliminarCampoDetectado(i)}>❌</button>
                  </div>
                ))}
                <button onClick={agregarCampoDetectado}>➕ Agregar campo</button>
              </div>
            </>
          )}

          {/* Modo unir */}
          {modo === 'unir' && (
            <>
              <label>📤 Campo de salida</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={salida} onChange={e => setSalida(e.target.value)} />
                <span style={{ fontSize: '0.85em', color: '#666', alignSelf: 'center' }}>string</span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <h4>🔁 Campos de entrada (a construir)</h4>
                {camposManual.map((campo, index) => (
                  <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                    <input placeholder="nombre" value={campo.nombre} onChange={e => actualizarCampoManual(index, { nombre: e.target.value })} />
                    <select value={campo.tipo} onChange={e => actualizarCampoManual(index, { tipo: e.target.value })}>
                      {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => eliminarCampoManual(index)}>❌</button>
                  </div>
                ))}
                <button onClick={agregarCampoManual}>➕ Agregar campo</button>
              </div>
            </>
          )}
        </div>

        {/* Vista previa de campos finales */}
        {camposFinales.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>
              {modo === 'descomponer'
                ? '📌 Campos de salida:'
                : '📥 Campos de entrada resultantes:'}
            </h4>
            <ul>
              {camposFinales.map((c, i) => (
                <li key={i}>🔹 <strong>{c.nombre}</strong> (<em>{c.tipo}</em>)</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              // --- Validaciones antes de guardar ---
              if (!nuevoLabel.trim()) {
                alert('El nombre del nodo no puede estar vacío.');
                return;
              }

              if (modo === 'descomponer') {
                if (modoParseoLocal === 'plano') {
                  if (tieneDuplicadosSegmentos(segmentosFijosLocal) || tieneVaciosSegmentos(segmentosFijosLocal)) {
                    alert('No puede haber campos vacíos o duplicados en segmentos fijos.');
                    return;
                  }
                } else {
                  if (tieneDuplicados(camposDetectados) || tieneVacios(camposDetectados)) {
                    alert('No puede haber campos vacíos o duplicados en los campos detectados.');
                    return;
                  }
                }
              } else {
                if (tieneDuplicados(camposManual) || tieneVacios(camposManual)) {
                  alert('No puede haber campos vacíos o duplicados en los campos a unir.');
                  return;
                }
              }

              // --- Construcción de salida ---
              const salidaFinal: Campo[] =
                modoParseoLocal === 'plano'
                  ? segmentosFijosLocal.map((seg) => ({
                      nombre: seg.nombre,
                      tipo: seg.tipo || 'string'
                    }))
                  : camposDetectados;

              onGuardar(
                nuevoLabel,
                modo,
                entrada,
                salida,
                modoParseoLocal,
                delimitador,
                separador,
                segmentosFijosLocal,
                camposManual,
                modo === 'descomponer'
                  ? (modoParseoLocal === 'plano'
                      ? segmentosFijosLocal.map(seg => ({
                          nombre: seg.nombre,
                          tipo: seg.tipo || 'string'
                        }))
                      : camposDetectados)
                  : [{ nombre: salida, tipo: 'string' }]
              );
            }}
          >
            💾 Guardar Split
          </button>
          <button onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default EditorSplitter;