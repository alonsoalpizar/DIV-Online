import { useEffect, useState } from 'react';
import { Parametro } from '../types/parametro';

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
    <div className="form-container">
      <h2>{parametro ? 'Editar Parámetro' : 'Nuevo Parámetro'}</h2>
      <div className="form-grid">
        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />

        <label>Valor:</label>
        <input value={valor} onChange={e => setValor(e.target.value)} />

        <label>Descripción:</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </div>

      <div className="form-actions">
        <button onClick={handleGuardar} className="btn-guardar">💾 Guardar</button>
        <button onClick={onCancelar} className="btn-cancelar">Cancelar</button>
      </div>
    </div>
  );
};

export default ParametroForm;
