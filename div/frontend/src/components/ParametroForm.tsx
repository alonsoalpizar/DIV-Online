import { useEffect, useState } from 'react';
import { Parametro } from '../types/parametro';
import { FaCog, FaTimes } from 'react-icons/fa';
import './ParametroForm.css';

interface Props {
  parametro?: Parametro | null;
  onGuardar: (parametro: Parametro) => void;
  onCancelar: () => void;
}

const ParametroForm: React.FC<Props> = ({ parametro, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(parametro?.nombre || '');
  const [valor, setValor] = useState(parametro?.valor || '');
  const [descripcion, setDescripcion] = useState(parametro?.descripcion || '');

  useEffect(() => {
    if (parametro) {
      setNombre(parametro.nombre);
      setValor(parametro.valor);
      setDescripcion(parametro.descripcion);
    }
  }, [parametro]);

  const handleGuardar = () => {
    if (!nombre || !valor) {
      alert('Nombre y Valor son obligatorios');
      return;
    }

    const nuevoParametro: Parametro = {
      id: parametro?.id || '',
      nombre,
      valor,
      descripcion,
    };

    onGuardar(nuevoParametro);
  };

  return (
    <div className="parametro-form">
      {/* Header */}
      <div className="parametro-form-header">
        <div className="form-title-section">
          <FaCog className="parametro-icon" />
          <div>
            <h2>{parametro ? 'Editar Parámetro' : 'Nuevo Parámetro'}</h2>
            <p>Configure una variable del sistema</p>
          </div>
        </div>
        <button className="btn-close" onClick={onCancelar}>
          <FaTimes />
        </button>
      </div>

      {/* Form Body */}
      <div className="parametro-form-body">
        <div className="form-group">
          <label>Nombre:</label>
          <input 
            value={nombre} 
            onChange={e => setNombre(e.target.value)}
            placeholder="TIMEOUT_DB, MAX_CONNECTIONS, API_VERSION..."
          />
          <div className="help-text info">
            Use nombres descriptivos en mayúsculas con guiones bajos
          </div>
        </div>

        <div className="form-group">
          <label>Valor:</label>
          <input 
            value={valor} 
            onChange={e => setValor(e.target.value)}
            placeholder="30, true, https://api.ejemplo.com, production..."
          />
          <div className="help-text">
            El valor que tomará este parámetro en el sistema
          </div>
        </div>

        <div className="form-group">
          <label>Descripción:</label>
          <textarea 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Explique qué hace este parámetro y cómo afecta al sistema..."
          />
          <div className="help-text">
            Descripción opcional para documentar el propósito del parámetro
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="parametro-form-footer">
        <button onClick={onCancelar} className="btn btn-secondary">
          Cancelar
        </button>
        <button onClick={handleGuardar} className="btn btn-primary">
          💾 Guardar Parámetro
        </button>
      </div>
    </div>
  );
};

export default ParametroForm;
