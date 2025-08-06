import React, { useState, useEffect } from 'react';
import { getApiBase } from '../utils/configuracion';
import AyudaFuncionTabla from './Callouts/AyudaFuncionTabla';

interface Tabla {
  id: string;
  nombre: string;
  campos: CampoTabla[];
}

interface CampoTabla {
  nombre: string;
  tipo: string;
}

interface CampoDisponible {
  nombre: string;
  tipo: string;
}

interface Props {
  onInsertarFuncion: (funcionTexto: string) => void;
  visible: boolean;
  onClose: () => void;
  camposDisponibles?: CampoDisponible[]; // Campos del nodo actual
}

const SelectorFuncionTabla: React.FC<Props> = ({ 
  onInsertarFuncion, 
  visible, 
  onClose, 
  camposDisponibles = [] 
}) => {
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState('');
  const [clave, setClave] = useState('');
  const [campo, setCampo] = useState('');
  const [claveEsCampo, setClaveEsCampo] = useState(false);

  useEffect(() => {
    if (visible) {
      fetch(`${getApiBase()}/tablas`)
        .then(res => res.json())
        .then(data => setTablas(data))
        .catch(err => console.warn('No se pudieron cargar tablas', err));
    }
  }, [visible]);

  const obtenerCamposDeTabla = (nombreTabla: string) => {
    if (!nombreTabla) return [];
    const tabla = tablas.find(t => t.nombre === nombreTabla);
    return tabla?.campos || [];
  };

  const generarFuncionTabla = () => {
    if (!tablaSeleccionada || !clave || !campo) {
      return '🔧 Selecciona tabla, clave y campo';
    }
    
    const valorClave = claveEsCampo ? clave : `"${clave}"`;
    return `Tabla("${tablaSeleccionada}", ${valorClave}).${campo}`;
  };

  const insertarFuncion = () => {
    const funcionCompleta = generarFuncionTabla();
    if (funcionCompleta.includes('🔧')) {
      alert('Debes seleccionar tabla, clave y campo');
      return;
    }
    onInsertarFuncion(funcionCompleta);
    onClose();
  };

  const limpiarFormulario = () => {
    setTablaSeleccionada('');
    setClave('');
    setCampo('');
    setClaveEsCampo(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '25px',
        maxWidth: '650px',
        width: '90%',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'relative',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 12,
          right: 15,
          background: 'transparent',
          border: 'none',
          fontSize: '1.4em',
          cursor: 'pointer',
          color: '#999',
          lineHeight: 1
        }}>
          ✖
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
          📊 Constructor de Función Tabla()
        </h3>

        <div style={{ 
          display: 'grid', 
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: '20px'
        }}>
          {/* Selector de Tabla */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              🗃️ Tabla:
            </label>
            <select
              value={tablaSeleccionada}
              onChange={(e) => {
                setTablaSeleccionada(e.target.value);
                setCampo(''); // Reset campo when table changes
              }}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">-- Seleccione tabla --</option>
              {tablas.map((t) => (
                <option key={t.nombre} value={t.nombre}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Clave */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              🔑 Clave:
            </label>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={claveEsCampo}
                  onChange={(e) => {
                    setClaveEsCampo(e.target.checked);
                    setClave(''); // Reset clave when changing type
                  }}
                  style={{ marginRight: '5px' }}
                />
                La clave es un campo (no literal)
              </label>
            </div>

            {claveEsCampo ? (
              // Selector de campos disponibles
              <select
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: camposDisponibles.length === 0 ? '#f5f5f5' : 'white'
                }}
                disabled={camposDisponibles.length === 0}
              >
                <option value="">-- Seleccionar campo --</option>
                {camposDisponibles.map((campo) => (
                  <option key={campo.nombre} value={campo.nombre}>
                    {campo.nombre} ({campo.tipo})
                  </option>
                ))}
              </select>
            ) : (
              // Input de texto para valores literales
              <input
                type="text"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="ej: 001, ACTIVO, F01"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            )}

            {claveEsCampo && camposDisponibles.length === 0 && (
              <div style={{ 
                fontSize: '11px', 
                color: '#666', 
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                💡 No hay campos disponibles en este contexto
              </div>
            )}
          </div>

          {/* Campo Resultado */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              📝 Campo:
            </label>
            <select
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              disabled={!tablaSeleccionada}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: !tablaSeleccionada ? '#f5f5f5' : 'white'
              }}
            >
              <option value="">-- Campo resultado --</option>
              {obtenerCamposDeTabla(tablaSeleccionada).map((c) => (
                <option key={c.nombre} value={c.nombre}>
                  {c.nombre} ({c.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vista Previa */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>🔍 Vista previa:</strong>
          <code style={{
            display: 'block',
            padding: '8px 12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'Monaco, "Courier New", monospace',
            fontSize: '13px',
            color: generarFuncionTabla().includes('🔧') ? '#dc3545' : '#198754'
          }}>
            {generarFuncionTabla()}
          </code>
        </div>

        {/* Botones de Acción */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={limpiarFormulario}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Limpiar
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Cancelar
            </button>
            <button
              onClick={insertarFuncion}
              disabled={generarFuncionTabla().includes('🔧')}
              style={{
                background: generarFuncionTabla().includes('🔧') ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: generarFuncionTabla().includes('🔧') ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              ✅ Insertar Función
            </button>
          </div>
        </div>

        {/* Ayuda */}
        <AyudaFuncionTabla />
      </div>
    </div>
  );
};

export default SelectorFuncionTabla;