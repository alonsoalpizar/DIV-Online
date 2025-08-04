import React from "react";
import { Handle, Position } from "reactflow";

interface Props {
  data: {
    label: string;
    modoOperacion: "descomponer" | "unir";
  };
}

const NodoSplitter: React.FC<Props> = ({ data }) => {
  const esUnir = data.modoOperacion === "unir";

  const backgroundColor = esUnir ? "#e0f7ec" : "#fff7e6";
  const borderColor = esUnir ? "#10b981" : "#facc15";
  const textoColor = esUnir ? "#065f46" : "#a16207";
  const icono = esUnir ? "🔁" : "✂️";

  return (
    <div
      style={{
        background: backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "10px 12px",
        minWidth: 150,
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontSize: "13px",
        fontWeight: 500,
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ fontSize: "1.2em" }}>
        {icono} {data.label}
      </div>
      <div style={{ fontSize: "0.85em", color: textoColor }}>
        {esUnir ? "Unir campos" : "Descomponer trama"}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default NodoSplitter;
