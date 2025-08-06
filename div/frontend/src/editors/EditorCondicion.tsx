import { useState, useEffect } from "react";
import jsep from "jsep";
import AyudaFuncionTabla from "../components/Callouts/AyudaFuncionTabla";
import CampoConFunciones from "../components/CampoConFunciones";
import { obtenerFuncionesGlobales, FuncionGlobal } from "../utils/funcionesGlobales";
import type { Campo } from "../types/campo";

// --- Operadores permitidos ---
const operadores = [
  "==", "!=", ">", "<", ">=", "<=",
  "incluye", "empiezaCon", "terminaCon",
];

interface CondicionCompuesta {
  campo: string;
  operador: string;
  valor: string;
  union?: "AND" | "OR";
}

interface Props {
  label: string;
  condicion: string;
  parametrosEntrada: Campo[];
  onGuardar: (data: {
    label: string;
    condicion: string;
    parametrosEntrada: Campo[];
    parametrosSalida: Campo[];
    parametrosError: Campo[];
  }) => void;
  onCancelar: () => void;
}

const tiposDisponibles = ["string", "int", "float", "boolean"];

const esCondicionValida = (texto: string): boolean => {
  if (!texto.trim()) return false;
  try {
    jsep(texto);
    return true;
  } catch {
    return false;
  }
};

