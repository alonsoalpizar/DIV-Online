import React, { useState, useEffect } from 'react';
import AyudaFuncionTabla from '../components/Callouts/AyudaFuncionTabla';
import { obtenerFuncionesGlobales, FuncionGlobal } from '../utils/funcionesGlobales';
import { getApiBase } from '../utils/configuracion';


// --- Tipos de datos ---
interface Campo {
  nombre: string;
  tipo: string;
  asignacion?: {
    tipo: '' | 'literal' | 'sistema' | 'tabla';
    valor: string;
    tabla?: string;
    campoResultado?: string;
    valorEsCampo?: boolean;
  };
}

interface Tabla {
  nombre: string;
  campos: { nombre: string; tipo: string }[];
}

interface Props {
  label: string;
  campos: Campo[];
  onGuardar: (nuevoLabel: string, nuevosCampos: Campo[], parametrosSalida: Campo[]) => void;
  onCancelar: () => void;
}

// --- Componente principal ---
const EditorEntrada: React.FC<Props> = ({ label, campos, onGuardar, onCancelar }) => {
  // --- Estados locales ---
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [camposLocal, setCamposLocal] = useState<Campo[]>(campos || []);
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [funcionesSistema, setFuncionesSistema] = useState<FuncionGlobal[]>([]);

  // --- Carga de tablas y funciones de sistema ---
  useEffect(() => {
    fetch(`${getApiBase()}/tablas`)
      .then(res => res.json())
      .then(data => setTablas(data))
      .catch(err => console.warn('No se pudieron cargar tablas', err));

    obtenerFuncionesGlobales().then(funcs => {
      setFuncionesSistema(funcs.filter(f => f.origen === 'estatica'));
    });
  }, []);

  // --- Actualiza un campo específico ---
  const actualizarCampo = (index: number, cambios: Partial<Campo>) => {
    const nuevos = [...camposLocal];
    nuevos[index] = { ...nuevos[index], ...cambios };
    setCamposLocal(nuevos);
  };

  // --- Actualiza la asignación de un campo específico ---
  const actualizarAsignacion = (index: number, cambios: Partial<Campo['asignacion']>) => {
    const nuevos = [...camposLocal];
    const prev = nuevos[index].asignacion || { tipo: '', valor: '' };
    nuevos[index].asignacion = { ...prev, ...cambios };
    setCamposLocal(nuevos);
  };

  // --- Obtiene los campos de una tabla seleccionada ---
  const obtenerCamposDeTabla = (nombreTabla: string | undefined) => {
    if (!nombreTabla) return [];
    const tabla = tablas.find(t => t.nombre === nombreTabla);
    return tabla?.campos || [];
  };

  // --- Agrega un nuevo campo ---
  const agregarCampo = () => {
    setCamposLocal([...camposLocal, { nombre: '', tipo: 'string' }]);
  };

  // --- Elimina un campo por índice ---
  const eliminarCampo = (index: number) => {
    setCamposLocal(camposLocal.filter((_, i) => i !== index));
  };

  // --- Guarda los cambios, validando duplicados y campos incompletos ---
  const guardar = () => {
    // Validar campos incompletos
    const hayInvalidos = camposLocal.some(c => !c.nombre || !c.tipo);
    if (!nuevoLabel.trim() || hayInvalidos) {
      alert('⚠️ Verifique que el nombre del nodo y todos los campos estén completos.');
      return;
    }

    // Validar duplicados en nombres de campos
    const nombres = camposLocal.map(c => c.nombre.trim());
    const nombresSet = new Set<string>();
    const duplicado = nombres.some(n => {
      if (nombresSet.has(n)) return true;
      nombresSet.add(n);
      return false;
    });
    if (duplicado) {
      alert('⚠️ No puede haber campos con el mismo nombre.');
      return;
    }

    // Reflejar también en parametrosSalida para compatibilidad con edges
    const salida = camposLocal.map(({ nombre, tipo }) => ({ nombre, tipo }));
    onGuardar(nuevoLabel.trim(), camposLocal, salida);
  };

  // --- Render ---
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 20,
          borderRadius: 8,
          width: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 10px rgba(0,0,0,0.4)'
        }}
      >
        <h3>Editar Nodo de Entrada</h3>
        <label>Nombre del nodo:</label>
        <input
          value={nuevoLabel}
          onChange={e => setNuevoLabel(e.target.value)}
          style={{ width: '100%', marginBottom: '10px' }}
        />

        <h4>Campos esperados:</h4>
        {camposLocal.map((campo, i) => {
          const camposTabla = obtenerCamposDeTabla(campo.asignacion?.tabla);

          return (
            <div
              key={i}
              style={{
                marginBottom: '10px',
                padding: '10px',
                border: '1px solid #eee',
                borderRadius: 4
              }}
            >
              {/* Nombre y tipo del campo */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <input
                  value={campo.nombre}
                  onChange={e => actualizarCampo(i, { nombre: e.target.value })}
                  placeholder="Nombre del campo"
                  style={{ flex: 1 }}
                />
                <select
                  value={campo.tipo}
                  onChange={e => actualizarCampo(i, { tipo: e.target.value })}
                >
                  <option value="string">string</option>
                  <option value="int">int</option>
                  <option value="float">float</option>
                  <option value="boolean">boolean</option>
                  <option value="date">date</option>
                  <option value="datetime">datetime</option>
                </select>
                <button onClick={() => eliminarCampo(i)}>❌</button>
              </div>

              {/* Asignación del campo */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={campo.asignacion?.tipo || ''}
                  onChange={e =>
                    actualizarAsignacion(i, {
                      tipo: e.target.value as any,
                      valor: '',
                      campoResultado: ''
                    })
                  }
                >
                  <option value="">🚫 Sin asignar</option>
                  <option value="literal">✍️ Literal</option>
                  <option value="sistema">⚙️ Sistema</option>
                  <option value="tabla">📊 Tabla</option>
                </select>

                {/* Asignación tipo literal */}
                {campo.asignacion?.tipo === 'literal' && (
                  <input
                    value={campo.asignacion?.valor || ''}
                    placeholder="Valor"
                    onChange={e => actualizarAsignacion(i, { valor: e.target.value })}
                    style={{ flex: 1 }}
                  />
                )}

                {/* Asignación tipo sistema */}
                {campo.asignacion?.tipo === 'sistema' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <input
                      placeholder="Ej: Ahora()"
                      value={campo.asignacion?.valor || ''}
                      onChange={e => actualizarAsignacion(i, { valor: e.target.value })}
                    />
                    <select
                      onChange={e => {
                        const func = funcionesSistema.find(f => f.nombre === e.target.value);
                        if (func) {
                          actualizarAsignacion(i, { valor: func.ejemplo || `${func.nombre}()` });
                        }
                      }}
                      defaultValue=""
                      style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '0.9em'
                      }}
                    >
                      <option value="">🧠 Elegir función de sistema...</option>
                      {funcionesSistema.map((f, idx) => (
                        <option key={f.nombre + '-' + idx} value={f.nombre}>
                          {f.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Asignación tipo tabla */}
                {campo.asignacion?.tipo === 'tabla' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <select
                      value={campo.asignacion?.tabla || ''}
                      onChange={e =>
                        actualizarAsignacion(i, { tabla: e.target.value, campoResultado: '' })
                      }
                    >
                      <option value="">-- Seleccione tabla --</option>
                      {tablas.map((t, idx) => (
                        <option key={t.nombre + '-' + idx} value={t.nombre}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder='Clave (ej: "00" o Cliente.ID)'
                      value={campo.asignacion?.valor || ''}
                      onChange={e => actualizarAsignacion(i, { valor: e.target.value })}
                    />
                    <select
                      value={campo.asignacion?.campoResultado || ''}
                      onChange={e => actualizarAsignacion(i, { campoResultado: e.target.value })}
                    >
                      <option value="">-- Seleccione campo resultado --</option>
                      {camposTabla.map((c, idx) => (
                        <option key={c.nombre + '-' + idx} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.85em', color: '#555' }}>
                      Vista previa:{' '}
                      <code>
                        Tabla("{campo.asignacion?.tabla}", {campo.asignacion?.valor})
                        .{campo.asignacion?.campoResultado}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Botón para agregar campo */}
        <button onClick={agregarCampo}>➕ Agregar campo</button>

        {/* Botones de acción */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={guardar}>💾 Guardar</button>
          <button onClick={onCancelar}>Cancelar</button>
        </div>

        {/* Ayuda contextual */}
        <div style={{ marginTop: 30 }}>
          <AyudaFuncionTabla />
        </div>
      </div>
    </div>
  );
};

export default EditorEntrada;