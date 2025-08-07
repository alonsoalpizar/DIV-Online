// Lista sortable de campos de entrada con vista previa del orden de ejecución
import React, { useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableAsignacionEntrada, { CampoEntrada, AsignacionEntrada } from './SortableAsignacionEntrada';

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
  campos: CampoEntrada[];
  setCampos: (campos: CampoEntrada[]) => void;
  tablas: Tabla[];
  funcionesSistema: FuncionGlobal[];
  readOnly?: boolean;
}

const SortableAsignacionesEntradaList = React.memo(({
  campos,
  setCampos,
  tablas,
  funcionesSistema,
  readOnly = false
}: Props) => {

  // Generar IDs únicos para el drag and drop de manera estable
  const items = useMemo(() => 
    campos.map((c, index) => `campo-entrada-${index}`),
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

  const handleChange = (index: number, cambios: Partial<CampoEntrada>) => {
    const nuevosCampos = [...campos];
    nuevosCampos[index] = { ...nuevosCampos[index], ...cambios };
    setCampos(nuevosCampos);
  };

  const handleChangeAsignacion = (index: number, cambios: Partial<AsignacionEntrada>) => {
    const nuevosCampos = [...campos];
    const prevAsignacion = nuevosCampos[index].asignacion || { tipo: '', valor: '' };
    
    let nuevaAsignacion: AsignacionEntrada = { ...prevAsignacion, ...cambios };
    
    // Lógica especial para tipo tabla (compatibilidad con el código existente)
    const nuevoTipo = cambios?.tipo || prevAsignacion.tipo;
    if (nuevoTipo === "tabla" && cambios) {
      if ("valor" in cambios && cambios.valor !== undefined) {
        (nuevaAsignacion as any).clave = cambios.valor;
      }
      if ("campoResultado" in cambios && cambios.campoResultado !== undefined) {
        (nuevaAsignacion as any).campo = cambios.campoResultado;
      }
    }
    
    nuevosCampos[index].asignacion = nuevaAsignacion;
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

  // Analizar advertencias de dependencias problemáticas
  const analizarAdvertencias = () => {
    const advertencias: string[] = [];

    campos.forEach((campo, index) => {
      if (campo.asignacion?.tipo === 'funcion') {
        const valor = campo.asignacion.valor || '';
        // Advertir sobre referencias a campos posteriores
        const referenciasPosteriores = campos
          .slice(index + 1) // Solo campos posteriores
          .filter(c => valor.includes(c.nombre))
          .map(c => c.nombre);
        
        if (referenciasPosteriores.length > 0) {
          advertencias.push(`⚠️ "${campo.nombre}" referencia campos posteriores: ${referenciasPosteriores.join(', ')}`);
        }
      }
    });

    return advertencias;
  };

  const advertencias = analizarAdvertencias();

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div style={{ marginBottom: '15px' }}>
            {campos.map((campo, index) => (
              <SortableAsignacionEntrada
                key={`campo-entrada-${index}`} // Key único y estable basado solo en el índice
                campo={campo}
                index={index}
                onChange={handleChange}
                onChangeAsignacion={handleChangeAsignacion}
                onRemove={handleRemove}
                tablas={tablas}
                funcionesSistema={funcionesSistema}
                readOnly={readOnly}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Solo advertencias si hay dependencias problemáticas */}
      {advertencias.length > 0 && (
        <div style={{ 
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          maxWidth: '750px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '4px' }}>
            ⚠️ Advertencias de dependencias:
          </div>
          {advertencias.map((advertencia, idx) => (
            <div key={idx} style={{ fontSize: '12px', color: '#856404' }}>
              {advertencia}
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#856404', marginTop: '4px', fontStyle: 'italic' }}>
            💡 Reordena los campos para que las dependencias se ejecuten primero
          </div>
        </div>
      )}
    </div>
  );
});

SortableAsignacionesEntradaList.displayName = 'SortableAsignacionesEntradaList';

export default SortableAsignacionesEntradaList;