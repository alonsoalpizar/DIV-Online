import { Tabla } from '../types/tabla';

interface Props {
  tablas: Tabla[];
  onEditar: (tabla: Tabla) => void;
  onEliminar: (id: string) => void;
}

const TablaList: React.FC<Props> = ({ tablas, onEditar, onEliminar }) => {
  if (tablas.length === 0) return <p>No hay tablas registradas.</p>;

  return (
    <div className="card">
      <h3>Listado de Tablas</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Campos</th>
            <th>Registros</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tablas.map(t => (
            <tr key={t.id}>
              <td>{t.nombre}</td>
              <td>{t.campos.length}</td>
              <td>{t.datos.length}</td>
              <td>
                <button onClick={() => onEditar(t)}>✏️</button>
                <button onClick={() => {
                  if (confirm(`¿Eliminar tabla "${t.nombre}"?`)) {
                    onEliminar(t.id);
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

export default TablaList;
