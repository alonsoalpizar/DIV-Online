import { useNavigate } from 'react-router-dom';
import { Proceso } from '../types/proceso';

interface Props {
  procesos: Proceso[];
  onEditar: (proceso: Proceso) => void;
  onEliminar: (id: string) => void;
}

const ProcesoList: React.FC<Props> = ({ procesos, onEditar, onEliminar }) => {
  const navigate = useNavigate();

  if (procesos.length === 0) return <p>No hay procesos registrados.</p>;

  return (
    <div className="card">
      <h3>Listado de Procesos</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {procesos.map(p => (
            <tr key={p.id}>
              <td>{p.codigo}</td>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>
                <button onClick={() => onEditar(p)}>✏️</button>
                <button onClick={() => {
                  if (confirm(`¿Eliminar proceso "${p.nombre}"?`)) {
                    onEliminar(p.id);
                  }
                }}>🗑️</button>
                <button onClick={() => navigate(`/flujo/${p.id}`)}>🧩 Diseñar Flujo</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProcesoList;