const EditorCondicion: React.FC<Props> = ({
  label,
  condicion,
  parametrosEntrada: iniciales,
  onGuardar,
  onCancelar,
}) => {
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [textoLibre, setTextoLibre] = useState(condicion || "");
  const [modoAvanzado, setModoAvanzado] = useState(false);
  const [parametrosEntrada, setParametrosEntrada] = useState<Campo[]>(iniciales || []);
  const [condiciones, setCondiciones] = useState<CondicionCompuesta[]>([]);
  const [funcionesGlobales, setFuncionesGlobales] = useState<FuncionGlobal[]>([]);
  
  useEffect(() => {
    if (condicion) {
      setTextoLibre(condicion);
      const esCompleja = condicion.includes("&&") || condicion.includes("||");
      setModoAvanzado(esCompleja);
    }
  }, [condicion]);

  useEffect(() => {
    obtenerFuncionesGlobales().then(setFuncionesGlobales);
  }, []);

  const agregarCondicion = () => {
    setCondiciones((prev) => [
      ...prev,
      {
        campo: "",
        operador: "==",
        valor: "",
        union: prev.length > 0 ? "AND" : undefined,
      },
    ]);
  };

  const actualizarCondicion = (
    index: number,
    campo: Partial<CondicionCompuesta>
  ) => {
    const copia = [...condiciones];
    copia[index] = { ...copia[index], ...campo };
    setCondiciones(copia);
  };

  const eliminarCondicion = (index: number) => {
    const copia = [...condiciones];
    copia.splice(index, 1);
    setCondiciones(copia);
  };

  const generarCondicionFinal = (): string => {
    return condiciones
      .map((c) => {
        let expr = "";
        switch (c.operador) {
          case "incluye":
            expr = `${c.campo}.includes('${c.valor}')`;
            break;
          case "empiezaCon":
            expr = `${c.campo}.startsWith('${c.valor}')`;
            break;
          case "terminaCon":
            expr = `${c.campo}.endsWith('${c.valor}')`;
            break;
          default:
            let valor = c.valor;
            if (isNaN(Number(valor))) {
              valor = `'${valor.replace(/'/g, "\\'")}'`;
            }
            expr = `${c.campo} ${c.operador} ${valor}`;
        }
        return c.union ? `${c.union} ${expr}` : expr;
      })
      .join(" ");
  };

  const agregarCampoEntrada = () => {
    setParametrosEntrada([...parametrosEntrada, { nombre: "", tipo: "string" }]);
  };

  const actualizarCampoEntrada = (index: number, campo: Partial<Campo>) => {
    const copia = [...parametrosEntrada];
    copia[index] = { ...copia[index], ...campo };
    setParametrosEntrada(copia);
  };

  const eliminarCampoEntrada = (index: number) => {
    const copia = [...parametrosEntrada];
    copia.splice(index, 1);
    setParametrosEntrada(copia);
  };

  const guardar = () => {
    const finalCondicion = modoAvanzado
      ? textoLibre.trim()
      : generarCondicionFinal().trim();

    if (!nuevoLabel) {
      alert("Debe ingresar un label válido.");
      return;
    }

    if (!finalCondicion) {
      alert("Debe definir una condición válida.");
      return;
    }

    if (modoAvanzado && !esCondicionValida(finalCondicion)) {
      alert("La condición tiene errores de sintaxis.");
      return;
    }

    onGuardar({
      label: nuevoLabel,
      condicion: finalCondicion,
      parametrosEntrada,
      parametrosSalida: [{ nombre: "cumple", tipo: "boolean" }],
      parametrosError: [
        { nombre: "codigoError", tipo: "int" },
        { nombre: "mensajeError", tipo: "string" },
        { nombre: "detalleError", tipo: "string" },
      ],
    });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        minWidth: "600px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      }}>
        <h3>Editar Nodo de Condición</h3>

        <label>Label:</label>
        <input
          value={nuevoLabel}
          onChange={(e) => setNuevoLabel(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        {/* Campos de Entrada */}
        <h4>Campos de Entrada</h4>
        {parametrosEntrada.map((campo, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
            <input
              value={campo.nombre}
              onChange={(e) => actualizarCampoEntrada(i, { nombre: e.target.value })}
              placeholder="Nombre"
              style={{ flex: 1 }}
            />
            <select
              value={campo.tipo}
              onChange={(e) => actualizarCampoEntrada(i, { tipo: e.target.value })}
            >
              {tiposDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <button onClick={() => eliminarCampoEntrada(i)}>❌</button>
          </div>
        ))}
        <button onClick={agregarCampoEntrada}>➕ Agregar campo</button>

        {/* Condiciones */}
        {!modoAvanzado && (
          <>
            <h4 style={{ marginTop: "20px" }}>Condiciones Guiadas</h4>
            {condiciones.map((c, i) => (
              <div key={i} style={{ 
                display: "flex", 
                gap: "10px", 
                marginBottom: "15px", 
                alignItems: "flex-start",
                flexWrap: "wrap"
              }}>
                {i > 0 && (
                  <select
                    value={c.union}
                    onChange={(e) =>
                      actualizarCondicion(i, {
                        union: e.target.value as "AND" | "OR",
                      })
                    }
                    style={{ 
                      padding: "8px", 
                      border: "1px solid #ccc", 
                      borderRadius: "4px",
                      minWidth: "70px"
                    }}
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                )}
                <div style={{ position: 'relative', flex: 1 }}>
                  <div>
                    <select
                      value={
                        // Si es un campo que existe o una función conocida, usar el valor
                        parametrosEntrada.find(p => p.nombre === c.campo) ? c.campo :
                        funcionesGlobales.find(f => {
                          const nombreBase = f.nombre.includes('(') ? f.nombre.split('(')[0] : f.nombre;
                          return `${nombreBase}()` === c.campo;
                        }) ? c.campo :
                        c.campo === '__USAR_TABLA__' ? c.campo : 
                        c.campo && c.campo.length > 0 ? '' : c.campo  // Si hay algo no reconocido, mostrar vacío
                      }
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor === '__USAR_TABLA__') {
                          // Marcamos para mostrar el selector de función tabla
                          actualizarCondicion(i, { campo: '__USAR_TABLA__' });
                        } else {
                          actualizarCondicion(i, { campo: valor });
                        }
                      }}
                      style={{ 
                        width: '100%',
                        padding: "8px", 
                        border: "1px solid #ccc", 
                        borderRadius: "4px"
                      }}
                    >
                      <option value="">(Seleccionar)</option>
                      <optgroup label="📝 Campos">
                        {parametrosEntrada.map((campo) => (
                          <option key={campo.nombre} value={campo.nombre}>
                            {campo.nombre} ({campo.tipo})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🔧 Funciones del Sistema">
                        {funcionesGlobales.filter(f => f.origen === 'estatica').map((funcion) => {
                          const nombreBase = funcion.nombre.includes('(') ? funcion.nombre.split('(')[0] : funcion.nombre;
                          const textoFuncion = `${nombreBase}()`;
                          return (
                            <option key={funcion.nombre} value={textoFuncion}>
                              {textoFuncion} - {funcion.descripcion}
                            </option>
                          );
                        })}
                        <option value="__USAR_TABLA__">📊 Usar función Tabla()...</option>
                      </optgroup>
                    </select>
                    
                    {/* Mostrar valor actual si es función personalizada */}
                    {c.campo && c.campo !== '__USAR_TABLA__' && 
                     !parametrosEntrada.find(p => p.nombre === c.campo) &&
                     !funcionesGlobales.find(f => {
                       const nombreBase = f.nombre.includes('(') ? f.nombre.split('(')[0] : f.nombre;
                       return `${nombreBase}()` === c.campo;
                     }) && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#666', 
                        marginTop: '2px',
                        fontStyle: 'italic'
                      }}>
                        💡 Función personalizada: {c.campo}
                      </div>
                    )}
                  </div>
                  {c.campo === '__USAR_TABLA__' && (
                    <div style={{ marginTop: '5px' }}>
                      <CampoConFunciones
                        label=""
                        value={c.campo === '__USAR_TABLA__' ? '' : c.campo}
                        onChange={(nuevoCampo) => actualizarCondicion(i, { campo: nuevoCampo })}
                        placeholder="Usar función o escribir manualmente"
                        mostrarFunciones={true}
                        categoriaFunciones="todas"
                        validarSintaxis={false}
                        camposDisponibles={parametrosEntrada}
                      />
                    </div>
                  )}
                </div>
                <select
                  value={c.operador}
                  onChange={(e) => actualizarCondicion(i, { operador: e.target.value })}
                  style={{ 
                    padding: "8px", 
                    border: "1px solid #ccc", 
                    borderRadius: "4px",
                    minWidth: "120px"
                  }}
                >
                  {operadores.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <div style={{ position: 'relative', flex: 1 }}>
                  <CampoConFunciones
                    label=""
                    value={c.valor}
                    onChange={(nuevoValor) => actualizarCondicion(i, { valor: nuevoValor })}
                    placeholder="valor o función"
                    mostrarFunciones={true}
                    categoriaFunciones="todas"
                    validarSintaxis={false}
                    camposDisponibles={parametrosEntrada}
                  />
                </div>
                <button onClick={() => eliminarCondicion(i)}>❌</button>
              </div>
            ))}
            <button onClick={agregarCondicion}>➕ Agregar condición</button>
            <div style={{ marginTop: 10 }}>
              <strong>Vista previa actual:</strong>
              <div style={{
                background: "#f3f3f3",
                padding: 5,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}>
                {condiciones.length > 0 ? generarCondicionFinal() : condicion}
              </div>
            </div>
          </>
        )}

        {/* Editor manual */}
        <div style={{ marginTop: 20 }}>
          <label>
            <input
              type="checkbox"
              checked={modoAvanzado}
              onChange={(e) => setModoAvanzado(e.target.checked)}
            /> Usar editor manual (avanzado)
          </label>
          {modoAvanzado && (
            <div style={{ marginTop: 10 }}>
              <CampoConFunciones
                label="Condición Avanzada"
                value={textoLibre}
                onChange={setTextoLibre}
                placeholder="Ej: Entrada.Valor > 100 && Entrada.Estado == 'OK' || Ahora() > '2025-01-01'"
                multiline={true}
                rows={4}
                mostrarFunciones={true}
                categoriaFunciones="todas"
                validarSintaxis={false}
                camposDisponibles={parametrosEntrada}
              />
              <div style={{ marginTop: 10 }}>
                <strong>Vista previa:</strong>
                <div style={{
                  background: "#f3f3f3", padding: 5,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  color: esCondicionValida(textoLibre) ? "green" : "red",
                }}>
                  {textoLibre || "Escribe tu condición aquí..."}
                </div>
                {!esCondicionValida(textoLibre) && textoLibre && (
                  <div style={{ color: "red", fontSize: "12px", marginTop: 5 }}>
                    ⚠️ Sintaxis inválida - verifica la condición
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {modoAvanzado && <AyudaFuncionTabla />}

        {/* Salida y errores */}
        <h4 style={{ marginTop: 20 }}>Campo de Salida</h4>
        <div style={{ fontStyle: "italic", color: "#2b7a0b" }}>
          ✅ cumple: boolean (salida evaluada de la condición)
        </div>

        <h4>Campos de Error</h4>
        <ul style={{ listStyle: "none", paddingLeft: 0, fontSize: "0.9em" }}>
          <li>❌ codigoError: int</li>
          <li>❌ mensajeError: string</li>
          <li>❌ detalleError: string</li>
        </ul>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
          <button onClick={guardar}>💾 Guardar</button>
          <button onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default EditorCondicion;
