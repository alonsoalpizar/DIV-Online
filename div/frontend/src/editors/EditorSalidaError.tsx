// EditorSalidaError: Editor de nodos de salida de error con campos estándar y edición dinámica

import { useEffect, useState } from 'react';
import { Edge } from 'reactflow';

// --- Tipos e interfaces ---
interface Campo {
  nombre: string;
  tipo: string;
}

interface Props {
  label: string;
  nodoId: string;
  edges: Edge[];
  campos: Campo[];
  onGuardar: (label: string, campos: Campo[]) => void;
  onCancelar: () => void;
}

// --- Componente principal ---
const EditorSalidaError: React.FC<Props> = ({
  label,
  nodoId,
  edges,
  campos,
  onGuardar,
  onCancelar
}) => {
  // --- Estados principales ---
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [camposEdit, setCamposEdit] = useState<Campo[]>([]);

  // --- Efecto: Inicializa campos de error estándar si corresponde ---
  useEffect(() => {
    const recibeError = Array.isArray(edges) && edges.some(
      edge => edge.target === nodoId && edge.data?.esError
    );

    const camposError: Campo[] = [
      { nombre: 'codigoError', tipo: 'string' },
      { nombre: 'mensajeError', tipo: 'string' },
      { nombre: 'detalleError', tipo: 'string' }
    ];

    const existentes = campos.filter(
      c => !['codigoError', 'mensajeError', 'detalleError'].includes(c.nombre)
    );

    setCamposEdit(recibeError ? [...existentes, ...camposError] : [...existentes]);
  }, [edges, nodoId, campos]);

  // --- Helpers para edición de campos ---
  const actualizarCampo = (i: number, campo: Campo) => {
    const copia = [...camposEdit];
    copia[i] = campo;
    setCamposEdit(copia);
  };

  const agregarCampo = () => {
    // Validar que no haya campos vacíos antes de agregar uno nuevo
    if (camposEdit.some(c => !c.nombre || c.nombre.trim() === '')) {
      alert('Complete todos los nombres antes de agregar uno nuevo.');
      return;
    }
    setCamposEdit([...camposEdit, { nombre: '', tipo: 'string' }]);
  };

  const eliminarCampo = (i: number) => {
    setCamposEdit(camposEdit.filter((_, index) => index !== i));
  };

  // --- Validación recursiva de campos vacíos ---
  const tieneVacios = camposEdit.some(
    c => !c.nombre || c.nombre.trim() === ''
  );

  // --- Render principal ---
  return (
    <div className="modal">
      <div className="modal-content">
        <h3>🟥 Editar Nodo de Salida de Error</h3>

        <label>Etiqueta:</label>
        <input
          value={nuevoLabel}
          onChange={e => setNuevoLabel(e.target.value)}
        />

        <h4>Campos de salida de error</h4>
        <button onClick={agregarCampo}>➕ Agregar</button>
        {camposEdit.map((campo, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: 6 }}>
            <input
              placeholder="nombre"
              value={campo.nombre}
              onChange={e => actualizarCampo(i, { ...campo, nombre: e.target.value })}
            />
            <select
              value={campo.tipo}
              onChange={e => actualizarCampo(i, { ...campo, tipo: e.target.value })}
            >
              <option value="string">string</option>
              <option value="int">int</option>
              <option value="bool">bool</option>
            </select>
            <button title="Eliminar campo" onClick={() => eliminarCampo(i)}>❌</button>
          </div>
        ))}

        {/* Botones de acción */}
        <div className="modal-actions" style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              if (tieneVacios) {
                alert('Hay campos vacíos en los campos de salida de error.');
                return;
              }
              onGuardar(nuevoLabel, camposEdit);
            }}
          >💾 Guardar</button>
          <button onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};
export default EditorSalidaError;