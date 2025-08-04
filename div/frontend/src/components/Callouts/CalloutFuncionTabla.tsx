// src/components/Callouts/CalloutFuncionTabla.tsx
import React from 'react';

const CalloutFuncionTabla: React.FC = () => {
  return (
    <div
      style={{
        background: '#fdf6e3',
        borderLeft: '5px solid #f0b429',
        padding: '16px',
        borderRadius: '6px',
        marginTop: '16px',
        fontFamily: 'sans-serif',
        fontSize: '0.95em',
        color: '#333',
      }}
    >
      <h4 style={{ marginBottom: '10px' }}>
        📘 Uso de la función <code>Tabla(nombre, clave).Campo</code>
      </h4>

      <p>
        Esta función accede a un registro de una <strong>tabla local</strong> usando una
        clave (literal o campo), y retorna el valor de una columna específica mediante
        <code>.Campo</code>. Es útil para catálogos, estados o configuraciones.
      </p>

      <div style={{ marginTop: '10px' }}>
        <strong>✅ Ejemplos válidos con respuestas:</strong>
        <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
          <li><code>Tabla("Estados", "00").Descripcion == "Activo"</code></li>
          <li><code>Tabla("Clientes", Proceso.ClienteID).Nombre == "Juan"</code></li>
          <li><code>Tabla("TiposDocumento", "F01").CodigoAlterno == "F01A"</code></li>
        </ul>
      </div>

      <div style={{ marginTop: '12px' }}>
        <strong>❌ Ejemplo incorrecto:</strong>
        <ul style={{ paddingLeft: '20px', color: '#b71c1c' }}>
          <li>
            <code>Tabla("Cuentas", Cliente.ID) = 10</code> — No se puede comparar un
            objeto completo sin acceder a una propiedad concreta.
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '14px' }}>
        <strong>📌 También podés:</strong>
        <ul style={{ paddingLeft: '20px' }}>
          <li>
            <strong>Comparar valores directamente:</strong>{' '}
            <code>Tabla("Estados", Proceso.Codigo).Descripcion == "Activo"</code>
          </li>
          <li>
            <strong>Aplicar funciones de texto:</strong>
            <ul style={{ paddingLeft: '20px' }}>
              <li><code>Tabla("Estados", Proceso.Codigo).Descripcion.includes("Correcto")</code></li>
              <li><code>Tabla("Estados", Proceso.Codigo).Descripcion.startsWith("El")</code></li>
            </ul>
          </li>
          <li>
            <strong>Incluir en condiciones compuestas:</strong><br />
            <code>
              Tabla("Estados", Proceso.Codigo).Descripcion == "Error" && Proceso.Monto &gt; 1000
            </code>
          </li>
          <li>
            <strong>Usarlo en asignaciones entre nodos:</strong><br />
            <code>
              Salida.EstadoTexto = Tabla("Estados", Proceso.Codigo).Descripcion
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CalloutFuncionTabla;
