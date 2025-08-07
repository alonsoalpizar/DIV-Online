// Componente optimizado para campos de entrada con asignaciones y drag & drop
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Tipos e interfaces ---
export interface AsignacionEntrada {
  tipo: '' | 'literal' | 'funcion' | 'tabla';
  valor: string;
  tabla?: string;
  campoResultado?: string;
  valorEsCampo?: boolean;
}

export interface CampoEntrada {
  nombre: string;
  tipo: string;
  asignacion?: AsignacionEntrada;
  orden?: number; // Orden de ejecución
}

interface Tabla {
  nombre: string;
  campos: { nombre: string; tipo: string }[];
}

interface FuncionGlobal {
  nombre: string;
  descripcion: string;
  ejemplo?: string; // Hacer opcional para compatibilidad
  origen?: string; // Hacer opcional para compatibilidad
}

interface Props {
  campo: CampoEntrada;
  index: number;
  onChange: (index: number, cambios: Partial<CampoEntrada>) => void;
  onChangeAsignacion: (index: number, cambios: Partial<AsignacionEntrada>) => void;
  onRemove: (index: number) => void;
  tablas: Tabla[];
  funcionesSistema: FuncionGlobal[];
  readOnly?: boolean;
}

// Componente optimizado definido fuera del componente padre
const SortableAsignacionEntrada = React.memo(({ 
  campo, 
  index, 
  onChange, 
  onChangeAsignacion,
  onRemove, 
  tablas,
  funcionesSistema,
  readOnly = false
}: Props) => {
  const [expandido, setExpandido] = React.useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `campo-entrada-${index}` // Key único y estable basado solo en el índice
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const obtenerCamposDeTabla = (nombreTabla: string | undefined) => {
    if (!nombreTabla) return [];
    const tabla = tablas.find(t => t.nombre === nombreTabla);
    return tabla?.campos || [];
  };

  const camposTabla = obtenerCamposDeTabla(campo.asignacion?.tabla);

  // Determinar color según tipo de asignación
  const getColorTipo = (tipo?: string) => {
    switch(tipo) {
      case 'literal': return '#28a745'; // Verde
      case 'funcion': return '#007bff'; // Azul
      case 'tabla': return '#6f42c1'; // Morado
      default: return '#6c757d'; // Gris
    }
  };

  // Obtener icono según tipo
  const getIconoTipo = (tipo?: string) => {
    switch(tipo) {
      case 'literal': return '✍️';
      case 'funcion': return '⚙️';
      case 'tabla': return '📊';
      default: return '🚫';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-asignacion-entrada"
    >
      <div style={{
        padding: '8px',
        marginBottom: '4px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: isDragging ? '2px solid #007bff' : '1px solid #e1e5e9',
        maxWidth: '750px',
        boxSizing: 'border-box'
      }}>
        
        {/* Header compacto: Handle + orden + nombre + tipo + expandir/colapsar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer'
        }}
        onClick={() => setExpandido(!expandido)}
        >
          
          {/* Handle de arrastre */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              color: '#6c757d',
              minWidth: '16px'
            }}
            title="Arrastrar para cambiar orden"
            onClick={(e) => e.stopPropagation()}
          >
            ☰
          </div>

          {/* Número de orden */}
          <div style={{
            minWidth: '22px',
            textAlign: 'center',
            backgroundColor: getColorTipo(campo.asignacion?.tipo),
            color: 'white',
            borderRadius: '50%',
            padding: '1px 5px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {index + 1}
          </div>

          {/* Nombre del campo */}
          <div style={{
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#333',
            minWidth: '100px',
            flex: 1
          }}>
            {campo.nombre || `Campo ${index + 1}`}
          </div>

          {/* Tipo de campo */}
          <div style={{
            padding: '2px 6px',
            backgroundColor: '#6c757d',
            color: 'white',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {campo.tipo}
          </div>

          {/* Tipo de asignación */}
          <div style={{
            padding: '2px 6px',
            backgroundColor: getColorTipo(campo.asignacion?.tipo),
            color: 'white',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '70px',
            textAlign: 'center'
          }}>
            {getIconoTipo(campo.asignacion?.tipo)} {campo.asignacion?.tipo || 'sin asignar'}
          </div>

          {/* Vista previa del valor */}
          <div style={{
            fontSize: '11px',
            color: '#666',
            fontStyle: 'italic',
            flex: 1,
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '150px'
          }}>
            {campo.asignacion?.tipo === 'literal' && `"${campo.asignacion.valor}"`}
            {campo.asignacion?.tipo === 'funcion' && campo.asignacion.valor}
            {campo.asignacion?.tipo === 'tabla' && `${campo.asignacion.tabla}[${campo.asignacion.valor}]`}
          </div>

          {/* Botón expandir/colapsar */}
          <div style={{
            padding: '2px 4px',
            color: '#6c757d',
            fontSize: '12px',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {expandido ? '▼' : '▶'}
          </div>

          {/* Botón eliminar */}
          {!readOnly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '2px 6px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
              title="Eliminar campo"
            >
              ✕
            </button>
          )}
        </div>

        {/* Panel expandible con detalles de configuración */}
        {expandido && (
          <div style={{ 
            marginTop: '8px', 
            paddingTop: '8px', 
            borderTop: '1px solid #dee2e6' 
          }}>
            
            {/* Campos principales: nombre y tipo */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={campo.nombre}
                onChange={(e) => onChange(index, { nombre: e.target.value })}
                disabled={readOnly}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: readOnly ? '#f8f9fa' : 'white'
                }}
                placeholder="Nombre del campo"
              />
              <select
                value={campo.tipo}
                onChange={(e) => onChange(index, { tipo: e.target.value })}
                disabled={readOnly}
                style={{
                  minWidth: '120px',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: readOnly ? '#f8f9fa' : 'white'
                }}
              >
                <option value="string">string</option>
                <option value="int">int</option>
                <option value="float">float</option>
                <option value="boolean">boolean</option>
                <option value="date">date</option>
                <option value="datetime">datetime</option>
              </select>
            </div>

            {/* Selector de tipo de asignación */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <select
                value={campo.asignacion?.tipo || ''}
                onChange={(e) => onChangeAsignacion(index, {
                  tipo: e.target.value as any,
                  valor: '',
                  campoResultado: ''
                })}
                disabled={readOnly}
                style={{
                  minWidth: '150px',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: readOnly ? '#f8f9fa' : 'white'
                }}
              >
                <option value="">🚫 Sin asignar</option>
                <option value="literal">✍️ Valor literal</option>
                <option value="funcion">⚙️ Función sistema</option>
                <option value="tabla">📊 Consulta tabla</option>
              </select>

              {/* Vista previa de la asignación en modo expandido */}
              <div style={{ 
                flex: 1, 
                fontSize: '12px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                {campo.asignacion?.tipo === 'literal' && `Valor: "${campo.asignacion.valor}"`}
                {campo.asignacion?.tipo === 'funcion' && `Función: ${campo.asignacion.valor}`}
                {campo.asignacion?.tipo === 'tabla' && `Tabla: ${campo.asignacion.tabla}[${campo.asignacion.valor}].${campo.asignacion.campoResultado}`}
              </div>
            </div>

            {/* Controles específicos por tipo de asignación */}
            {campo.asignacion?.tipo === 'literal' && (
              <input
                type="text"
                value={campo.asignacion?.valor || ''}
                placeholder="Valor literal"
                onChange={(e) => onChangeAsignacion(index, { valor: e.target.value })}
                disabled={readOnly}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: readOnly ? '#f8f9fa' : 'white'
                }}
              />
            )}

            {campo.asignacion?.tipo === 'funcion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="text"
                  placeholder="Ej: Ahora()"
                  value={campo.asignacion?.valor || ''}
                  onChange={(e) => onChangeAsignacion(index, { valor: e.target.value })}
                  disabled={readOnly}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: readOnly ? '#f8f9fa' : 'white'
                  }}
                />
                {!readOnly && (
                  <select
                    onChange={(e) => {
                      const func = funcionesSistema.find(f => f.nombre === e.target.value);
                      if (func) {
                        onChangeAsignacion(index, { valor: func.ejemplo || `${func.nombre}()` });
                      }
                    }}
                    defaultValue=""
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '0.9em'
                    }}
                  >
                    <option value="">🧠 Elegir función de sistema...</option>
                    {funcionesSistema.map(func => (
                      <option key={func.nombre} value={func.nombre}>
                        {func.nombre}() - {func.descripcion}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {campo.asignacion?.tipo === 'tabla' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Selector de tabla */}
                <select
                  value={campo.asignacion?.tabla || ''}
                  onChange={(e) => onChangeAsignacion(index, { 
                    tabla: e.target.value,
                    valor: '',
                    campoResultado: '' 
                  })}
                  disabled={readOnly}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: readOnly ? '#f8f9fa' : 'white'
                  }}
                >
                  <option value="">📊 Seleccionar tabla...</option>
                  {tablas.map(tabla => (
                    <option key={tabla.nombre} value={tabla.nombre}>
                      {tabla.nombre}
                    </option>
                  ))}
                </select>
                
                {/* Valor clave */}
                {campo.asignacion.tabla && (
                  <input
                    type="text"
                    placeholder="Clave de búsqueda"
                    value={campo.asignacion?.valor || ''}
                    onChange={(e) => onChangeAsignacion(index, { valor: e.target.value })}
                    disabled={readOnly}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: readOnly ? '#f8f9fa' : 'white'
                    }}
                  />
                )}

                {/* Selector de campo resultado */}
                {campo.asignacion.tabla && camposTabla.length > 0 && (
                  <select
                    value={campo.asignacion?.campoResultado || ''}
                    onChange={(e) => onChangeAsignacion(index, { campoResultado: e.target.value })}
                    disabled={readOnly}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: readOnly ? '#f8f9fa' : 'white'
                    }}
                  >
                    <option value="">🎯 Campo a retornar...</option>
                    {camposTabla.map(campoTabla => (
                      <option key={campoTabla.nombre} value={campoTabla.nombre}>
                        {campoTabla.nombre} ({campoTabla.tipo})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SortableAsignacionEntrada.displayName = 'SortableAsignacionEntrada';

export default SortableAsignacionEntrada;