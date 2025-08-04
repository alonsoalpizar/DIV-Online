// 📦 Componente generico de lista de campos con soporte drag and drop (DnD) y edición

import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Tipos e interfaces ---
interface Campo {
    nombre: string;
    tipo: string;
    subcampos?: Campo[];
}

interface Props {
    campos: Campo[];
    setCampos: (v: Campo[]) => void;
}

// --- Item individual sortable ---
//--- Componente para cada campo sortable ---
// Este componente representa cada campo dentro de la lista sortable
const SortableItem = ({ campo, index, onChange, onRemove }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: campo.nombre || `campo-${index}` }); // ✅ id único y estable

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px',
        background: '#f9f9f9',
        borderRadius: '4px',
        pointerEvents: 'auto' // ✅ Permite que input y select reciban eventos
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px',
                background: '#f9f9f9',
                borderRadius: '4px',
                pointerEvents: 'auto',
            }}
        >
            {/* 🟦 Handle de arrastre */}
            <span style={{ cursor: 'grab' }} {...attributes} {...listeners}>
                ☰
            </span>

            {/* 📝 Campo de texto */}
            <input
                value={campo.nombre}
                onChange={(e) => onChange(index, 'nombre', e.target.value)}
                style={{ flex: 1 }}
            />

            {/* 🔽 Selector de tipo */}
            <select
                value={campo.tipo}
                onChange={(e) => onChange(index, 'tipo', e.target.value)}
            >
                <option value="string">string</option>
                <option value="int">int</option>
                <option value="bool">bool</option>
                <option value="float">float</option>
                <option value="date">date</option>
                <option value="json">json</option>
                 <option value="object">object</option>
                <option value="array">array</option>
            </select>

            {/* ❌ Botón de eliminación */}
            <button
                onClick={() => onRemove(index)}
                style={{
                    backgroundColor: '#e03131',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                }}
            >
                ❌
            </button>
        </div>
    );
};

// --- Lista completa sortable ---
//--- Componente para manejar la lista sortable de campos ---
// Este componente maneja la lógica de arrastrar y soltar para reordenar los campos
const SortableCampoList = ({ campos, setCampos }: { campos: Campo[], setCampos: (v: Campo[]) => void }) => {
    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = campos.findIndex(c => (c.nombre || `campo-${campos.indexOf(c)}`) === active.id);
            const newIndex = campos.findIndex(c => (c.nombre || `campo-${campos.indexOf(c)}`) === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                setCampos(arrayMove(campos, oldIndex, newIndex));
            }
        }
    };


    const onChange = (index: number, key: 'nombre' | 'tipo', value: string) => {
        const copia = [...campos];
        copia[index][key] = value;
        setCampos(copia);
    };

    const onRemove = (index: number) => {
        const nueva = [...campos];
        nueva.splice(index, 1);
        setCampos(nueva);
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={campos.map((c, i) => c.nombre || `campo-${i}`)} strategy={verticalListSortingStrategy}>
                {campos.map((campo, index) => (
                    <SortableItem
                        key={index}
                        campo={campo}
                        index={index}
                        onChange={onChange}
                        onRemove={onRemove}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
};


export default SortableCampoList;
