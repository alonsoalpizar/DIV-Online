// src/components/Modals/ModalFuncionTabla.tsx
import React from 'react';
import CalloutFuncionTabla from '../CalloutFuncionTabla';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ModalFuncionTabla: React.FC<Props> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        maxWidth: '600px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        {/* Botón "X" arriba a la derecha */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'transparent',
          border: 'none',
          fontSize: '1.2em',
          cursor: 'pointer',
          color: '#888'
        }}>
          ✖
        </button>

        <h3 style={{ marginTop: 0 }}>📊 Cómo usar la función Tabla()</h3>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <CalloutFuncionTabla />
        </div>

        {/* Botón inferior de Cerrar */}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: '#e0e0e0',
              border: '1px solid #ccc',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFuncionTabla;
