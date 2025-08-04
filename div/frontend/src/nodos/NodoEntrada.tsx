import { Handle, NodeProps, Position } from 'reactflow';

const NodoEntrada: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{
      padding: 10,
      border: '2px solid #60a5fa',
      borderRadius: 10,
      background: '#eff6ff',textAlign: 'center',
      minWidth: 150
    }}>
      <strong>Entrada</strong>
      


      <Handle type="source" position={Position.Right} id="right" />

    </div>
  );
};

export default NodoEntrada;
