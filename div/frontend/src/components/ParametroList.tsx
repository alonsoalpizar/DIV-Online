import { Parametro } from '../types/parametro';

interface Props {
  parametros: Parametro[];
  onEditar: (parametro: Parametro) => void;
  onEliminar: (id: string) => void;
}

const ParametroList: React.FC<Props> = ({ parametros, onEditar, onEliminar }) => {
  if (parametros.length === 0) {
    return <p>No hay parámetros registrados.</p>;
  }

  return (
    <div className="card">
      <h3>Listado de Parámetros</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Valor</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {parametros.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.valor}</td>
              <td>{p.descripcion}</td>
              <td>
                <button onClick={() => onEditar(p)}>✏️</button>
                <button onClick={() => {
                  if (confirm(`¿Eliminar parámetro "${p.nombre}"?`)) {
                    onEliminar(p.id);
                  }
                }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParametroList;
