import React from 'react';
import './DocumentationLayout.css';

interface Props {
  children: React.ReactNode;
}

const DocumentationLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="documentation-layout">
      {/* Header simple */}
      <div className="doc-layout-header">
        <div className="doc-layout-brand">
          <span className="doc-logo">📖</span>
          <div>
            <h1 className="doc-layout-title">DIV - Documentación</h1>
            <p className="doc-layout-subtitle">Designer de Integración Visual</p>
          </div>
        </div>
        <button 
          className="doc-close-btn" 
          onClick={() => window.close()}
          title="Cerrar documentación"
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div className="doc-layout-content">
        {children}
      </div>

      {/* Footer simple */}
      <div className="doc-layout-footer">
        <p>© 2024 DIV - Designer de Integración Visual | Documentación de Campos Extra</p>
      </div>
    </div>
  );
};

export default DocumentationLayout;