import { Canal } from '../types/canal';
import { useNavigate } from 'react-router-dom';
/* import { ayudaTooltip} from '../components/AyudaTooltip'; */
import ayudaTooltip from '../components/AyudaTooltip';


interface Props {
  canales: Canal[];
  onEditar: (canal: Canal) => void;
  onEliminar: (id: string) => void;
  onAsignar: (canal: Canal) => void;
}

const CanalList: React.FC<Props> = ({ canales, onEditar, onEliminar, onAsignar }) => {
  const navigate = useNavigate();

  if (canales.length === 0) {
    return <p>No hay canales registrados.</p>;
  }

  return (
    <div className="card">
      <h3>Listado de Canales</h3>
      <table>
        <thead>
  <tr>
    <th>Código</th>
    <th>Nombre</th>
    <th>Tipo</th>
    <th>Puerto</th>
    <th>Acciones</th>
  </tr>
</thead>

        <tbody>
          {canales.map(c => (
            <tr key={c.id}>
              <td>{c.codigo}</td>
              <td>{c.nombre}</td>
              <td>{c.tipoPublicacion}</td>
              <td>{c.puerto}</td>
              <td>
                <button onClick={() => onEditar(c)}>✏️</button>
                <button onClick={() => {
                  if (confirm(`Borrar canal "${c.nombre}"?`)) {
                    onEliminar(c.id);
                  }
                }}>🗑️</button>
                <button onClick={() => onAsignar(c)}>⚙️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CanalList;
