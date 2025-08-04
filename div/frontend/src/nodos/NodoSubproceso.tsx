
import { Handle, Position } from 'reactflow';

interface Props {
  data: {
    label: string;
    procesoId: string;
    procesoNombre?: string;
  };
}

const NodoSubproceso: React.FC<Props> = ({ data }) => {
  return (
    <div style={{
      border: '2px dashed #999',
      borderRadius: '12px',
      padding: '12px',
      backgroundColor: '#e0f2ff',
      minWidth: '220px',
      textAlign: 'center',
      boxShadow: '2px 2px 6px rgba(0,0,0,0.1)'
    }}>
      {/* Entrada */}
      
      
      <Handle type="target" position={Position.Left} id="leftA" style={{ top: '35%', background: 'blue' }} />

      <Handle type="target" position={Position.Left} id="leftB" style={{ top: '65%', background: 'blue' }} />

      {/* Título */}
      <div style={{ fontWeight: 'bold', fontSize: '1em', marginBottom: '4px' }}>
        🔁 SubProceso
      </div>

        <div style={{ fontSize: '0.9em', fontWeight: 600, color:'blue' }}>{data.label}</div>
       
      {/* Nombre del proceso padre */}
      <div style={{ fontSize: '0.75em' }}>Proceso Padre: 
        {data.procesoNombre || 'Proceso vinculado'}
      </div>

      {/* Pie de info */}
      {/* { <div style={{ fontSize: '0.7em', color: '#555', marginTop: '4px' }}>
        {data.procesoId}
      </div> } */}

      {/* Salida normal */}
      <Handle type="source" position={Position.Right} id="salida" style={{ background: 'green' }} />
      {/* Salida error */}
      <Handle type="source" position={Position.Bottom} id="salidaError" style={{ background: 'red' }} />
    </div>
  );
};

export default NodoSubproceso;
