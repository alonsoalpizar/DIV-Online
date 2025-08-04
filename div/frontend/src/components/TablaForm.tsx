import { useState, useEffect } from 'react';
import { Tabla, CampoTabla } from '../types/tabla';

interface Props {
  tabla?: Tabla | null;
  onGuardar: (tabla: Tabla) => void;
  onCancelar: () => void;
}

const TablaForm: React.FC<Props> = ({ tabla, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(tabla?.nombre || '');
  const [campos, setCampos] = useState<CampoTabla[]>(tabla?.campos || []);
  const [datos, setDatos] = useState<any[]>(tabla?.datos || []);

  useEffect(() => {
    if (tabla) {
      setNombre(tabla.nombre);
      setCampos(tabla.campos || []);
      setDatos(tabla.datos || []);
    }
  }, [tabla]);

  const agregarCampo = () => {
    setCampos([...campos, { nombre: '', tipo: 'string' }]);
  };

  const actualizarCampo = (index: number, campo: CampoTabla) => {
    const copia = [...campos];
    copia[index] = campo;
    setCampos(copia);
  };

  const eliminarCampo = (index: number) => {
    const nuevosCampos = campos.filter((_, i) => i !== index);
    setCampos(nuevosCampos);
    // También ajustamos los datos eliminando la propiedad correspondiente
    const nombreEliminado = campos[index].nombre;
    const nuevosDatos = datos.map((registro) => {
      const copia = { ...registro };
      delete copia[nombreEliminado];
      return copia;
    });
    setDatos(nuevosDatos);
  };

  const esClaveDuplicada = (valor: any, rowIndex: number): boolean => {
  const campoClave = campos[0]?.nombre;
  if (!campoClave) return false;

  return datos.some((fila, i) => i !== rowIndex && fila[campoClave] === valor);
};


  const agregarRegistro = () => {
    const nuevoRegistro: any = {};
    campos.forEach(campo => {
      nuevoRegistro[campo.nombre] = campo.tipo === 'bool' ? false : '';
    });
    setDatos([...datos, nuevoRegistro]);
  };

  const actualizarDato = (rowIndex: number, campo: string, valor: any) => {
  const copia = [...datos];

  // Validar duplicado si es campo clave
  const campoClave = campos[0]?.nombre;
  if (campo === campoClave && esClaveDuplicada(valor, rowIndex)) {
    alert(`⚠️ Ya existe otro registro con el valor "${valor}" en el campo clave "${campoClave}"`);
    return;
  }

  copia[rowIndex][campo] = valor;
  setDatos(copia);
};


  const eliminarRegistro = (rowIndex: number) => {
    const copia = [...datos];
    copia.splice(rowIndex, 1);
    setDatos(copia);
  };

  const handleGuardar = () => {
    if (!nombre) {
      alert('El nombre es obligatorio.');
      return;
    }

    const nuevaTabla: Tabla = {
      id: tabla?.id || '',
      nombre,
      campos,
      datos,
    };

    onGuardar(nuevaTabla);
  };

  return (
    <div className="form-container">
      <h2>{tabla ? 'Editar Tabla' : 'Nueva Tabla'}</h2>
      
      <div className="form-grid">
        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>

      <div className="config-section">
        <h4>Campos</h4>
        <button onClick={agregarCampo}>➕ Agregar Campo</button>
        {campos.map((campo, i) => (
          <div key={i} className="config-row">
            <input
              placeholder="Nombre"
              value={campo.nombre}
              onChange={e => actualizarCampo(i, { ...campo, nombre: e.target.value })}
            />
            <select
              value={campo.tipo}
              onChange={e => actualizarCampo(i, { ...campo, tipo: e.target.value })}
            >
              <option value="string">string</option>
              <option value="int">int</option>
              <option value="bool">bool</option>
            </select>
            <button onClick={() => eliminarCampo(i)}>❌</button>
          </div>
        ))}
      </div>

      {campos.length > 0 && (
        <div className="config-section">
          <h4>Registros</h4>
          <button onClick={agregarRegistro}>➕ Agregar Registro</button>
          <table>
            <thead>
              {campos.map((c, i) => (
  <th key={i}>
    {c.nombre} {i === 0 && <span title="Campo clave">🔑</span>}
  </th>
))}
              <tr>
                {campos.map((c, i) => <th key={i}>{c.nombre}</th>)}
                <th>❌</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((fila, rowIndex) => (
                <tr key={rowIndex}>
                  {campos.map((campo, colIndex) => (
                    <td key={colIndex}>
                      {campo.tipo === 'bool' ? (
                        <input
                          type="checkbox"
                          checked={!!fila[campo.nombre]}
                          onChange={e => actualizarDato(rowIndex, campo.nombre, e.target.checked)}
                        />
                      ) : (
                        <input
                          type={campo.tipo === 'int' ? 'number' : 'text'}
                          value={fila[campo.nombre]}
                          onChange={e => actualizarDato(rowIndex, campo.nombre, campo.tipo === 'int' ? parseInt(e.target.value) || 0 : e.target.value)}
                        />
                      )}
                    </td>
                  ))}
                  <td>
                    <button onClick={() => eliminarRegistro(rowIndex)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-actions">
        <button onClick={handleGuardar}>💾 Guardar</button>
        <button onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
};

export default TablaForm;
