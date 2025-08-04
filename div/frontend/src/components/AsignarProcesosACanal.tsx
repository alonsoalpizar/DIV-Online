import { useEffect, useState } from 'react';
import axios from 'axios';
import { Proceso } from '../types/proceso';
import { Canal } from '../types/canal';
import { CanalProceso } from '../types/canalProceso';
import { getApiBase } from '../utils/configuracion';



  interface Props {
  canal: Canal | null;
  onCancelar: () => void;
  onAsignar?: (
    asignaciones: { canalId: string; procesoId: string; trigger: string }[]
  ) => Promise<void>;
}


const AsignarProcesosACanal: React.FC<Props> = ({ canal, onCancelar, onAsignar }) => {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [asignados, setAsignados] = useState<CanalProceso[]>([]);
  const [triggers, setTriggers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canal) return;

    axios.get(`${getApiBase()}/procesos`) 
      .then(res => setProcesos(res.data))
      .catch(err => console.error('Error al cargar procesos:', err));

    axios.get(`${getApiBase()}/canal-procesos/${canal.id}`)
      .then(res => setAsignados(res.data))
      .catch(err => console.error('Error al cargar asignaciones:', err))
      .finally(() => setLoading(false));
  }, [canal]);

const handleAsignar = async (procesoId: string) => {
  const trigger = triggers[procesoId];
  if (!trigger || !canal) {
    alert('Todos los campos son obligatorios');
    return;
  }

  const nuevaAsignacion = {
    canalId: canal.id,
    procesoId,
    trigger,
  };

  try {
    if (onAsignar) {
      // usar la función externa pasada desde Canales.tsx
      await onAsignar([nuevaAsignacion]);
    } else {
      // lógica por defecto (autónoma)
      await axios.post(`${getApiBase()}/canal-procesos`, nuevaAsignacion);
    }

    setTriggers({ ...triggers, [procesoId]: '' });
    const res = await axios.get(`${getApiBase()}/canal-procesos/${canal.id}`);
    setAsignados(res.data);
  } catch (err) {
    console.error('Ocurrió un error al asignar el proceso:', err);
    alert("Error al asignar el proceso.");
  }
};



  const handleDesasignar = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/canal-procesos/${id}`);
      const res = await axios.get(`${getApiBase()}/canal-procesos/${canal?.id}`);
      setAsignados(res.data);
    } catch (err) {
      console.error('Error al desasignar proceso:', err);
    }
  };

  const handleEditarTrigger = async (id: string, nuevoTrigger: string) => {
    try {
      await axios.put(`${getApiBase()}/canal-procesos/${id}`, {
        trigger: nuevoTrigger,
      });
      const res = await axios.get(`${getApiBase()}/canal-procesos/${canal?.id}`);
      setAsignados(res.data);
    } catch (err) {
      console.error('Error al actualizar trigger:', err);
    }
  };

  if (!canal) {
    return <p style={{ color: 'red' }}>Error: No se ha proporcionado un canal válido.</p>;
  }

  const procesosDisponibles = procesos.filter(
    p => !asignados.some(a => a.procesoId === p.id)
  );

  return (
    <div className="card">
      <h3>Asignación de Procesos a Canal: <strong>{canal.nombre}</strong></h3>

      <div className="form-grid">
        <h4>Procesos Disponibles</h4>
        {procesosDisponibles.map((p) => (
          <div key={p.id} className="asignacion-row">
            <span>{p.nombre}</span>
            <input
              type="text"
              value={triggers[p.id] || ''}
              onChange={(e) => setTriggers({ ...triggers, [p.id]: e.target.value })}
              placeholder={
                canal.tipoPublicacion === 'REST' ? '/ruta|POST' :
                canal.tipoPublicacion === 'SOAP' ? 'soapAction' : 'evento'
              }
            />
            <button onClick={() => handleAsignar(p.id)}>Asignar</button>
          </div>
        ))}

        <h4>Procesos Asignados</h4>
        {asignados.map(a => (
          <div key={a.id} className="asignado-row">
            <span>{a.proceso?.nombre}</span>
            <input
              type="text"
              value={a.trigger}
              onChange={(e) => {
                const updated = asignados.map(item =>
                  item.id === a.id ? { ...item, trigger: e.target.value } : item
                );
                setAsignados(updated);
              }}
              onBlur={(e) => handleEditarTrigger(a.id, e.target.value)}
            />

            <button onClick={() => handleDesasignar(a.id)}>Desasignar</button>
          </div>
        ))}

        <div className="callout">
          {canal.tipoPublicacion === 'REST' && (
            <p><strong>REST:</strong> Usa el formato <code>/ruta|METODO</code>, por ejemplo <code>/api/ejecutar|POST</code></p>
          )}

          {canal.tipoPublicacion === 'SOAP' && (
            <p><strong>SOAP:</strong> Define el <code>soapAction</code>, por ejemplo <code>procesarPago</code></p>
                      )}
                      
          {canal.tipoPublicacion === 'SIMPLE' && (
            <p>
              <strong>SIMPLE:</strong> Define un trigger como palabra clave (ej. <code>ConsultaRecibo</code>).<br />
              El cliente puede invocar este canal con:<br />
              <code>{'{ "trigger": "ConsultaRecibo", "data": {...} }'}</code><br />
              El backend interpretará y ejecutará el proceso correspondiente. Puedes definir también el formato esperado de data con <code>tipoData</code>.
            </p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button onClick={onCancelar}>Salir</button>
      </div>

      <style>{`
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        .asignacion-row, .asignado-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .asignacion-row input, .asignado-row input {
          flex: 1;
        }
        .form-actions {
          margin-top: 2rem;
        }
        .card {
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 1rem;
          background: #fdfdfd;
        }
        .callout {
          font-size: 0.9rem;
          color: #333;
          background: #eef5ff;
          padding: 0.5rem;
          border-left: 4px solid #3b82f6;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default AsignarProcesosACanal;
