// src/nodos/NodoSalidaError.tsx
import { Handle, Position } from 'reactflow';

const NodoSalidaError = ({ data }: any) => {
  return (
    <div
      style={{
        backgroundColor: '#fccfcfff',
        border: '2px solid #e53935',
        borderRadius: '50%',
        width: 100,
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#b71c1c',
        fontWeight: 600,
        fontSize: '14px',
        position: 'relative',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={Position.Left} isValidConnection={(conn) => conn.sourceHandle !== 'salidaOk'}/>
      <div style={{ pointerEvents: 'none', padding: '0 10px' }}>
        ❌ {data.label || 'Salida Error'}
      </div>
      {/* Este nodo no tiene handle de salida */}
    </div>
  );
};

export default NodoSalidaError;
