import { useState } from "react";
import type { Campo } from "../types/campo";

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

const EditorCondicion: React.FC<Props> = ({
  label,
  condicion,
  parametrosEntrada: iniciales,
  onGuardar,
  onCancelar,
}) => {
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [nuevaCondicion, setNuevaCondicion] = useState(condicion);
  const [parametrosEntrada, setParametrosEntrada] = useState<Campo[]>(iniciales || []);

  const agregarCampo = () => {
    setParametrosEntrada([...parametrosEntrada, { nombre: "", tipo: "string" }]);
  };

  const actualizarCampo = (index: number, campo: Partial<Campo>) => {
    const copia = [...parametrosEntrada];
    copia[index] = { ...copia[index], ...campo };
    setParametrosEntrada(copia);
  };

  const eliminarCampo = (index: number) => {
    const copia = [...parametrosEntrada];
    copia.splice(index, 1);
    setParametrosEntrada(copia);
  };

  const guardar = () => {
    onGuardar({
      label: nuevoLabel,
      condicion: nuevaCondicion,
      parametrosEntrada,
      parametrosSalida: [{ nombre: "resultado", tipo: "boolean" }],
      parametrosError: [
        { nombre: "codigoError", tipo: "int" },
        { nombre: "mensajeError", tipo: "string" },
        { nombre: "detalleError", tipo: "string" },
      ],
    });
  };

  return (
  <div
    style={{
      position: "fixed",
      top: "10%",
      left: "50%",
      transform: "translateX(-50%)",
      background: "white",
      padding: 20,
      zIndex: 1000,
      borderRadius: 8,
      boxShadow: "0 0 10px rgba(0,0,0,0.4)",
      minWidth: 400,
    }}
  >
    <h3>Editar Nodo de Condición</h3>

    <label>Label:</label>
    <input
      value={nuevoLabel}
      onChange={(e) => setNuevoLabel(e.target.value)}
      style={{ width: "100%", marginBottom: 10 }}
    />

    <label>Condición:</label>
    <textarea
      value={nuevaCondicion}
      onChange={(e) => setNuevaCondicion(e.target.value)}
      rows={3}
      style={{ width: "100%", marginBottom: 10 }}
    />

    <h4>Campos de Entrada</h4>
    {parametrosEntrada.map((campo, index) => (
      <div key={index} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
        <input
          value={campo.nombre}
          onChange={(e) => actualizarCampo(index, { nombre: e.target.value })}
          placeholder="Nombre"
          style={{ flex: 1 }}
        />
        <select
          value={campo.tipo}
          onChange={(e) => actualizarCampo(index, { tipo: e.target.value })}
        >
          {tiposDisponibles.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        <button onClick={() => eliminarCampo(index)}>❌</button>
      </div>
    ))}



    <button onClick={agregarCampo}>➕ Agregar campo</button>
    
{/* Salida fija */}
<h4 style={{ marginTop: '20px' }}>Campo de Salida</h4>
<div style={{ fontStyle: 'italic', color: '#2b7a0b', marginBottom: '10px' }}>
  ✅ resultado: boolean (salida evaluada de la condición)
</div>

{/* Campos de error */}
<h4>Campos de Error (uso interno)</h4>
<ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.9em' }}>
  <li>❌ codigoError: int</li>
  <li>❌ mensajeError: string</li>
  <li>❌ detalleError: string</li>
</ul>

    <div style={{ marginTop: 20 }}>
      <button onClick={guardar} style={{ marginRight: 10 }}>
        💾 Guardar
      </button>
      <button onClick={onCancelar}>Cancelar</button>
    </div>
  </div>
);

};

export default EditorCondicion;
