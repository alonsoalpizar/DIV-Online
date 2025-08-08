import { useState, useEffect } from 'react';
import { Tabla, CampoTabla } from '../types/tabla';
import { FaTable, FaTimes, FaPlus, FaDatabase, FaKey } from 'react-icons/fa';
import './TablaForm.css';

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
    <div className="tabla-form">
      {/* Header */}
      <div className="tabla-form-header">
        <div className="form-title-section">
          <FaTable className="tabla-icon" />
          <div>
            <h2>{tabla ? 'Editar Tabla' : 'Nueva Tabla'}</h2>
            <p>Define esquemas y datos para tablas dinámicas</p>
          </div>
        </div>
        <button className="btn-close" onClick={onCancelar}>
          <FaTimes />
        </button>
      </div>

      {/* Form Body */}
      <div className="tabla-form-body">
        {/* Información Básica */}
        <div className="form-section">
          <h3><FaDatabase /> Información Básica</h3>
          
          <div className="form-group">
            <label>Nombre de la Tabla:</label>
            <input 
              value={nombre} 
              onChange={e => setNombre(e.target.value)}
              placeholder="usuarios, productos, configuracion..."
            />
          </div>
        </div>

        {/* Definición de Campos */}
        <div className="form-section">
          <div className="section-header">
            <h3><FaKey /> Esquema de Campos</h3>
            <button onClick={agregarCampo} className="btn-add">
              <FaPlus /> Agregar Campo
            </button>
          </div>
          
          {campos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>No hay campos definidos. Agregue al menos un campo para continuar.</p>
            </div>
          ) : (
            <div className="campos-grid">
              {campos.map((campo, i) => (
                <div key={i} className="campo-row">
                  <input
                    placeholder="Nombre del campo"
                    value={campo.nombre}
                    onChange={e => actualizarCampo(i, { ...campo, nombre: e.target.value })}
                  />
                  <select
                    value={campo.tipo}
                    onChange={e => actualizarCampo(i, { ...campo, tipo: e.target.value })}
                  >
                    <option value="string">Texto</option>
                    <option value="int">Número</option>
                    <option value="bool">Booleano</option>
                  </select>
                  <button 
                    onClick={() => eliminarCampo(i)}
                    className="btn-remove"
                    title="Eliminar campo"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {campos.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
              <FaKey style={{ marginRight: 'var(--space-1)', color: 'var(--yellow-600)' }} />
              El primer campo actúa como clave primaria y no puede tener valores duplicados
            </div>
          )}
        </div>

        {/* Registros de Datos */}
        {campos.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <h3><FaDatabase /> Registros de Datos</h3>
              <button onClick={agregarRegistro} className="btn-add">
                <FaPlus /> Agregar Registro
              </button>
            </div>
            
            {datos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>No hay registros de datos. Agregue registros para poblar la tabla.</p>
              </div>
            ) : (
              <div className="registros-section">
                <table className="registros-table">
                  <thead>
                    <tr>
                      {campos.map((c, i) => (
                        <th key={i}>
                          {c.nombre} {i === 0 && <FaKey className="key-indicator" title="Campo clave" />}
                        </th>
                      ))}
                      <th>Acciones</th>
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
                                value={fila[campo.nombre] || ''}
                                onChange={e => actualizarDato(rowIndex, campo.nombre, campo.tipo === 'int' ? parseInt(e.target.value) || 0 : e.target.value)}
                                placeholder={campo.tipo === 'int' ? '0' : `Ingrese ${campo.nombre}`}
                              />
                            )}
                          </td>
                        ))}
                        <td>
                          <button 
                            onClick={() => eliminarRegistro(rowIndex)}
                            className="btn-remove"
                            title="Eliminar registro"
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="tabla-form-footer">
        <button onClick={onCancelar} className="btn btn-secondary">
          Cancelar
        </button>
        <button onClick={handleGuardar} className="btn btn-primary">
          💾 Guardar Tabla
        </button>
      </div>
    </div>
  );
};

export default TablaForm;
