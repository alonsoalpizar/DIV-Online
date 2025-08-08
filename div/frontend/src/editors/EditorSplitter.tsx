import type { Campo, CampoAvanzado, ConfigSplitter } from '../types/tabla';
import React, { useEffect, useState } from 'react';

// --- Props del componente ---
interface Props {
  label: string;
  modoOperacion: 'descomponer' | 'unir';
  campoEntrada: string;
  campoSalida: string;
  modoParseo: 'delimitado' | 'plano' | 'plantilla' | 'bloques_repetidos';
  delimitadorPrincipal: string;
  separadorClaveValor: string;
  segmentosFijos: any[];
  camposUnir: Campo[];
  parametrosSalida: Campo[];
  longitudRegistro?: number;
  campoMultiple?: {
    nombreObjeto?: string;
    nombreArray?: string;
    cantidadMinima?: number;
    subcampos?: { nombre: string; inicio: number; longitud: number; tipo: string }[];
  };
  codificacion?: 'none' | 'base64' | 'hex' | 'ascii' | 'utf8' | 'xml';
  prefijo?: string;
  sufijo?: string;
  onGuardar: (
    nuevoLabel: string,
    modoOperacion: 'descomponer' | 'unir',
    campoEntrada: string,
    campoSalida: string,
    modoParseo: 'delimitado' | 'plano' | 'plantilla' | 'bloques_repetidos',
    delimitador: string,
    separador: string,
    segmentos: any[],
    camposUnir: Campo[],
    salida: Campo[],
    codificacion: 'none' | 'base64' | 'hex' | 'ascii' | 'utf8' | 'xml',
    prefijo: string,
    sufijo: string,
    longitudRegistro?: number,
    campoMultiple?: any
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
  longitudRegistro,
  campoMultiple,
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
  const [codificacionLocal, setCodificacionLocal] = useState<'none' | 'base64' | 'hex' | 'ascii' | 'utf8' | 'xml'>(codificacion);
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
  
  // --- Estados para bloques repetidos ---
  const [longitudRegistroLocal, setLongitudRegistroLocal] = useState(longitudRegistro || 50);
  const [campoMultipleLocal, setCampoMultipleLocal] = useState<{
    nombreObjeto: string;
    nombreArray: string;
    cantidadMinima: number;
    subcampos: { nombre: string; inicio: number; longitud: number; tipo: string }[];
  }>({
    nombreObjeto: campoMultiple?.nombreObjeto || 'Recibos',
    nombreArray: campoMultiple?.nombreArray || 'recibo', 
    cantidadMinima: campoMultiple?.cantidadMinima || 1,
    subcampos: campoMultiple?.subcampos || []
  });

  const tiposDisponibles = ['string', 'int', 'float', 'decimal', 'date', 'boolean'];
  const codificacionesDisponibles = ['none', 'base64', 'hex', 'ascii', 'utf8', 'xml'];

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
      { nombre: '', longitud: '', tipo: 'string', repeticiones: 1, repeticiones_minimas: 1, tipo_estructura: 'simple' }
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

  // --- Sincroniza campos de bloques repetidos desde props ---
  useEffect(() => {
    if (longitudRegistro !== undefined) {
      setLongitudRegistroLocal(longitudRegistro);
    }
  }, [longitudRegistro]);

  useEffect(() => {
    if (campoMultiple) {
      setCampoMultipleLocal({
        nombreObjeto: campoMultiple.nombreObjeto || 'Recibos',
        nombreArray: campoMultiple.nombreArray || 'recibo',
        cantidadMinima: campoMultiple.cantidadMinima || 1,
        subcampos: campoMultiple.subcampos || []
      });
    }
  }, [campoMultiple]);

  // --- Determina los campos finales a mostrar ---
  const camposFinales = modo === 'descomponer' ? camposDetectados : camposManual;

  // --- Render ---
  return (
    <div className="modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div
        className="modal-content"
        style={{
          width: '90vw',
          maxWidth: '1400px',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>✂️ Configurar Splitter</h3>

        {/* Configuración general */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🔖 Nombre del nodo</label>
            <input 
              value={nuevoLabel} 
              onChange={e => setNuevoLabel(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>⚙️ Modo de operación</label>
            <select 
              value={modo} 
              onChange={e => setModo(e.target.value as any)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="descomponer">Descomponer (parseo)</option>
              <option value="unir">Unir (construcción)</option>
            </select>
          </div>

          {/* Tercera columna vacía para mantener el grid */}
          <div></div>
        </div>

        {/* Modo descomponer */}
        {modo === 'descomponer' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📥 Campo de entrada</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    value={entrada} 
                    readOnly 
                    style={{ flex: 1, padding: '8px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }} 
                  />
                  <span style={{ fontSize: '0.85em', color: '#666', alignSelf: 'center' }}>string</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🧪 Tipo de parseo</label>
                <select 
                  value={modoParseoLocal} 
                  onChange={e => setModoParseoLocal(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="delimitado">Delimitado</option>
                  <option value="plano">Por posición fija</option>
                  <option value="plantilla">Plantilla TCP</option>
                  <option value="bloques_repetidos">Bloques repetidos</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🔒 Codificación</label>
                <select 
                  value={codificacionLocal} 
                  onChange={e => setCodificacionLocal(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="none">Sin codificación</option>
                  <option value="base64">Base64</option>
                  <option value="hex">Hexadecimal</option>
                  <option value="ascii">ASCII</option>
                  <option value="utf8">UTF-8</option>
                  <option value="xml">XML</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏷️ Prefijo de trama</label>
                <input 
                  value={prefijoLocal} 
                  onChange={e => setPrefijoLocal(e.target.value)}
                  placeholder="Ej: STX, BEGIN_, etc."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏁 Sufijo de trama</label>
                <input 
                  value={sufijoLocal} 
                  onChange={e => setSufijoLocal(e.target.value)}
                  placeholder="Ej: ETX, \n, \r\n, etc."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            {/* Parseo delimitado */}
            {modoParseoLocal === 'delimitado' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🔗 Delimitador principal</label>
                  <input 
                    value={delimitador} 
                    onChange={e => setDelimitador(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🧩 Separador clave-valor</label>
                  <input 
                    value={separador} 
                    onChange={e => setSeparador(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🧾 Trama de prueba</label>
                  <input 
                    value={tramaEjemplo} 
                    onChange={e => setTramaEjemplo(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 3', textAlign: 'center' }}>
                  <button 
                    onClick={parsearTrama}
                    style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🔍 Parsear Trama
                  </button>
                </div>
              </div>
            )}

              {/* Parseo por posición fija */}
              {modoParseoLocal === 'plano' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <h4>📏 Configuración de campos por posición fija</h4>
                  <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
                    📌 Define cada campo con su posición, longitud y repeticiones máximas
                  </div>
                  
                  {/* Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr 1.2fr 40px', gap: '6px', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85em', color: '#555' }}>
                    <div>Campo</div>
                    <div>Tipo</div>
                    <div>Longitud (caracteres)</div>
                    <div>Rep. Máx</div>
                    <div>Rep. Mín</div>
                    <div>Estructura</div>
                    <div></div>
                  </div>
                  {segmentosFijosLocal.map((seg, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr 1.2fr 40px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
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
                        onChange={e => {
                          const newReps = Number(e.target.value) || 1;
                          const newTipoEstructura = newReps <= 1 ? 'simple' : (seg.tipo_estructura === 'simple' ? 'object' : seg.tipo_estructura);
                          actualizarSegmento(index, { repeticiones: newReps, tipo_estructura: newTipoEstructura });
                        }} 
                      />
                      <input 
                        placeholder="1" 
                        type="number" 
                        min="1"
                        value={seg.repeticiones_minimas || 1} 
                        onChange={e => actualizarSegmento(index, { repeticiones_minimas: Number(e.target.value) || 1 })} 
                      />
                      <select 
                        value={seg.tipo_estructura || (seg.repeticiones <= 1 ? 'simple' : 'object')} 
                        onChange={e => actualizarSegmento(index, { tipo_estructura: e.target.value })}
                        disabled={!seg.repeticiones || seg.repeticiones <= 1}
                        style={{ fontSize: '0.85em' }}
                      >
                        <option value="simple">Simple</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
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
                                  <strong>{seg.nombre}</strong> ({seg.tipo_estructura || 'object'} con {seg.repeticiones} elementos)
                                  <ul style={{ marginLeft: '15px', color: '#666', fontSize: '0.85em' }}>
                                    {seg.tipo_estructura === 'array' ? (
                                      <>
                                        <li>↳ Array de {seg.repeticiones} elementos</li>
                                        <li>↳ Cada elemento: {seg.tipo}, {seg.longitud} caracteres</li>
                                      </>
                                    ) : (
                                      <>
                                        <li>↳ Campos: {seg.nombre}1, {seg.nombre}2, {seg.nombre}3{seg.repeticiones > 3 ? '...' : ''}</li>
                                        <li>↳ Cada campo: {seg.tipo}, {seg.longitud} caracteres</li>
                                        <li>↳ Formato: campo:valor</li>
                                      </>
                                    )}
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

              {/* Parseo de bloques repetidos */}
              {modoParseoLocal === 'bloques_repetidos' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <h4>🔁 Configuración de bloques repetidos</h4>
                  <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
                    📌 Define la estructura de un bloque que se repite múltiples veces en la trama
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📦 Objeto padre</label>
                      <input 
                        value={campoMultipleLocal.nombreObjeto}
                        onChange={e => setCampoMultipleLocal({...campoMultipleLocal, nombreObjeto: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="Recibos"
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏷️ Nombre del array</label>
                      <input 
                        value={campoMultipleLocal.nombreArray}
                        onChange={e => setCampoMultipleLocal({...campoMultipleLocal, nombreArray: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="recibo"
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📏 Longitud por bloque</label>
                      <input 
                        type="number"
                        value={longitudRegistroLocal}
                        onChange={e => setLongitudRegistroLocal(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="55"
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📋 Trama de ejemplo</label>
                      <input 
                        value="0020250700000000000713888520250802001000240100514697230"
                        readOnly
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', background: '#f9f9f9' }}
                      />
                    </div>
                  </div>

                  <h5>📊 Subcampos del bloque:</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '6px', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85em', color: '#555' }}>
                    <div>Nombre</div>
                    <div>Posición</div>
                    <div>Longitud</div>
                    <div>Tipo</div>
                    <div></div>
                  </div>
                  
                  {campoMultipleLocal.subcampos.map((subcampo, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <input 
                        placeholder="nombre" 
                        value={subcampo.nombre}
                        onChange={e => {
                          const nuevos = [...campoMultipleLocal.subcampos];
                          nuevos[index] = { ...nuevos[index], nombre: e.target.value };
                          setCampoMultipleLocal({...campoMultipleLocal, subcampos: nuevos});
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input 
                        type="number"
                        placeholder="0"
                        value={subcampo.inicio}
                        onChange={e => {
                          const nuevos = [...campoMultipleLocal.subcampos];
                          nuevos[index] = { ...nuevos[index], inicio: Number(e.target.value) };
                          setCampoMultipleLocal({...campoMultipleLocal, subcampos: nuevos});
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input 
                        type="number"
                        placeholder="10"
                        value={subcampo.longitud}
                        onChange={e => {
                          const nuevos = [...campoMultipleLocal.subcampos];
                          nuevos[index] = { ...nuevos[index], longitud: Number(e.target.value) };
                          setCampoMultipleLocal({...campoMultipleLocal, subcampos: nuevos});
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <select 
                        value={subcampo.tipo}
                        onChange={e => {
                          const nuevos = [...campoMultipleLocal.subcampos];
                          nuevos[index] = { ...nuevos[index], tipo: e.target.value };
                          setCampoMultipleLocal({...campoMultipleLocal, subcampos: nuevos});
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button 
                        onClick={() => {
                          const nuevos = campoMultipleLocal.subcampos.filter((_, i) => i !== index);
                          setCampoMultipleLocal({...campoMultipleLocal, subcampos: nuevos});
                        }}
                        style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '3px', padding: '4px 6px' }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                      setCampoMultipleLocal({
                        ...campoMultipleLocal,
                        subcampos: [...campoMultipleLocal.subcampos, { nombre: '', inicio: 0, longitud: 1, tipo: 'string' }]
                      });
                    }}
                    style={{ marginTop: '8px', padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    ➕ Agregar subcampo
                  </button>
                </div>
              )}

              {/* Campos detectados */}
              {modoParseoLocal !== 'bloques_repetidos' && (
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
              )}

              {/* Vista previa de estructura para bloques repetidos */}
              {modoParseoLocal === 'bloques_repetidos' && campoMultipleLocal.subcampos.length > 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
                  <h4>🧾 Estructura de campos resultante</h4>
                  <div style={{ 
                    padding: '15px', 
                    background: '#f9f9f9', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  }}>
                    <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#0066cc' }}>
                      📦 {campoMultipleLocal.nombreObjeto}: <span style={{ color: '#008000' }}>object</span>
                    </div>
                    <div style={{ marginLeft: '20px', borderLeft: '2px solid #0066cc', paddingLeft: '15px', marginBottom: '10px' }}>
                      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#0066cc' }}>
                        📋 {campoMultipleLocal.nombreArray}: <span style={{ color: '#008000' }}>array</span>
                      </div>
                      <div style={{ marginLeft: '20px', borderLeft: '2px solid #ddd', paddingLeft: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
                          📄 Cada elemento contiene:
                        </div>
                      {campoMultipleLocal.subcampos.map((sub, index) => (
                        <div key={index} style={{ 
                          marginBottom: '4px', 
                          padding: '4px 8px',
                          background: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '3px'
                        }}>
                          <span style={{ color: '#0066cc', fontWeight: 'bold' }}>
                            {sub.nombre}
                          </span>
                          <span style={{ color: '#666' }}>: </span>
                          <span style={{ color: '#008000' }}>{sub.tipo}</span>
                          <span style={{ color: '#999', fontSize: '0.85em' }}>
                            {' '}(pos: {sub.inicio}, len: {sub.longitud})
                          </span>
                        </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px', 
                      background: '#e8f4fd', 
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      color: '#0066cc'
                    }}>
                      💡 <strong>Resultado JSON:</strong> Objeto con array de elementos, cada uno con {campoMultipleLocal.subcampos.length} campos
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        {/* Modo unir */}
        {modo === 'unir' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📤 Campo de salida</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  value={salida} 
                  onChange={e => setSalida(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <span style={{ fontSize: '0.85em', color: '#666', alignSelf: 'center' }}>string</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🔒 Codificación de salida</label>
              <select 
                value={codificacionLocal} 
                onChange={e => setCodificacionLocal(e.target.value as any)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="none">Sin codificación</option>
                <option value="base64">Base64</option>
                <option value="hex">Hexadecimal</option>
                <option value="ascii">ASCII</option>
                <option value="utf8">UTF-8</option>
                <option value="xml">XML</option>
              </select>
            </div>

            <div></div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏷️ Prefijo de trama</label>
              <input 
                value={prefijoLocal} 
                onChange={e => setPrefijoLocal(e.target.value)}
                placeholder="Ej: STX, BEGIN_, etc."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏁 Sufijo de trama</label>
              <input 
                value={sufijoLocal} 
                onChange={e => setSufijoLocal(e.target.value)}
                placeholder="Ej: ETX, \n, \r\n, etc."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <h4>🔁 Campos de entrada (a construir)</h4>
              {camposManual.map((campo, index) => (
                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                  <input 
                    placeholder="nombre" 
                    value={campo.nombre} 
                    onChange={e => actualizarCampoManual(index, { nombre: e.target.value })}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <select 
                    value={campo.tipo} 
                    onChange={e => actualizarCampoManual(index, { tipo: e.target.value })}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button 
                    onClick={() => eliminarCampoManual(index)}
                    style={{ padding: '6px 8px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}
                  >❌</button>
                </div>
              ))}
              <button 
                onClick={agregarCampoManual}
                style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
              >➕ Agregar campo</button>
            </div>
          </div>
        )}

        {/* Vista previa de campos finales - Solo mostrar en modo unir */}
        {modo === 'unir' && camposFinales.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>📥 Campos de entrada resultantes:</h4>
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
                  const tipoEstructura = seg.tipo_estructura || (repeticiones <= 1 ? 'simple' : 'object');
                  
                  if (repeticiones === 1 || tipoEstructura === 'simple') {
                    // Campo simple sin repeticiones o forzado como simple
                    camposExpandidos.push({
                      nombre: seg.nombre,
                      tipo: seg.tipo || 'string'
                    });
                  } else {
                    if (tipoEstructura === 'array') {
                      // Array de elementos del mismo tipo
                      camposExpandidos.push({
                        nombre: seg.nombre,
                        tipo: 'array',
                        subcampos: [{
                          nombre: 'element',
                          tipo: seg.tipo || 'string'
                        }]
                      });
                    } else if (tipoEstructura === 'object') {
                      // Object con campos numerados (campo1, campo2, etc.)
                      const subcampos: Campo[] = [];
                      for (let i = 1; i <= repeticiones; i++) {
                        subcampos.push({
                          nombre: `${seg.nombre}${i}`,
                          tipo: seg.tipo || 'string'
                        });
                      }
                      camposExpandidos.push({
                        nombre: seg.nombre,
                        tipo: 'object',
                        subcampos: subcampos
                      });
                    }
                  }
                });
                return camposExpandidos;
              };

              // Para bloques repetidos, crear estructura jerárquica: objeto -> array -> elementos
              const crearCampoBloquesRepetidos = (): Campo[] => {
                if (campoMultipleLocal.subcampos.length === 0) return [];
                
                const subcamposArray: Campo[] = campoMultipleLocal.subcampos.map(sub => ({
                  nombre: sub.nombre,
                  tipo: sub.tipo
                }));
                
                // Crear el array con sus subcampos
                const campoArray: Campo = {
                  nombre: campoMultipleLocal.nombreArray,
                  tipo: 'array',
                  subcampos: subcamposArray
                };
                
                // Crear el objeto padre que contiene el array
                return [{
                  nombre: campoMultipleLocal.nombreObjeto,
                  tipo: 'object',
                  subcampos: [campoArray]
                }];
              };

              // --- Limpiar campos según modo de parseo ---
              const limpiarSegunModo = () => {
                if (modoParseoLocal === 'plano') {
                  return {
                    delimitador: '',
                    separador: '',
                    segmentosFijos: segmentosFijosLocal,
                    camposUnir: [],
                    longitudRegistro: segmentosFijosLocal.reduce((acc, seg) => acc + (seg.longitud * (seg.repeticiones || 1)), 0),
                    campoMultiple: { nombreObjeto: '', nombreArray: '', cantidadMinima: 1, subcampos: [] }
                  };
                } else if (modoParseoLocal === 'bloques_repetidos') {
                  return {
                    delimitador: '',
                    separador: '',
                    segmentosFijos: [],
                    camposUnir: [],
                    longitudRegistro: longitudRegistroLocal,
                    campoMultiple: campoMultipleLocal
                  };
                } else if (modoParseoLocal === 'delimitado') {
                  return {
                    delimitador: delimitador,
                    separador: separador,
                    segmentosFijos: [],
                    camposUnir: modo === 'unir' ? camposManual : [],
                    longitudRegistro: 0,
                    campoMultiple: { nombreObjeto: '', nombreArray: '', cantidadMinima: 1, subcampos: [] }
                  };
                } else {
                  return {
                    delimitador: delimitador,
                    separador: separador,
                    segmentosFijos: segmentosFijosLocal,
                    camposUnir: camposManual,
                    longitudRegistro: longitudRegistroLocal,
                    campoMultiple: campoMultipleLocal
                  };
                }
              };

              const camposLimpios = limpiarSegunModo();

              onGuardar(
                nuevoLabel,
                modo,
                entrada,
                salida,
                modoParseoLocal,
                camposLimpios.delimitador,
                camposLimpios.separador,
                camposLimpios.segmentosFijos,
                camposLimpios.camposUnir,
                modo === 'descomponer'
                  ? (modoParseoLocal === 'plano'
                      ? expandirCamposConRepeticiones(segmentosFijosLocal)
                      : modoParseoLocal === 'bloques_repetidos'
                        ? crearCampoBloquesRepetidos()
                        : camposDetectados)
                  : [{ nombre: salida, tipo: 'string' }],
                codificacionLocal,
                prefijoFinal,
                sufijoFinal,
                camposLimpios.longitudRegistro,
                camposLimpios.campoMultiple
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