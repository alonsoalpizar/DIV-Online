import { Handle, Position } from 'reactflow';

const NodoSalida = ({ data }: any) => {
  return (
    <div className="nodo salida" style={{
      background: "#d1e7dd",
      border: "2px solid #0f5132",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "0.85em",
      minWidth: "160px",textAlign: 'center'
    }}>
      <strong>{data.label}</strong>

      {data.formatoSalida && (
        <div style={{ fontSize: "0.7em", marginTop: "4px", color: "#555" }}>
          🧾 Formato: <strong>{data.formatoSalida.toUpperCase()}</strong>
        </div>
      )}
      {data.tagPadre && (
        <div style={{ fontSize: "0.7em", color: "#777" }}>
          🏷️ Tag padre: <strong>{data.tagPadre}</strong>
        </div>
      )}

      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default NodoSalida;
