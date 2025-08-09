import { useState, useEffect } from 'react';
import { Proceso } from '../types/proceso';
import { getApiBase } from '../utils/configuracion';
import { FaCogs, FaTimes } from 'react-icons/fa';
import './ProcesoForm.css';

interface Categoria {
  id: string;
  nombre: string;
  color?: string;
}

interface Props {
  proceso?: Proceso | null;
  onGuardar: (proceso: Proceso) => void;
  onCancelar: () => void;
}

const ProcesoForm: React.FC<Props> = ({ proceso, onGuardar, onCancelar }) => {
  const [codigo, setCodigo] = useState(proceso?.codigo || '');
  const [nombre, setNombre] = useState(proceso?.nombre || '');
  const [descripcion, setDescripcion] = useState(proceso?.descripcion || '');
  const [categoriaId, setCategoriaId] = useState((proceso as any)?.categoria_id || '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
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

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const response = await fetch(`${getApiBase()}/categorias?ambito=proceso`);
      const data = await response.json();
      setCategorias(data || []);
    } catch (error) {
      console.error('Error al cargar categorías de procesos:', error);
    }
  };

  useEffect(() => {
    cargarCategorias();
    
    if (proceso) {
      // Editando proceso existente
      setCodigo(proceso.codigo);
      setNombre(proceso.nombre);
      setDescripcion(proceso.descripcion || '');
      setCategoriaId((proceso as any).categoria_id || '');
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
      flujo: proceso?.flujo || '',
      categoria_id: categoriaId || undefined
    } as any;

    onGuardar(nuevo);
  };

  return (
    <div className="proceso-form">
      {/* Header */}
      <div className="proceso-form-header">
        <div className="form-title-section">
          <FaCogs className="proceso-icon" />
          <div>
            <h2>{proceso ? 'Editar Proceso' : 'Nuevo Proceso'}</h2>
            <p>Configure un proceso de integración visual</p>
          </div>
        </div>
        <button className="btn-close" onClick={onCancelar}>
          <FaTimes />
        </button>
      </div>

      {/* Form Body */}
      <div className="proceso-form-body">
        <div className="form-group">
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
        </div>

        <div className="form-group">
          <label>Nombre:</label>
          <input 
            value={nombre} 
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre descriptivo del proceso"
          />
        </div>

        <div className="form-group">
          <label>Descripción:</label>
          <input 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Descripción opcional del proceso"
          />
        </div>

        {/* Campo de categoría - solo si hay categorías disponibles */}
        {categorias.length > 0 && (
          <div className="form-group">
            <label>Categoría:</label>
            <select 
              value={categoriaId} 
              onChange={e => setCategoriaId(e.target.value)}
              style={{ 
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff'
              }}
            >
              <option value="">Sin categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {categoriaId && (
              <div style={{ marginTop: '5px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: categorias.find(c => c.id === categoriaId)?.color || '#e0e0e0',
                  color: '#fff',
                  fontSize: '0.9em'
                }}>
                  Vista previa: {categorias.find(c => c.id === categoriaId)?.nombre}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="proceso-form-footer">
        <button onClick={onCancelar} className="btn btn-secondary">
          Cancelar
        </button>
        <button onClick={handleGuardar} disabled={generandoCodigo} className="btn btn-primary">
          {generandoCodigo ? '⏳ Generando...' : '💾 Guardar Proceso'}
        </button>
      </div>
    </div>
  );
};

export default ProcesoForm;
