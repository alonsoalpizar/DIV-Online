import React, { useState, useEffect } from 'react';
import AyudaFuncionTabla from '../components/Callouts/AyudaFuncionTabla';
import { obtenerFuncionesGlobales, FuncionGlobal } from '../utils/funcionesGlobales';
import { getApiBase } from '../utils/configuracion';
import SortableAsignacionesEntradaList from '../components/SortableAsignacionesEntradaList';
import { CampoEntrada } from '../components/SortableAsignacionEntrada';


// --- Tipos de datos ---
// Nota: Usando CampoEntrada importado para consistencia con drag & drop

interface Tabla {
  nombre: string;
  campos: { nombre: string; tipo: string }[];
}

interface Props {
  label: string;
  campos: CampoEntrada[];
  onGuardar: (nuevoLabel: string, nuevosCampos: CampoEntrada[], parametrosSalida: CampoEntrada[]) => void;
  onCancelar: () => void;
}

// --- Componente principal ---
const EditorEntrada: React.FC<Props> = ({ label, campos, onGuardar, onCancelar }) => {
  // --- Estados locales ---
  const [nuevoLabel, setNuevoLabel] = useState(label);
  const [camposLocal, setCamposLocal] = useState<CampoEntrada[]>(
    campos?.map(campo => ({
      ...campo,
      orden: campo.orden ?? (campos.indexOf(campo) + 1)
    })) || []
  );
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [funcionesSistema, setFuncionesSistema] = useState<FuncionGlobal[]>([]);

  // --- Carga de tablas y funciones de sistema ---
  useEffect(() => {
    fetch(`${getApiBase()}/tablas`)
      .then(res => res.json())
      .then(data => setTablas(data))
      .catch(err => console.warn('No se pudieron cargar tablas', err));

    obtenerFuncionesGlobales().then(funcs => {
      setFuncionesSistema(funcs.filter(f => f.origen === 'estatica'));
    });
  }, []);

  // --- Agrega un nuevo campo ---
  const agregarCampo = () => {
    const nuevoCampo: CampoEntrada = {
      nombre: '',
      tipo: 'string',
      orden: camposLocal.length + 1
    };
    setCamposLocal([...camposLocal, nuevoCampo]);
  };

  // Nota: Las funciones de actualización ahora están manejadas por los componentes sortables


  // Nota: Las funciones de manipulación de campos están ahora en los componentes sortables

  // --- Guarda los cambios, validando duplicados y campos incompletos ---
  const guardar = () => {
    // Validar campos incompletos
    const hayInvalidos = camposLocal.some(c => !c.nombre || !c.tipo);
    if (!nuevoLabel.trim() || hayInvalidos) {
      alert('⚠️ Verifique que el nombre del nodo y todos los campos estén completos.');
      return;
    }

    // Validar duplicados en nombres de campos
    const nombres = camposLocal.map(c => c.nombre.trim());
    const nombresSet = new Set<string>();
    const duplicado = nombres.some(n => {
      if (nombresSet.has(n)) return true;
      nombresSet.add(n);
      return false;
    });
    if (duplicado) {
      alert('⚠️ No puede haber campos con el mismo nombre.');
      return;
    }

    // Reflejar también en parametrosSalida para compatibilidad con edges
    const salida = camposLocal.map(({ nombre, tipo }) => ({ nombre, tipo }));
    onGuardar(nuevoLabel.trim(), camposLocal, salida);
  };

  // --- Render ---
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
          padding: 16,
          borderRadius: 8,
          width: '800px',
          maxHeight: '95vh',
          overflowY: 'auto',
          boxShadow: '0 0 10px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, flex: 1 }}>📝 Entrada</h3>
          <input
            value={nuevoLabel}
            onChange={e => setNuevoLabel(e.target.value)}
            placeholder="Nombre del nodo"
            style={{ 
              flex: 2,
              padding: '6px 8px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <button 
            onClick={agregarCampo}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ➕ Agregar Campo
          </button>
        </div>
        
        <SortableAsignacionesEntradaList 
          campos={camposLocal}
          setCampos={setCamposLocal}
          tablas={tablas}
          funcionesSistema={funcionesSistema}
        />

        {/* Botones de acción */}
        <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between' }}>
          <button 
            onClick={guardar}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💾 Guardar
          </button>
          <button 
            onClick={onCancelar}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>

        {/* Ayuda contextual compacta */}
        <div style={{ marginTop: 20 }}>
          <AyudaFuncionTabla />
        </div>
      </div>
    </div>
  );
};

export default EditorEntrada;
