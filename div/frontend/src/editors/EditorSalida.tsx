// EditorSalida con soporte para subcampos, tipo de salida y tagPadre

import { useState } from 'react';
import React, { JSX } from 'react';
import CampoConFunciones from '../components/CampoConFunciones';

// --- Tipos e interfaces ---
interface Campo {
  nombre: string;
  tipo: string;
  subcampos?: Campo[];
}

interface Props {
  label: string;
  campos: Campo[];
  formatoSalida: string;
  tagPadre: string;
  onGuardar: (
    label: string,
    campos: Campo[],
    formatoSalida: string,
    tagPadre: string
  ) => void;
  onCancelar: () => void;
}

// --- Tipos simples permitidos ---
const tiposSimples = ['string', 'int', 'bool', 'date', 'float', 'json'];

// --- Control de duplicados en el nivel raíz ---
const tieneDuplicadosNivel0 = (campos: Campo[]): boolean => {
  const nombres = campos.map(c => c.nombre.trim());
  return nombres.some((n, i) => n && nombres.indexOf(n) !== i);
};

// --- Componente principal ---
const EditorSalida: React.FC<Props> = ({
  label,
  campos,
  formatoSalida,
  tagPadre: tagPadreInit,
  onGuardar,
  onCancelar
}) => {
  // --- Estados principales ---
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [camposEdit, setCamposEdit] = useState<Campo[]>(campos);
  const [formato, setFormato] = useState(formatoSalida || 'json');
  const [tagPadre, setTagPadre] = useState(tagPadreInit || '');

  // --- Estados para subcampos y jerarquía ---
  const [bufferStack, setBufferStack] = useState<Campo[][]>([]);
  const [contextStack, setContextStack] = useState<{ lista: Campo[]; index: number; nivel: number }[]>([]);
  const [nivelesConfirmados, setNivelesConfirmados] = useState<number[]>([0]);
  const [modoLectura, setModoLectura] = useState(false);
  const [campoJerarquia, setCampoJerarquia] = useState<string | null>(null);
  const [jerarquiaVisible, setJerarquiaVisible] = useState<Campo[] | null>(null);

  // --- Agregar campo a la lista ---
  const agregarCampo = (lista: Campo[], setLista: (v: Campo[]) => void) => {
    const nombres = lista.map(c => c.nombre.trim());
    if (nombres.includes('')) return alert('Complete todos los nombres antes de agregar uno nuevo.');
    setLista([...lista, { nombre: '', tipo: 'string' }]);
  };

  // --- Renderiza campos y subcampos recursivamente ---
  const renderCampos = (campos: Campo[], setCampos: (v: Campo[]) => void, nivel: number): JSX.Element[] => {
    return campos.map((campo, i) => {
      const puedeAgregarSubnivel = nivelesConfirmados.includes(nivel);
      const mostrarTipo = puedeAgregarSubnivel || campo.subcampos;

      return (
        <div
          key={i}
          style={{
            marginLeft: nivel * 20,
            marginBottom: 5,
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <input
            value={campo.nombre}
            onChange={e => {
              const copia = [...campos];
              copia[i].nombre = e.target.value;
              setCampos(copia);
            }}
            placeholder="Nombre del campo"
          />
          <select
            value={campo.tipo}
            onChange={e => {
              const copia = [...campos];
              copia[i].tipo = e.target.value;
              setCampos(copia);
            }}
          >
            {tiposSimples.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
            {mostrarTipo && (
              <>
                <option value="object">object</option>
                <option value="array">array</option>
              </>
            )}
          </select>
          {puedeAgregarSubnivel && (campo.tipo === 'object' || campo.tipo === 'array') && (
            <button
              title="Editar subcampos"
              onClick={() => {
                setBufferStack([campo.subcampos || [], ...bufferStack]);
                setContextStack([{ lista: campos, index: i, nivel }, ...contextStack]);
                setModoLectura(true);
              }}
            >🧩 Subcampos</button>
          )}
          {(campo.tipo === 'array' || campo.tipo === 'object') && campo.subcampos && (
            <button
              title="Ver jerarquía"
              onClick={() => {
                setJerarquiaVisible([campo]);
                setCampoJerarquia(campo.nombre);
              }}
            >🔍</button>
          )}
          <button
            title="Eliminar campo"
            onClick={() => {
              const nueva = [...campos];
              nueva.splice(i, 1);
              setCampos(nueva);
            }}
          >❌</button>
        </div>
      );
    });
  };

  // --- Confirmar edición de subcampos y volver al nivel anterior ---
  const confirmarSubnivel = () => {
    if (contextStack.length === 0) return;
    const [actual, ...restoContexto] = contextStack;
    const [buffer, ...restoBuffer] = bufferStack;
    actual.lista[actual.index].subcampos = buffer;
    setContextStack(restoContexto);
    setBufferStack(restoBuffer);
    setCamposEdit([...camposEdit]);
    setNivelesConfirmados([...nivelesConfirmados, actual.nivel + 1]);
    setModoLectura(false);
  };

  // --- Renderiza la jerarquía de campos recursivamente ---
  const renderJerarquia = (campos: Campo[], nivel = 0): JSX.Element[] => {
    return campos.map((campo, i) => (
      <div key={i} style={{ marginLeft: nivel * 20 }}>
        └─ {campo.nombre} ({campo.tipo})
        {campo.subcampos && renderJerarquia(campo.subcampos, nivel + 1)}
      </div>
    ));
  };

  // --- Validación recursiva de campos vacíos ---
  const tieneVacios = (lista: Campo[]): boolean =>
    lista.some(
      c =>
        !c.nombre ||
        c.nombre.trim() === '' ||
        (c.subcampos && tieneVacios(c.subcampos))
    );

  // --- Render principal ---
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '800px',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          display: 'flex',
          gap: '20px'
        }}
      >
        {/* Panel izquierdo: edición principal */}
        <div style={{ flex: 2 }}>
          <h3>Editar Nodo de Salida</h3>
          <label>Label:</label>
          <input value={nuevoLabel} onChange={e => setNuevoLabel(e.target.value)} />

          <label>Formato de Salida:</label>
          <select value={formato} onChange={e => setFormato(e.target.value)}>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="string">String</option>
          </select>

          <CampoConFunciones
            label="Tag Padre (opcional)"
            value={tagPadre}
            onChange={setTagPadre}
            placeholder="Ej: resultadoClientes, UUID(), 'clientes_' + Hoy()"
            categoriaFunciones="texto"
            mostrarFunciones={true}
          />

          <h4>📤 Campos de Salida</h4>
          <button onClick={() => agregarCampo(camposEdit, setCamposEdit)}>➕ Agregar Campo</button>
          {renderCampos(camposEdit, setCamposEdit, 0)}

          {/* Botones de acción */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => {
                if (tieneVacios(camposEdit)) {
                  alert('Hay campos vacíos en los campos de salida.');
                  return;
                }
                if (tieneDuplicadosNivel0(camposEdit)) {
                  alert('No puede haber campos con el mismo nombre en el nivel raíz.');
                  return;
                }
                onGuardar(nuevoLabel, camposEdit, formato, tagPadre);
              }}
            >💾 Guardar</button>
            <button onClick={onCancelar}>Cancelar</button>
          </div>
        </div>

        {/* Panel derecho: edición de subcampos */}
        {bufferStack.length > 0 && contextStack.length > 0 && (
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
            <h5>Subcampos - Nivel {contextStack[0]?.nivel + 1}</h5>
            {renderCampos(bufferStack[0], campos => {
              const nuevaPila = [...bufferStack];
              nuevaPila[0] = campos;
              setBufferStack(nuevaPila);
            }, contextStack[0]?.nivel + 1)}

           <button onClick={() => agregarCampo(bufferStack[0], campos => {
  const nuevaPila = [...bufferStack];
  nuevaPila[0] = campos;
  setBufferStack(nuevaPila);
})}>➕ Crear Subcampo</button>

            <button onClick={confirmarSubnivel}>⬅️ Volver</button>
            <button onClick={() => {
              setBufferStack([]);
              setContextStack([]);
              setModoLectura(false);
            }}>❌ Cancelar Subcampos</button>
          </div>
        )}

        {/* Panel de jerarquía de campos */}
        {jerarquiaVisible && (
          <div
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              background: '#f9f9f9',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              maxHeight: '80vh',
              overflowY: 'auto',
              zIndex: 1100
            }}
          >
            <h5>Jerarquía de "{campoJerarquia}"</h5>
            {renderJerarquia(jerarquiaVisible)}
            <button onClick={() => setJerarquiaVisible(null)} style={{ marginTop: '10px' }}>⬅️ Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorSalida;