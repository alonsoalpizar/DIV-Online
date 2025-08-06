import { useState, useEffect } from 'react';
import { EjecucionTarea } from '../types/tareaProgramada';
import { tareasProgramadasService } from '../services/tareasProgramadasService';

interface Props {
  tareaProgramadaId: string;
  nombreTarea: string;
  isOpen: boolean;
  onClose: () => void;
}

const EjecucionesModal: React.FC<Props> = ({ tareaProgramadaId, nombreTarea, isOpen, onClose }) => {
  const [ejecuciones, setEjecuciones] = useState<EjecucionTarea[]>([]);
  const [cargando, setCargando] = useState(false);
  const [ejecucionSeleccionada, setEjecucionSeleccionada] = useState<EjecucionTarea | null>(null);

  useEffect(() => {
    if (isOpen && tareaProgramadaId) {
      cargarEjecuciones();
    }
  }, [isOpen, tareaProgramadaId]);

  const cargarEjecuciones = async () => {
    setCargando(true);
    try {
      const data = await tareasProgramadasService.obtenerEjecuciones(tareaProgramadaId);
      setEjecuciones(data);
    } catch (error) {
      console.error('Error al cargar ejecuciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'exitoso': return '#28a745';
      case 'error': return '#dc3545';
      case 'ejecutando': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'exitoso': return '✅';
      case 'error': return '❌';
      case 'ejecutando': return '⏳';
      default: return '❓';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES');
  };

  const formatearDuracion = (duracionMs: number) => {
    if (duracionMs < 1000) return `${duracionMs}ms`;
    if (duracionMs < 60000) return `${(duracionMs / 1000).toFixed(1)}s`;
    return `${(duracionMs / 60000).toFixed(1)}min`;
  };

  const verDetalle = (ejecucion: EjecucionTarea) => {
    setEjecucionSeleccionada(ejecucion);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        minWidth: '800px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Historial de Ejecuciones - {nombreTarea}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Cargando ejecuciones...
          </div>
        ) : ejecucionSeleccionada ? (
          // Vista de detalle
          <div>
            <button
              onClick={() => setEjecucionSeleccionada(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Volver a la lista
            </button>
            
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
              <h4>Detalle de Ejecución</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <strong>Estado:</strong>
                  <span style={{ color: getEstadoColor(ejecucionSeleccionada.estado), marginLeft: '8px' }}>
                    {getEstadoIcon(ejecucionSeleccionada.estado)} {ejecucionSeleccionada.estado.toUpperCase()}
                  </span>
                </div>
                <div>
                  <strong>Duración:</strong> {formatearDuracion(ejecucionSeleccionada.duracionMs)}
                </div>
                <div>
                  <strong>Fecha:</strong> {formatearFecha(ejecucionSeleccionada.fechaEjecucion)}
                </div>
                <div>
                  <strong>Trigger:</strong> {ejecucionSeleccionada.trigger}
                </div>
              </div>

              {ejecucionSeleccionada.mensajeError && (
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ color: '#dc3545' }}>Error:</strong>
                  <div style={{ 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}>
                    {ejecucionSeleccionada.mensajeError}
                  </div>
                </div>
              )}

              {ejecucionSeleccionada.resultado && (
                <div>
                  <strong>Resultado:</strong>
                  <pre style={{
                    backgroundColor: '#e9ecef',
                    padding: '15px',
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(ejecucionSeleccionada.resultado, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Vista de lista
          <div>
            <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
              {ejecuciones.length === 0 ? 'No hay ejecuciones registradas' : `${ejecuciones.length} ejecuciones encontradas`}
            </div>

            {ejecuciones.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Estado</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Fecha</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Duración</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Trigger</th>
                      <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ejecuciones.map((ejecucion) => (
                      <tr key={ejecucion.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <span style={{ color: getEstadoColor(ejecucion.estado) }}>
                            {getEstadoIcon(ejecucion.estado)} {ejecucion.estado.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {formatearFecha(ejecucion.fechaEjecucion)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {formatearDuracion(ejecucion.duracionMs)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: ejecucion.trigger === 'manual' ? '#e3f2fd' : '#f3e5f5',
                            color: ejecucion.trigger === 'manual' ? '#1976d2' : '#7b1fa2'
                          }}>
                            {ejecucion.trigger}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <button
                            onClick={() => verDetalle(ejecucion)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={cargarEjecuciones}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                🔄 Actualizar
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EjecucionesModal;