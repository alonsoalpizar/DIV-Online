// Componente optimizado para campos de salida con drag & drop y control de orden
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Tipos e interfaces ---
export interface CampoSalida {
  nombre: string;
  tipo: string;
  subcampos?: CampoSalida[];
  orden?: number; // Orden en la respuesta final
}

interface Props {
  campo: CampoSalida;
  index: number;
  onChange: (index: number, field: keyof CampoSalida, value: any) => void;
  onRemove: (index: number) => void;
  onEditarSubcampos?: (index: number) => void;
  onVerJerarquia?: (index: number) => void;
  nivel?: number;
  readOnly?: boolean;
}

// Componente optimizado definido fuera del componente padre para evitar re-creación
const SortableCampoSalida = React.memo(({ 
  campo, 
  index, 
  onChange, 
  onRemove, 
  onEditarSubcampos,
  onVerJerarquia,
  nivel = 0,
  readOnly = false
}: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `campo-salida-${index}` // Key único y estable basado solo en el índice
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const tipoSimple = ["string", "int", "bool", "date", "float", "json"];
  const puedeAgregarSubcampos = campo.tipo === 'object' || campo.tipo === 'array';
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-campo-salida"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        marginLeft: nivel * 20,
        marginBottom: '5px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: isDragging ? '2px solid #007bff' : '1px solid #e1e5e9',
        maxWidth: '600px', // Limitar ancho para que no abarque todo el modal
        boxSizing: 'border-box'
      }}>
        
        {/* Handle de arrastre */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            color: '#6c757d',
            minWidth: '20px'
          }}
          title="Arrastrar para reordenar campos de salida"
        >
          ☰
        </div>

        {/* Número de orden visual */}
        <div style={{
          minWidth: '25px',
          textAlign: 'center',
          backgroundColor: '#e9ecef',
          borderRadius: '50%',
          padding: '2px 6px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#495057'
        }}>
          {index + 1}
        </div>

        {/* Campo nombre */}
        <input
          type="text"
          value={campo.nombre}
          onChange={(e) => onChange(index, 'nombre', e.target.value)}
          disabled={readOnly}
          style={{
            minWidth: '120px',
            maxWidth: '180px',
            padding: '4px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            backgroundColor: readOnly ? '#f8f9fa' : 'white'
          }}
          placeholder="Nombre del campo"
        />

        {/* Campo tipo */}
        <select
          value={campo.tipo}
          onChange={(e) => onChange(index, 'tipo', e.target.value)}
          disabled={readOnly}
          style={{
            minWidth: '80px',
            maxWidth: '100px',
            padding: '4px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            backgroundColor: readOnly ? '#f8f9fa' : 'white'
          }}
        >
          {tipoSimple.map(t => <option key={t} value={t}>{t}</option>)}
          <option value="object">object</option>
          <option value="array">array</option>
        </select>

        {/* Botón para editar subcampos */}
        {puedeAgregarSubcampos && onEditarSubcampos && (
          <button
            type="button"
            onClick={() => onEditarSubcampos(index)}
            style={{
              backgroundColor: nivel === 0 ? '#007bff' : 
                              nivel === 1 ? '#6f42c1' :
                              nivel === 2 ? '#dc3545' : '#fd7e14',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title={`Editar subcampos - Nivel ${nivel + 1}`}
          >
            Sub
          </button>
        )}

        {/* Botón para ver jerarquía */}
        {(campo.tipo === 'array' || campo.tipo === 'object') && campo.subcampos && onVerJerarquia && (
          <button
            type="button"
            onClick={() => onVerJerarquia(index)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Ver jerarquía de subcampos"
          >
            🔍
          </button>
        )}

        {/* Botón eliminar */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '28px'
            }}
            title="Eliminar campo"
          >
            ❌
          </button>
        )}
      </div>
    </div>
  );
});

SortableCampoSalida.displayName = 'SortableCampoSalida';

export default SortableCampoSalida;