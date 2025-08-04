import { Handle, Position } from 'reactflow';

interface ProcesoData {
  label: string;
}

const NodoProceso = ({ data }: { data: ProcesoData }) => {
  return (
    <div
      style={{
        backgroundColor: '#cce8ff',
        border: '2px solid #3399ff',
        padding: '20px',
        borderRadius: '50px',
        textAlign: 'center',
        minWidth: '180px',
        position: 'relative',
        fontWeight: 'bold'
      }}
    >
      {/* Conector de entrada */}
      
      
      <Handle type="target" position={Position.Left} id="leftA" style={{ top: '35%', background: 'blue' }} />

      <Handle type="target" position={Position.Left} id="leftB" style={{ top: '65%', background: 'blue' }} />


      
      {data.label}

      {/* Conector de salida OK */}
      <Handle
        type="source"
        position={Position.Right}
        id="ok"
        style={{ top: '35%', background: 'green' }}
      />

      {/* Conector de error */}
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        style={{ top: '65%', background: 'red' }}
      />
    </div>
  );
};

export default NodoProceso;
