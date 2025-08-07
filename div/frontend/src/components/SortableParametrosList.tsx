// Lista sortable de parámetros con drag & drop y funcionalidad completa
import React, { useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableParametroItem, { Parametro } from './SortableParametroItem';

interface Props {
  parametros: Parametro[];
  setParametros: (parametros: Parametro[]) => void;
  onEditarSubcampos?: (index: number) => void;
  onVerJerarquia?: (index: number) => void;
  nivel?: number;
  mostrarCheckbox?: boolean;
  readOnly?: boolean;
}

const SortableParametrosList = React.memo(({
  parametros,
  setParametros,
  onEditarSubcampos,
  onVerJerarquia,
  nivel = 0,
  mostrarCheckbox = true,
  readOnly = false
}: Props) => {

  // Generar IDs únicos para el drag and drop de manera estable
  const items = useMemo(() => 
    parametros.map((p, index) => `parametro-${index}`),
    [parametros.length] // Solo depende de la longitud, no del contenido
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeIndex = items.findIndex(id => id === active.id);
    const overIndex = items.findIndex(id => id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const nuevosParametros = arrayMove(parametros, activeIndex, overIndex);
      // Actualizar órdenes automáticamente
      const parametrosConOrden = nuevosParametros.map((param, index) => ({
        ...param,
        orden: (param.enviarAServidor ?? true) ? index + 1 : param.orden
      }));
      setParametros(parametrosConOrden);
    }
  };

  const handleChange = (index: number, field: keyof Parametro, value: any) => {
    const nuevosParametros = [...parametros];
    (nuevosParametros[index] as any)[field] = value;
    
    // Si cambia enviarAServidor, actualizar órden automáticamente
    if (field === 'enviarAServidor') {
      const parametrosParaServidor = nuevosParametros.filter(p => p.enviarAServidor ?? true);
      parametrosParaServidor.forEach((param, idx) => {
        param.orden = idx + 1;
      });
    }
    
    setParametros(nuevosParametros);
  };

  const handleRemove = (index: number) => {
    const nuevosParametros = [...parametros];
    nuevosParametros.splice(index, 1);
    
    // Reajustar órdenes después de eliminar
    const parametrosParaServidor = nuevosParametros.filter(p => p.enviarAServidor ?? true);
    parametrosParaServidor.forEach((param, idx) => {
      param.orden = idx + 1;
    });
    
    setParametros(nuevosParametros);
  };

  // Vista previa de parámetros que se enviarán al servidor
  const parametrosParaServidor = parametros
    .filter(p => p.enviarAServidor ?? true)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div style={{ marginBottom: '15px' }}>
            {parametros.map((parametro, index) => (
              <SortableParametroItem
                key={`parametro-${index}`} // Key único y estable basado solo en el índice
                parametro={parametro}
                index={index}
                onChange={handleChange}
                onRemove={handleRemove}
                onEditarSubcampos={onEditarSubcampos}
                onVerJerarquia={onVerJerarquia}
                nivel={nivel}
                mostrarCheckbox={mostrarCheckbox}
                readOnly={readOnly}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Vista previa de parámetros que se enviarán */}
      {mostrarCheckbox && parametrosParaServidor.length > 0 && (
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '6px',
          padding: '10px',
          marginTop: '10px',
          maxWidth: '600px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0066cc' }}>
            📤 Parámetros que se enviarán al servidor:
          </div>
          <div style={{ fontSize: '14px', color: '#333' }}>
            {parametrosParaServidor.map((param, idx) => (
              <span key={param.nombre} style={{ marginRight: '8px' }}>
                {param.orden}. {param.nombre} ({param.tipo})
                {idx < parametrosParaServidor.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Total: {parametrosParaServidor.length} de {parametros.length} parámetros
          </div>
        </div>
      )}
    </div>
  );
});

SortableParametrosList.displayName = 'SortableParametrosList';

export default SortableParametrosList;