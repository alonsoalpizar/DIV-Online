// src/components/Callouts/AyudaFuncionTabla.tsx
import React, { useState } from 'react';
import ModalFuncionTabla from './Modals/ModalFuncionTabla';

const AyudaFuncionTabla: React.FC = () => {
  const [mostrarAyudaTabla, setMostrarAyudaTabla] = useState(false);

  return (
    <>
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setMostrarAyudaTabla(true)}
          style={{
            background: '#f0b429',
            padding: '6px 10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🛈 ¿Cómo usar la función Tabla()?
        </button>
      </div>

      <ModalFuncionTabla
        visible={mostrarAyudaTabla}
        onClose={() => setMostrarAyudaTabla(false)}
      />
    </>
  );
};

export default AyudaFuncionTabla;
