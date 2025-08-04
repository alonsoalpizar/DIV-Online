import { useState, useEffect } from "react";
import jsep from "jsep";
import {
  obtenerFuncionesGlobales,
  FuncionGlobal,
} from "../utils/funcionesGlobales";
import AyudaFuncionTabla from "../components/Callouts/AyudaFuncionTabla";
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
              <div key={i} style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
                {i > 0 && (
                  <select
                    value={c.union}
                    onChange={(e) =>
                      actualizarCondicion(i, {
                        union: e.target.value as "AND" | "OR",
                      })
                    }
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                )}
                <select
                  value={c.campo}
                  onChange={(e) => actualizarCondicion(i, { campo: e.target.value })}
                >
                  <option value="">(Campo)</option>
                  {parametrosEntrada.map((campo) => (
                    <option key={campo.nombre} value={campo.nombre}>
                      {campo.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={c.operador}
                  onChange={(e) => actualizarCondicion(i, { operador: e.target.value })}
                >
                  {operadores.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <input
                  value={c.valor}
                  onChange={(e) => actualizarCondicion(i, { valor: e.target.value })}
                  placeholder="valor"
                />
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
            <>
              <textarea
                value={textoLibre}
                onChange={(e) => setTextoLibre(e.target.value)}
                rows={4}
                style={{
                  width: "100%", marginTop: 5,
                  borderColor: esCondicionValida(textoLibre) ? "green" : "red",
                }}
                placeholder="Ej: Entrada.Valor > 100 && Entrada.Estado == 'OK'"
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
                  {textoLibre}
                </div>
              </div>
            </>
          )}
        </div>

        {modoAvanzado && funcionesGlobales.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <strong>Funciones del sistema y tablas:</strong>
            <ul style={{
              listStyle: "none", paddingLeft: 0, fontSize: "0.9em", maxHeight: 200, overflowY: "auto",
            }}>
              {funcionesGlobales.map((f, i) => (
                <li key={i} title={f.descripcion} onClick={() => {
                  setTextoLibre((prev) =>
                    prev.trim()
                      ? prev.trimEnd() + "\n" + (f.ejemplo || f.nombre + "()")
                      : f.ejemplo || f.nombre + "()"
                  );
                }} style={{
                  background: f.origen === "tabla" ? "#fff7e6" : "#e6f2ff",
                  border: "1px solid #ccc", borderRadius: 4,
                  padding: "6px 8px", marginBottom: 6,
                  fontFamily: "monospace", cursor: "pointer",
                }}>
                  <code style={{ fontWeight: 600 }}>{f.nombre}</code>
                  <span style={{ marginLeft: 8, color: "#555" }}>{f.descripcion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
