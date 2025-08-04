import { Servidor } from '../types/servidor';

interface Props {
  servidores: Servidor[];
  onEditar: (servidor: Servidor) => void;
  onEliminar: (id: string) => void;
}

const ServidorList: React.FC<Props> = ({ servidores, onEditar, onEliminar }) => {
  if (servidores.length === 0) {
    return <p>No hay servidores registrados.</p>;
  }

  return (
    <div className="card">
      <h3>Listado de Servidores</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Host</th>
            <th>Puerto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {servidores.map(s => (
            <tr key={s.id}>
              <td>{s.codigo}</td>
              <td>{s.nombre}</td>
              <td>{s.tipo}</td>
              <td>{s.host}</td>
              <td>{s.puerto}</td>
              <td>
                <button onClick={() => onEditar(s)}>✏️</button>
               <button onClick={() => {
  if (s.id && confirm(`¿Eliminar servidor "${s.nombre}"?`)) {
    onEliminar(s.id);
  }
}}>
  🗑️
</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServidorList;
