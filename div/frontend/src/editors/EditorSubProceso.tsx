import { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../utils/configuracion';


interface Campo {
  nombre: string;
  tipo: string;
}

interface Proceso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  flujo: string;
}

interface Props {
  label: string;
  procesoId: string;
  parametrosEntrada: Campo[];
  parametrosSalida: Campo[];
  onGuardar: (
    label: string,
    procesoId: string,
    entrada: Campo[],
    salida: Campo[],
    procesoNombre: string
  ) => void;
  onCancelar: () => void;
}

const EditorSubProceso: React.FC<Props> = ({
  label,
  procesoId,
  parametrosEntrada,
  parametrosSalida,
  onGuardar,
  onCancelar
}) => {
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [seleccionado, setSeleccionado] = useState<string>(procesoId);
  const [entrada, setEntrada] = useState<Campo[]>(parametrosEntrada);
  const [salida, setSalida] = useState<Campo[]>(parametrosSalida);
  const [procesoNombre, setProcesoNombre] = useState<string>('');

  useEffect(() => {
    axios.get(`${getApiBase()}/procesos`).then(res => {
      setProcesos(res.data);
    });
  }, []);

  useEffect(() => {
  const proceso = procesos.find(p => p.id === seleccionado);
  if (proceso) {
    setProcesoNombre(proceso.nombre);

    try {
      const flujo = JSON.parse(proceso.flujo);
      const nodoEntrada = flujo.nodes.find((n: any) => n.type === 'entrada');
      const nodoSalida = flujo.nodes.find((n: any) => n.type === 'salida');
      const nodoError = flujo.nodes.find((n: any) => n.type === 'salidaError');

      setEntrada(nodoEntrada?.data?.campos || []);

      // Combina ambas salidas
      const salidasCombinadas = [
        ...(nodoSalida?.data?.campos || []),
        ...(nodoError?.data?.campos?.map((c: any) => ({ ...c, esError: true })) || [])
      ];

      setSalida(salidasCombinadas);
    } catch (error) {
      console.error('Error al parsear el flujo del proceso:', error);
    }
  }
}, [seleccionado, procesos]);



  return (
    <div className="modal">
      <div className="modal-content" style={{ minWidth: '500px' }}>
        <h3>🔄 Editar Nodo SubProceso</h3>

        <label>Etiqueta: </label>
        <input value={nuevoLabel} onChange={e => setNuevoLabel(e.target.value)} />

    <div>
        <strong><label>Proceso Referencia:  </label></strong>
        <select
          value={seleccionado}
          onChange={e => setSeleccionado(e.target.value)}
        >
          <option value="">-- Seleccione un proceso --</option>
          {procesos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
</div>
        {seleccionado && (
          <>
          
<h4 style={{ marginTop: '20px', color: '#0366d6' }}>🟦 Parámetros de Entrada</h4>
<ul style={{ paddingLeft: '20px', fontSize: '0.9em' }}>
  {entrada.map((c, i) => (
    <li key={i}>• <strong>{c.nombre}</strong> : {c.tipo}</li>
  ))}
</ul>

<h4 style={{ marginTop: '20px', color: 'green' }}>🟩 Parámetros de Salida</h4>
<ul style={{ paddingLeft: '20px', fontSize: '0.9em' }}>
  {salida.filter(c => !['codigoError', 'mensajeError', 'detalleError'].includes(c.nombre)).map((c, i) => (
    <li key={i}>• <strong>{c.nombre}</strong> : {c.tipo}</li>
  ))}
</ul>

{salida.some(c => ['codigoError', 'mensajeError', 'detalleError'].includes(c.nombre)) && (
  <>
    <h4 style={{ marginTop: '20px', color: 'red' }}>🟥 Parámetros de Error</h4>
    <ul style={{ paddingLeft: '20px', fontSize: '0.9em' }}>
      {salida.filter(c => ['codigoError', 'mensajeError', 'detalleError'].includes(c.nombre)).map((c, i) => (
        <li key={i}>• <strong>{c.nombre}</strong> : {c.tipo}</li>
      ))}
    </ul>
  </>
)}


          </>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              console.log('Guardando:', { entrada, salida, procesoNombre });
              onGuardar(nuevoLabel, seleccionado, entrada, salida, procesoNombre);
            }}
            disabled={!seleccionado}
          >
            💾 Guardar
          </button>
          <button onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default EditorSubProceso;
