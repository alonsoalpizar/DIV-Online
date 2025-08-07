// Componente optimizado para parámetros con drag & drop, checkboxes y control de orden
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Tipos e interfaces ---
export interface Parametro {
  nombre: string;
  tipo: string;
  subcampos?: Parametro[];
  enviarAServidor?: boolean;
  orden?: number;
}

interface Props {
  parametro: Parametro;
  index: number;
  onChange: (index: number, field: keyof Parametro, value: any) => void;
  onRemove: (index: number) => void;
  onEditarSubcampos?: (index: number) => void;
  onVerJerarquia?: (index: number) => void;
  nivel?: number;
  mostrarCheckbox?: boolean;
  readOnly?: boolean;
}

// Componente optimizado definido fuera del componente padre para evitar re-creación
const SortableParametroItem = React.memo(({ 
  parametro, 
  index, 
  onChange, 
  onRemove, 
  onEditarSubcampos,
  onVerJerarquia,
  nivel = 0,
  mostrarCheckbox = true,
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
    id: `parametro-${index}` // Key único y estable basado solo en el índice
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const tipoSimple = ["string", "int", "bool", "date", "float", "json"];
  const puedeAgregarSubcampos = parametro.tipo === 'object' || parametro.tipo === 'array';
  const esCampoDeError = ['codigoError', 'mensajeError', 'detalleError'].includes(parametro.nombre);
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-parametro-item"
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
        
        {/* Checkbox para enviar al servidor */}
        {mostrarCheckbox && (
          <div style={{ display: 'flex', alignItems: 'center', minWidth: '20px' }}>
            <input
              type="checkbox"
              checked={parametro.enviarAServidor ?? true}
              onChange={(e) => onChange(index, 'enviarAServidor', e.target.checked)}
              disabled={readOnly}
              title="Enviar al servidor"
            />
          </div>
        )}

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
          title="Arrastrar para reordenar"
        >
          ☰
        </div>

        {/* Campo nombre */}
        <input
          type="text"
          value={parametro.nombre}
          onChange={(e) => onChange(index, 'nombre', e.target.value)}
          disabled={esCampoDeError || readOnly}
          readOnly={esCampoDeError}
          style={{
            minWidth: '120px',
            maxWidth: '180px',
            padding: '4px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            backgroundColor: esCampoDeError ? '#f8f9fa' : 'white'
          }}
          placeholder="Nombre parámetro"
        />

        {/* Campo tipo */}
        <select
          value={parametro.tipo}
          onChange={(e) => onChange(index, 'tipo', e.target.value)}
          disabled={esCampoDeError || readOnly}
          style={{
            minWidth: '80px',
            maxWidth: '100px',
            padding: '4px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            backgroundColor: esCampoDeError ? '#f8f9fa' : 'white'
          }}
        >
          {tipoSimple.map(t => <option key={t} value={t}>{t}</option>)}
          <option value="object">object</option>
          <option value="array">array</option>
        </select>

        {/* Orden (solo si enviarAServidor es true) */}
        {mostrarCheckbox && (parametro.enviarAServidor ?? true) && (
          <input
            type="number"
            value={parametro.orden ?? index + 1}
            onChange={(e) => onChange(index, 'orden', parseInt(e.target.value) || 0)}
            disabled={readOnly}
            style={{
              width: '50px',
              padding: '4px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              textAlign: 'center'
            }}
            title="Orden de envío al servidor"
            min="0"
          />
        )}

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
        {(parametro.tipo === 'array' || parametro.tipo === 'object') && parametro.subcampos && onVerJerarquia && (
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
        {!esCampoDeError && !readOnly && (
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
            title="Eliminar parámetro"
          >
            ❌
          </button>
        )}
      </div>

      {/* Vista previa de información adicional */}
      {mostrarCheckbox && (
        <div style={{
          fontSize: '11px',
          color: '#6c757d',
          marginLeft: (nivel * 20) + 40,
          marginTop: '-2px',
          marginBottom: '3px'
        }}>
          {parametro.enviarAServidor ?? true ? 
            `✓ Se enviará al servidor (orden: ${parametro.orden ?? index + 1})` : 
            '○ Solo para lógica interna'
          }
        </div>
      )}
    </div>
  );
});

SortableParametroItem.displayName = 'SortableParametroItem';

export default SortableParametroItem;