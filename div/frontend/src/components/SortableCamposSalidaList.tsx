// Lista sortable de campos de salida con drag & drop para controlar orden de respuesta
import React, { useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableCampoSalida, { CampoSalida } from './SortableCampoSalida';

interface Props {
  campos: CampoSalida[];
  setCampos: (campos: CampoSalida[]) => void;
  onEditarSubcampos?: (index: number) => void;
  onVerJerarquia?: (index: number) => void;
  nivel?: number;
  readOnly?: boolean;
}

const SortableCamposSalidaList = React.memo(({
  campos,
  setCampos,
  onEditarSubcampos,
  onVerJerarquia,
  nivel = 0,
  readOnly = false
}: Props) => {

  // Generar IDs únicos para el drag and drop de manera estable
  const items = useMemo(() => 
    campos.map((c, index) => `campo-salida-${index}`),
    [campos.length] // Solo depende de la longitud, no del contenido
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeIndex = items.findIndex(id => id === active.id);
    const overIndex = items.findIndex(id => id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const nuevosCampos = arrayMove(campos, activeIndex, overIndex);
      // Actualizar órdenes automáticamente según nueva posición
      const camposConOrden = nuevosCampos.map((campo, index) => ({
        ...campo,
        orden: index + 1
      }));
      setCampos(camposConOrden);
    }
  };

  const handleChange = (index: number, field: keyof CampoSalida, value: any) => {
    const nuevosCampos = [...campos];
    (nuevosCampos[index] as any)[field] = value;
    setCampos(nuevosCampos);
  };

  const handleRemove = (index: number) => {
    const nuevosCampos = [...campos];
    nuevosCampos.splice(index, 1);
    
    // Reajustar órdenes después de eliminar
    const camposConOrden = nuevosCampos.map((campo, idx) => ({
      ...campo,
      orden: idx + 1
    }));
    
    setCampos(camposConOrden);
  };

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div style={{ marginBottom: '15px' }}>
            {campos.map((campo, index) => (
              <SortableCampoSalida
                key={`campo-salida-${index}`} // Key único y estable basado solo en el índice
                campo={campo}
                index={index}
                onChange={handleChange}
                onRemove={handleRemove}
                onEditarSubcampos={onEditarSubcampos}
                onVerJerarquia={onVerJerarquia}
                nivel={nivel}
                readOnly={readOnly}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  );
});

SortableCamposSalidaList.displayName = 'SortableCamposSalidaList';

export default SortableCamposSalidaList;