import { useState, useEffect } from 'react';
import { Proceso } from '../types/proceso';
import { getApiBase } from '../utils/configuracion';

interface Props {
  proceso?: Proceso | null;
  onGuardar: (proceso: Proceso) => void;
  onCancelar: () => void;
}

const ProcesoForm: React.FC<Props> = ({ proceso, onGuardar, onCancelar }) => {
  const [codigo, setCodigo] = useState(proceso?.codigo || '');
  const [nombre, setNombre] = useState(proceso?.nombre || '');
  const [descripcion, setDescripcion] = useState(proceso?.descripcion || '');
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  // Función para obtener próximo código automático
  const obtenerProximoCodigo = async () => {
    try {
      setGenerandoCodigo(true);
      const response = await fetch(`${getApiBase()}/consecutivo/proceso`);
      const data = await response.json();
      setCodigo(data.proximoCodigo);
    } catch (error) {
      console.error('Error al obtener próximo código:', error);
      // Fallback: generar código simple
      const timestamp = Date.now().toString().slice(-3);
      setCodigo(`PROC-${timestamp}`);
    } finally {
      setGenerandoCodigo(false);
    }
  };

  useEffect(() => {
    if (proceso) {
      // Editando proceso existente
      setCodigo(proceso.codigo);
      setNombre(proceso.nombre);
      setDescripcion(proceso.descripcion || '');
    } else {
      // Nuevo proceso: generar código automático
      obtenerProximoCodigo();
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
        <div className="codigo-input-group">
          <input 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)}
            placeholder="PROC-001"
            disabled={generandoCodigo}
          />
          {!proceso && (
            <button 
              type="button"
              className="btn-generar-codigo"
              onClick={obtenerProximoCodigo}
              disabled={generandoCodigo}
              title="Generar código automático"
            >
              {generandoCodigo ? '⏳' : '🔄'}
            </button>
          )}
        </div>

        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />

        <label>Descripción:</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </div>

      <div className="form-actions">
        <button onClick={handleGuardar} disabled={generandoCodigo}>
          {generandoCodigo ? '⏳ Generando...' : '💾 Guardar'}
        </button>
        <button onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
};

export default ProcesoForm;
