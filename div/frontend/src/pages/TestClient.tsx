import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Canal } from '../types/canal';
import { TestRequest, TestResponse } from '../types/testCliente';
import { getApiBase } from '../utils/configuracion';
import { FaPlay, FaCopy, FaTrash } from 'react-icons/fa';

const TestClient: React.FC = () => {
  const [canales, setCanales] = useState<Canal[]>([]);
  const [canalSeleccionado, setCanalSeleccionado] = useState<string>('');
  const [trigger, setTrigger] = useState<string>('');
  const [tramaJSON, setTramaJSON] = useState<string>('{}');
  const [respuesta, setRespuesta] = useState<TestResponse | null>(null);
  const [ejecutando, setEjecutando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [cargandoTriggers, setCargandoTriggers] = useState<boolean>(false);
  const [estadoConexion, setEstadoConexion] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [mostrarDebugCompleto, setMostrarDebugCompleto] = useState<boolean>(false);

  useEffect(() => {
    verificarConexion();
    cargarCanales();
  }, []);

  const verificarConexion = async () => {
    setEstadoConexion('checking');
    try {
      await axios.get(`${getApiBase()}/ping`, { timeout: 3000 });
      setEstadoConexion('connected');
    } catch (error) {
      setEstadoConexion('disconnected');
      setError('No se puede conectar con el backend. Verifique que esté ejecutándose.');
    }
  };

  const cargarCanales = async () => {
    try {
      const response = await axios.get(`${getApiBase()}/canales`);
      setCanales(response.data);
    } catch (error) {
      console.error('Error cargando canales:', error);
      setError('Error cargando canales');
    }
  };

  const cargarTriggersDelCanal = async (canalCodigo: string) => {
    if (!canalCodigo) {
      setTriggers([]);
      return;
    }

    setCargandoTriggers(true);
    try {
      // Encontrar el canal por código para obtener su ID
      const canal = canales.find(c => c.codigo === canalCodigo);
      if (!canal) {
        setTriggers([]);
        return;
      }

      const response = await axios.get(`${getApiBase()}/canal-procesos/${canal.id}`);
      const triggersUnicos = [...new Set(response.data.map((cp: any) => cp.trigger))] as string[];
      setTriggers(triggersUnicos);
    } catch (error) {
      console.error('Error cargando triggers:', error);
      setTriggers([]);
    } finally {
      setCargandoTriggers(false);
    }
  };

  const handleCanalChange = (nuevoCodigo: string) => {
    setCanalSeleccionado(nuevoCodigo);
    setTrigger(''); // Limpiar trigger cuando cambia el canal
    setTramaJSON('{}'); // Resetear trama
    cargarTriggersDelCanal(nuevoCodigo);
  };

  const handleTriggerChange = (nuevoTrigger: string) => {
    setTrigger(nuevoTrigger);
    if (canalSeleccionado && nuevoTrigger) {
      generarPlantillaParametros(canalSeleccionado, nuevoTrigger);
    }
  };

  const generarPlantillaParametros = async (canalCodigo: string, trigger: string) => {
    try {
      const response = await axios.post(`${getApiBase()}/test-cliente/parametros`, {
        canalCodigo: canalCodigo,
        trigger: trigger
      });

      if (response.data.plantilla && Object.keys(response.data.plantilla).length > 0) {
        // Si hay parámetros, generar plantilla formateada
        setTramaJSON(JSON.stringify(response.data.plantilla, null, 2));
      } else {
        // Si no hay parámetros, usar objeto vacío
        setTramaJSON('{}');
      }
    } catch (error) {
      console.error('Error obteniendo parámetros:', error);
      // En caso de error, mantener objeto vacío
      setTramaJSON('{}');
    }
  };

  const ejecutarTest = async () => {
    // Validaciones detalladas
    const errores: string[] = [];
    
    if (!canalSeleccionado) errores.push('Debe seleccionar un canal');
    if (!trigger.trim()) errores.push('Debe especificar un trigger/método');
    if (!tramaJSON.trim()) errores.push('Debe proporcionar una trama JSON');

    // Validar JSON
    if (tramaJSON.trim()) {
      try {
        JSON.parse(tramaJSON);
      } catch (parseError) {
        errores.push('La trama debe ser un JSON válido. Revise la sintaxis.');
      }
    }

    if (errores.length > 0) {
      setError(errores.join(' • '));
      return;
    }

    setEjecutando(true);
    setError('');
    setRespuesta(null);

    try {
      const trama = JSON.parse(tramaJSON);
      const request: TestRequest = {
        canalCodigo: canalSeleccionado,
        trigger: trigger.trim(),
        trama: trama
      };

      const response = await axios.post(`${getApiBase()}/test-cliente/ejecutar`, request);
      setRespuesta(response.data);

      // Mostrar mensaje más específico según el resultado
      if (!response.data.exitoso && response.data.error) {
        if (response.data.error.includes('no se encontró proceso')) {
          setError(`No hay proceso configurado para el canal ${canalSeleccionado} con trigger "${trigger}"`);
        } else if (response.data.error.includes('BackendMotor')) {
          setError('Error de comunicación con el motor de ejecución. Verifique que esté ejecutándose.');
        }
      }
    } catch (error: any) {
      console.error('Error ejecutando test:', error);
      
      // Manejo de errores más específico
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        setError('Error de red. Verifique que el backend esté ejecutándose en el puerto 30000.');
      } else if (error.response?.status === 404) {
        setError('Endpoint no encontrado. Verifique que el backend tenga la versión actualizada.');
      } else if (error.response?.status >= 500) {
        setError('Error interno del servidor. Revise los logs del backend.');
      } else {
        setError(error.response?.data?.error || error.message || 'Error ejecutando el test');
      }
    } finally {
      setEjecutando(false);
    }
  };

  const limpiarFormulario = () => {
    setCanalSeleccionado('');
    setTrigger('');
    setTramaJSON('{}');
    setRespuesta(null);
    setError('');
  };

  const usarTramaVacia = () => {
    setTramaJSON('{}');
  };

  const usarEjemploTrama = () => {
    setTramaJSON('{\n  "campo1": "valor1",\n  "campo2": "valor2"\n}');
  };

  const copiarRespuesta = () => {
    if (respuesta) {
      navigator.clipboard.writeText(JSON.stringify(respuesta, null, 2));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <h1>Cliente de Pruebas Interno</h1>
          <p>Prueba procesos directamente sin salir del sistema</p>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${estadoConexion}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {estadoConexion === 'checking' && 'Verificando conexión...'}
              {estadoConexion === 'connected' && 'Conectado'}
              {estadoConexion === 'disconnected' && 'Desconectado'}
            </span>
            {estadoConexion === 'disconnected' && (
              <button 
                className="retry-button"
                onClick={verificarConexion}
                title="Reintentar conexión"
              >
                ↻
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="test-client-container">
        
        {/* Panel de Configuración */}
        <div className="test-form-panel">
          <h2>Configuración del Test</h2>
          
          <div className="form-group">
            <label htmlFor="canal">Canal:</label>
            <select
              id="canal"
              value={canalSeleccionado}
              onChange={(e) => handleCanalChange(e.target.value)}
              className="form-control"
            >
              <option value="">Selecciona un canal...</option>
              {canales.map((canal) => (
                <option key={canal.id} value={canal.codigo}>
                  {canal.codigo} - {canal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="trigger">Método/Trigger:</label>
            <input
              type="text"
              id="trigger"
              value={trigger}
              onChange={(e) => handleTriggerChange(e.target.value)}
              className="form-control"
              placeholder="ej: api, webhook, scheduled"
              disabled={cargandoTriggers}
            />
            {triggers.length > 0 && (
              <div className="trigger-suggestions">
                <small>Triggers disponibles para {canalSeleccionado}:</small>
                <div className="trigger-tags">
                  {triggers.map((t, index) => (
                    <button
                      key={index}
                      type="button"
                      className="trigger-tag"
                      onClick={() => handleTriggerChange(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {cargandoTriggers && (
              <small className="loading-text">Cargando triggers...</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="trama">Trama de Entrada (JSON):</label>
            <div className="trama-helpers">
              <button 
                type="button"
                className="helper-btn"
                onClick={usarTramaVacia}
                title="Para procesos GET que no necesitan parámetros"
              >
                📄 Trama Vacía
              </button>
              <button 
                type="button"
                className="helper-btn"
                onClick={usarEjemploTrama}
                title="Plantilla de ejemplo con campos"
              >
                📝 Ejemplo
              </button>
            </div>
            <textarea
              id="trama"
              value={tramaJSON}
              onChange={(e) => setTramaJSON(e.target.value)}
              className="form-control"
              rows={8}
              style={{ fontFamily: 'monospace', fontSize: '14px' }}
              placeholder='Para procesos GET usar: {}'
            />
            <small className="trama-hint">
              💡 <strong>Procesos GET:</strong> Usar <code>{"{}"}</code> (objeto vacío) si no necesitan parámetros
            </small>
          </div>

          <div className="form-actions">
            <button
              onClick={ejecutarTest}
              disabled={ejecutando}
              className="btn btn-primary"
            >
              <FaPlay /> {ejecutando ? 'Ejecutando...' : 'Ejecutar Test'}
            </button>
            
            <button
              onClick={limpiarFormulario}
              className="btn btn-secondary"
            >
              <FaTrash /> Limpiar
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* Panel de Resultados */}
        <div className="test-results-panel">
          <h2>Resultados</h2>
          
          {respuesta ? (
            <div className="results-container">
              <div className="result-header">
                <span className={`status-badge ${respuesta.exitoso ? 'success' : 'error'}`}>
                  {respuesta.exitoso ? '✓ Exitoso' : '✗ Error'}
                </span>
                {respuesta.duracion && (
                  <span className="duration-badge">⏱ {respuesta.duracion}</span>
                )}
                <button
                  onClick={copiarRespuesta}
                  className="btn btn-small"
                  title="Copiar respuesta completa"
                >
                  <FaCopy />
                </button>
              </div>
              
              <div className="result-content">
                {/* Resumen del resultado */}
                <div className="result-summary">
                  {respuesta.exitoso ? (
                    <div className="success-summary">
                      <h4>✅ Ejecución Exitosa</h4>
                      {respuesta.mensaje && <p>{respuesta.mensaje}</p>}
                    </div>
                  ) : (
                    <div className="error-summary">
                      <h4>❌ Error en la Ejecución</h4>
                      {respuesta.error && <div className="error-message">{respuesta.error}</div>}
                    </div>
                  )}
                </div>

                {/* Resultado principal (datos útiles) */}
                {respuesta.resultado && !respuesta.resultado.debugInfo && (
                  <div className="main-result">
                    <h4>📊 Resultado:</h4>
                    <pre className="result-data">
                      {JSON.stringify(respuesta.resultado, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Información de debug (colapsable) */}
                {respuesta.resultado?.debugInfo && (
                  <div className="debug-section-container">
                    <button 
                      className="debug-toggle"
                      onClick={() => setMostrarDebugCompleto(!mostrarDebugCompleto)}
                    >
                      🔍 Información de Debug {mostrarDebugCompleto ? '▲' : '▼'}
                    </button>
                    
                    {mostrarDebugCompleto && (
                      <div className="debug-info">
                        <div className="debug-item">
                          <strong>HTTP Status:</strong> {respuesta.resultado.debugInfo.httpStatus} - {respuesta.resultado.debugInfo.httpStatusText}
                        </div>
                        {respuesta.resultado.debugInfo.errorMotor && (
                          <div className="debug-item">
                            <strong>Error del Motor:</strong>
                            <pre className="debug-code">{JSON.stringify(respuesta.resultado.debugInfo.errorMotor, null, 2)}</pre>
                          </div>
                        )}
                        {respuesta.resultado.debugInfo.bodyRaw && (
                          <div className="debug-item">
                            <strong>Respuesta Raw del BackendMotor:</strong>
                            <pre className="debug-code">{respuesta.resultado.debugInfo.bodyRaw}</pre>
                          </div>
                        )}
                        {respuesta.resultado.requestEnviado && (
                          <div className="debug-item">
                            <strong>Request Enviado:</strong>
                            <pre className="debug-code">{JSON.stringify(respuesta.resultado.requestEnviado, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Botón para ver respuesta completa */}
                <div className="full-response-toggle">
                  <details>
                    <summary>📄 Ver Respuesta JSON Completa</summary>
                    <pre className="full-response-content">
                      {JSON.stringify(respuesta, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-results">
              <p>Los resultados aparecerán aquí después de ejecutar un test</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .test-client-container {
          margin-top: 2rem;
        }
        
        .test-form-panel {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .test-results-panel {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          width: 100%;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .results-container {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }
        
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }
        
        .status-badge.error {
          background: #f8d7da;
          color: #721c24;
        }
        
        .duration-badge {
          padding: 0.25rem 0.75rem;
          background: #e2e3e5;
          border-radius: 16px;
          font-size: 0.875rem;
        }
        
        .empty-results {
          padding: 3rem;
          text-align: center;
          color: #666;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }
        
        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .trigger-suggestions {
          margin-top: 0.5rem;
        }

        .trigger-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .trigger-tag {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 16px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          color: #0066cc;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trigger-tag:hover {
          background: #d0e8ff;
          border-color: #80c7ff;
        }

        .loading-text {
          color: #666;
          font-style: italic;
        }

        .trama-helpers {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .helper-btn {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .helper-btn:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .trama-hint {
          display: block;
          margin-top: 0.5rem;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .trama-hint code {
          background: #f8f9fa;
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          font-family: monospace;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header-left h1 {
          margin: 0 0 0.5rem 0;
        }

        .header-left p {
          margin: 0;
          color: #666;
        }

        .connection-status {
          margin-top: 0.5rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-indicator.checking .status-dot {
          background: #ffa500;
          animation: pulse 1.5s infinite;
        }

        .status-indicator.connected .status-dot {
          background: #28a745;
        }

        .status-indicator.disconnected .status-dot {
          background: #dc3545;
        }

        .status-indicator.connected .status-text {
          color: #28a745;
        }

        .status-indicator.disconnected .status-text {
          color: #dc3545;
        }

        .status-indicator.checking .status-text {
          color: #ffa500;
        }

        .retry-button {
          background: none;
          border: 1px solid #dc3545;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          color: #dc3545;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: #dc3545;
          color: white;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .result-summary {
          margin-bottom: 1.5rem;
        }

        .success-summary {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 4px;
          padding: 1rem;
        }

        .success-summary h4 {
          margin: 0 0 0.5rem 0;
          color: #2f855a;
        }

        .error-summary {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 4px;
          padding: 1rem;
        }

        .error-summary h4 {
          margin: 0 0 0.5rem 0;
          color: #c53030;
        }

        .error-message {
          font-family: monospace;
          font-size: 0.875rem;
          color: #2d3748;
          background: #f7fafc;
          padding: 0.5rem;
          border-radius: 4px;
          margin-top: 0.5rem;
        }

        .main-result {
          margin-bottom: 1.5rem;
        }

        .main-result h4 {
          margin: 0 0 0.75rem 0;
          color: #2d3748;
        }

        .result-data {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          max-height: 300px;
          overflow: auto;
        }

        .debug-section-container {
          margin-bottom: 1.5rem;
        }

        .debug-toggle {
          background: #e2e8f0;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          padding: 0.75rem 1rem;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #2d3748;
          transition: background-color 0.2s;
        }

        .debug-toggle:hover {
          background: #cbd5e0;
        }

        .debug-info {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-top: none;
          padding: 1rem;
          border-radius: 0 0 4px 4px;
        }

        .debug-item {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .debug-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .debug-item strong {
          color: #2d3748;
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .debug-code {
          background: #1a202c;
          color: #f7fafc;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          overflow-x: auto;
          margin: 0;
          max-height: 200px;
          overflow-y: auto;
        }

        .full-response-toggle {
          margin-top: 1.5rem;
        }

        .full-response-toggle details {
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }

        .full-response-toggle summary {
          background: #f7fafc;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-weight: 500;
          color: #2d3748;
          border-radius: 4px 4px 0 0;
        }

        .full-response-toggle summary:hover {
          background: #edf2f7;
        }

        .full-response-content {
          background: #f7fafc;
          padding: 1rem;
          margin: 0;
          font-size: 0.75rem;
          max-height: 400px;
          overflow: auto;
          border-radius: 0 0 4px 4px;
        }
      `}</style>
    </div>
  );
};

export default TestClient;