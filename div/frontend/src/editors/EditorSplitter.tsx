import type { Campo, CampoAvanzado, ConfigSplitter } from '../types/tabla';
import React, { useEffect, useState } from 'react';

// --- Props del componente ---
interface Props {
  label: string;
  modoOperacion: 'descomponer' | 'unir';
  campoEntrada: string;
  campoSalida: string;
  modoParseo: 'delimitado' | 'plano' | 'plantilla';
  delimitadorPrincipal: string;
  separadorClaveValor: string;
  segmentosFijos: any[];
  camposUnir: Campo[];
  parametrosSalida: Campo[];
  codificacion?: 'none' | 'base64' | 'hex' | 'ascii' | 'utf8';
  prefijo?: string;
  sufijo?: string;
  onGuardar: (
    nuevoLabel: string,
    modoOperacion: 'descomponer' | 'unir',
    campoEntrada: string,
    campoSalida: string,
    modoParseo: 'delimitado' | 'plano' | 'plantilla',
    delimitador: string,
    separador: string,
    segmentos: any[],
    camposUnir: Campo[],
    salida: Campo[],
    codificacion: 'none' | 'base64' | 'hex' | 'ascii' | 'utf8',
    prefijo: string,
    sufijo: string
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

const tieneRepeticionesInvalidas = (arr: any[]) =>
  arr.some(s => {
    const repMax = s.repeticiones || 1;
    const repMin = s.repeticiones_minimas || 1;
    return repMax < repMin || repMax < 1 || repMin < 1 || repMax > 100;
  });

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
  codificacion = 'none',
  prefijo = '',
  sufijo = '',
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
  const [codificacionLocal, setCodificacionLocal] = useState<'none' | 'base64' | 'hex' | 'ascii' | 'utf8'>(codificacion);
  const [prefijoLocal, setPrefijoLocal] = useState(prefijo);
  const [sufijoLocal, setSufijoLocal] = useState(sufijo);
  const [vistaPrevia, setVistaPrevia] = useState('');

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
  const codificacionesDisponibles = ['none', 'base64', 'hex', 'ascii', 'utf8'];

  // Función para generar vista previa de trama
  const generarVistaPrevia = () => {
    if (modo === 'unir' && camposManual.length > 0) {
      const ejemplo = camposManual.reduce((acc, campo) => {
        acc[campo.nombre] = `valor_${campo.nombre}`;
        return acc;
      }, {} as any);
      
      let trama = '';
      if (modoParseoLocal === 'delimitado') {
        trama = camposManual.map(c => `${c.nombre}${separador}${ejemplo[c.nombre]}`).join(delimitador);
      } else {
        trama = Object.values(ejemplo).join('');
      }
      
      const tramaFinal = `${prefijoLocal}${trama}${sufijoLocal}`;
      setVistaPrevia(`Trama: ${tramaFinal}${codificacionLocal !== 'none' ? ` (${codificacionLocal})` : ''}`);
    } else {
      setVistaPrevia('');
    }
  };

  // Actualizar vista previa cuando cambien los parámetros
  React.useEffect(() => {
    generarVistaPrevia();
  }, [modo, camposManual, modoParseoLocal, separador, delimitador, prefijoLocal, sufijoLocal, codificacionLocal]);

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
      { nombre: '', longitud: '', tipo: 'string', repeticiones: 1, repeticiones_minimas: 1 }
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
                <option value="plantilla">Plantilla TCP</option>
              </select>

              <label>🔒 Codificación</label>
              <select value={codificacionLocal} onChange={e => setCodificacionLocal(e.target.value as any)}>
                <option value="none">Sin codificación</option>
                <option value="base64">Base64</option>
                <option value="hex">Hexadecimal</option>
                <option value="ascii">ASCII</option>
                <option value="utf8">UTF-8</option>
              </select>

              <label>🏷️ Prefijo de trama</label>
              <input 
                value={prefijoLocal} 
                onChange={e => setPrefijoLocal(e.target.value)}
                placeholder="Ej: STX, BEGIN_, etc."
              />

              <label>🏁 Sufijo de trama</label>
              <input 
                value={sufijoLocal} 
                onChange={e => setSufijoLocal(e.target.value)}
                placeholder="Ej: ETX, \n, \r\n, etc."
              />

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
                  <h4>📏 Configuración de campos por posición fija</h4>
                  <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
                    📌 Define cada campo con su posición, longitud y repeticiones máximas
                  </div>
                  
                  {/* Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr 40px', gap: '6px', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85em', color: '#555' }}>
                    <div>Campo</div>
                    <div>Tipo</div>
                    <div>Longitud (caracteres)</div>
                    <div>Rep. Máx</div>
                    <div>Rep. Mín</div>
                    <div></div>
                  </div>
                  {segmentosFijosLocal.map((seg, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr 40px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <input 
                        placeholder="Nombre del campo" 
                        value={seg.nombre} 
                        onChange={e => actualizarSegmento(index, { nombre: e.target.value })} 
                      />
                      <select value={seg.tipo} onChange={e => actualizarSegmento(index, { tipo: e.target.value })}>
                        {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input 
                        placeholder="10" 
                        type="number" 
                        min="1"
                        value={seg.longitud} 
                        onChange={e => actualizarSegmento(index, { longitud: Number(e.target.value) })} 
                      />
                      <input 
                        placeholder="1" 
                        type="number" 
                        min="1"
                        max="100"
                        value={seg.repeticiones || 1} 
                        onChange={e => actualizarSegmento(index, { repeticiones: Number(e.target.value) || 1 })} 
                      />
                      <input 
                        placeholder="1" 
                        type="number" 
                        min="1"
                        value={seg.repeticiones_minimas || 1} 
                        onChange={e => actualizarSegmento(index, { repeticiones_minimas: Number(e.target.value) || 1 })} 
                      />
                      <button onClick={() => eliminarSegmento(index)} style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '3px', padding: '4px 6px' }}>
                        ❌
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={agregarSegmento} 
                    style={{ marginTop: '8px', padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    ➕ Agregar campo
                  </button>
                  
                  {/* Ejemplo visual */}
                  {segmentosFijosLocal.length > 0 && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
                      <h5>📏 Estructura de trama y campos resultantes:</h5>
                      
                      {/* Estructura de trama */}
                      <div style={{ fontFamily: 'monospace', fontSize: '0.9em', marginBottom: '10px' }}>
                        <strong>Trama física:</strong><br />
                        {segmentosFijosLocal.map((seg, i) => (
                          <span key={i} style={{ marginRight: '2px', color: i % 2 === 0 ? '#0066cc' : '#cc6600' }}>
                            {seg.nombre}({seg.longitud})
                            {seg.repeticiones && seg.repeticiones > 1 && `[x${seg.repeticiones}]`}
                            {i < segmentosFijosLocal.length - 1 && ' | '}
                          </span>
                        ))}
                      </div>
                      
                      {/* Estructura de campos */}
                      <div style={{ fontSize: '0.9em' }}>
                        <strong>Campos de salida:</strong>
                        <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                          {segmentosFijosLocal.map((seg, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>
                              {seg.repeticiones && seg.repeticiones > 1 ? (
                                <>
                                  <strong>{seg.nombre}</strong> (object con {seg.repeticiones} campos)
                                  <ul style={{ marginLeft: '15px', color: '#666', fontSize: '0.85em' }}>
                                    <li>↳ Campos: {seg.nombre}1, {seg.nombre}2, {seg.nombre}3{seg.repeticiones > 3 ? '...' : ''}</li>
                                    <li>↳ Cada campo: {seg.tipo}, {seg.longitud} caracteres</li>
                                    <li>↳ Formato: campo:valor</li>
                                  </ul>
                                </>
                              ) : (
                                <><strong>{seg.nombre}</strong> ({seg.tipo}, {seg.longitud} caracteres)</>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                        <strong>Longitud total máxima:</strong> {segmentosFijosLocal.reduce((acc, seg) => acc + (seg.longitud * (seg.repeticiones || 1)), 0)} caracteres
                      </div>
                    </div>
                  )}
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

              <label>🔒 Codificación de salida</label>
              <select value={codificacionLocal} onChange={e => setCodificacionLocal(e.target.value as any)}>
                <option value="none">Sin codificación</option>
                <option value="base64">Base64</option>
                <option value="hex">Hexadecimal</option>
                <option value="ascii">ASCII</option>
                <option value="utf8">UTF-8</option>
              </select>

              <label>🏷️ Prefijo de trama</label>
              <input 
                value={prefijoLocal} 
                onChange={e => setPrefijoLocal(e.target.value)}
                placeholder="Ej: STX, BEGIN_, etc."
              />

              <label>🏁 Sufijo de trama</label>
              <input 
                value={sufijoLocal} 
                onChange={e => setSufijoLocal(e.target.value)}
                placeholder="Ej: ETX, \n, \r\n, etc."
              />

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
                <li key={i} style={{ marginBottom: '8px' }}>
                  🔹 <strong>{c.nombre}</strong> (<em>{c.tipo}</em>)
                  {c.subcampos && c.subcampos.length > 0 && (
                    <ul style={{ marginTop: '4px', marginLeft: '20px', fontSize: '0.9em' }}>
                      {c.subcampos.map((sub, j) => (
                        <li key={j} style={{ marginBottom: '2px', color: '#666' }}>
                          ↳ <strong>{sub.nombre}</strong>: valor ({sub.tipo})
                        </li>
                      ))}
                      <li style={{ color: '#888', fontSize: '0.85em', fontStyle: 'italic' }}>
                        📊 {c.tipo === 'object' ? 'Objeto' : 'Array'} con {c.subcampos.length} campos
                      </li>
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vista previa de trama */}
        {vistaPrevia && (
          <div style={{ marginTop: '15px', padding: '10px', background: '#f0f8ff', border: '1px solid #b0d4f1', borderRadius: '5px' }}>
            <h4>🔍 Vista previa de trama:</h4>
            <code style={{ display: 'block', padding: '8px', background: '#fff', border: '1px solid #ddd', borderRadius: '3px', fontFamily: 'monospace' }}>
              {vistaPrevia}
            </code>
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

              // Validaciones para codificación
              if (codificacionLocal && !codificacionesDisponibles.includes(codificacionLocal)) {
                alert('Codificación no válida.');
                return;
              }

              // Validaciones para caracteres especiales en prefijo/sufijo
              const procesarCaracteresEspeciales = (texto: string) => {
                return texto.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
              };
              
              const prefijoFinal = procesarCaracteresEspeciales(prefijoLocal);
              const sufijoFinal = procesarCaracteresEspeciales(sufijoLocal);

              if (modo === 'descomponer') {
                if (modoParseoLocal === 'plano') {
                  if (tieneDuplicadosSegmentos(segmentosFijosLocal)) {
                    alert('No puede haber campos duplicados en segmentos fijos.');
                    return;
                  }
                  if (tieneVaciosSegmentos(segmentosFijosLocal)) {
                    alert('Todos los campos deben tener nombre, tipo y longitud definidos.');
                    return;
                  }
                  if (tieneRepeticionesInvalidas(segmentosFijosLocal)) {
                    alert('Las repeticiones deben ser válidas: mínimo ≤ máximo, entre 1 y 100.');
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
              // Para posición fija con repeticiones, crear estructura jerárquica
              const expandirCamposConRepeticiones = (segmentos: any[]): Campo[] => {
                const camposExpandidos: Campo[] = [];
                segmentos.forEach(seg => {
                  const repeticiones = seg.repeticiones || 1;
                  if (repeticiones === 1) {
                    // Campo simple sin repeticiones
                    camposExpandidos.push({
                      nombre: seg.nombre,
                      tipo: seg.tipo || 'string'
                    });
                  } else {
                    // Campo padre con subcampos (array campo:valor)
                    const subcampos: Campo[] = [];
                    for (let i = 1; i <= repeticiones; i++) {
                      subcampos.push({
                        nombre: `${seg.nombre}${i}`, // Patrón: campo1, campo2, campo3...
                        tipo: seg.tipo || 'string'
                      });
                    }
                    camposExpandidos.push({
                      nombre: seg.nombre,
                      tipo: 'object', // Tipo object para indicar estructura campo:valor
                      subcampos: subcampos
                    });
                  }
                });
                return camposExpandidos;
              };

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
                      ? expandirCamposConRepeticiones(segmentosFijosLocal)
                      : camposDetectados)
                  : [{ nombre: salida, tipo: 'string' }],
                codificacionLocal,
                prefijoFinal,
                sufijoFinal
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