// src/nodos/NodoCondicion.tsx
//import React from 'react';
import { Handle, Position } from 'reactflow';

const NodoCondicion = ({ data }: any) => {
  return (
    <div
      style={{
        backgroundColor: '#ffece5ff',//#ffe5e5
        border: '2px solid #ff6e4dff',
        borderRadius: '8px',
        padding: '10px 12px',
        width: 140,
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        fontSize: '13px',
        fontWeight: 600,
        position: 'relative',
        color: '#a15b00ff',
      }}
    >
      <div style={{ fontSize: '1.1em' }}>
        🔶 {data.label || 'Condición'}
      </div>

      {/* Entrada - izquierda */}
      <Handle
        type="target"
        id="entrada"
        position={Position.Left}
        style={{ background: 'gray' }}
      />

    <Handle
  type="source"
  id="true"
  position={Position.Right}
  style={{ background: 'green' }}
/>

<Handle
  type="source"
  id="false"
  position={Position.Bottom}
  style={{ background: 'red' }}
/>

    </div>
  );
};

export default NodoCondicion;
