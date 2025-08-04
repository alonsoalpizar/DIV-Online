import { useState, useEffect } from 'react';
import { Proceso } from '../types/proceso';

interface Props {
  proceso?: Proceso | null;
  onGuardar: (proceso: Proceso) => void;
  onCancelar: () => void;
}

const ProcesoForm: React.FC<Props> = ({ proceso, onGuardar, onCancelar }) => {
  const [codigo, setCodigo] = useState(proceso?.codigo || '');
  const [nombre, setNombre] = useState(proceso?.nombre || '');
  const [descripcion, setDescripcion] = useState(proceso?.descripcion || '');

  useEffect(() => {
    if (proceso) {
      setCodigo(proceso.codigo);
      setNombre(proceso.nombre);
      setDescripcion(proceso.descripcion || '');
    }
  }, [proceso]);

  const handleGuardar = () => {
    if (!codigo || !nombre) {
      alert('Código y nombre son obligatorios');
      return;
    }

    const nuevo: Proceso = {
      id: proceso?.id || '', // 🔁 volvemos a ID vacío si es nuevo
      codigo,
      nombre,
      descripcion,
      flujo: proceso?.flujo || ''
    };

    onGuardar(nuevo);
  };

  return (
    <div className="form-container">
      <h2>{proceso ? 'Editar Proceso' : 'Nuevo Proceso'}</h2>
      <div className="form-grid">
        <label>Código:</label>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} />

        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />

        <label>Descripción:</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </div>

      <div className="form-actions">
        <button onClick={handleGuardar}>💾 Guardar</button>
        <button onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
};

export default ProcesoForm;
