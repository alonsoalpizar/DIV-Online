import { useState } from 'react';
import { TareaProgramada } from '../types/tareaProgramada';
import { tareasProgramadasService } from '../services/tareasProgramadasService';
import { descripcionCron } from '../utils/cronUtils';
import EjecucionesModal from './EjecucionesModal';

interface Props {
  tareas: TareaProgramada[];
  onEditar: (tarea: TareaProgramada) => void;
  onEliminar: (id: string) => void;
  onRecargar: () => void;
}

const TareaProgramadaList: React.FC<Props> = ({ tareas, onEditar, onEliminar, onRecargar }) => {
  const [ejecutando, setEjecutando] = useState<string | null>(null);
  const [modalEjecuciones, setModalEjecuciones] = useState<{
    isOpen: boolean;
    tareaProgramadaId: string;
    nombreTarea: string;
  }>({
    isOpen: false,
    tareaProgramadaId: '',
    nombreTarea: ''
  });

  const handleEliminar = async (id: string, nombre: string) => {
    if (window.confirm(`¿Está seguro de eliminar la tarea "${nombre}"?`)) {
      try {
        await onEliminar(id);
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
      }
    }
  };

  const handleCambiarEstado = async (id: string, activo: boolean) => {
    try {
      await tareasProgramadasService.cambiarEstado(id, activo);
      onRecargar();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la tarea');
    }
  };

  const handleEjecutarManual = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Ejecutar manualmente la tarea "${nombre}"?`)) return;
    
    setEjecutando(id);
    try {
      const resultado = await tareasProgramadasService.ejecutarManual(id);
      alert(`Tarea ejecutada: ${resultado.mensaje}`);
      onRecargar();
    } catch (error) {
      console.error('Error al ejecutar tarea:', error);
      alert('Error al ejecutar la tarea manualmente');
    } finally {
      setEjecutando(null);
    }
  };

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleString('es-ES');
  };

  const verHistorial = (tarea: TareaProgramada) => {
    setModalEjecuciones({
      isOpen: true,
      tareaProgramadaId: tarea.id,
      nombreTarea: tarea.nombre
    });
  };

  const cerrarModal = () => {
    setModalEjecuciones({
      isOpen: false,
      tareaProgramadaId: '',
      nombreTarea: ''
    });
  };

  const getEstadoColor = (activo: boolean) => ({
    color: activo ? '#28a745' : '#6c757d',
    fontWeight: 'bold' as const
  });

  if (tareas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No hay tareas programadas configuradas.</p>
        <p>Haga clic en "Nueva Tarea" para comenzar.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Nombre</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Proceso</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Programación</th>
            <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Estado</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Última Ejecución</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Próxima Ejecución</th>
            <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map((tarea) => (
            <tr key={tarea.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                <div>
                  <strong>{tarea.nombre}</strong>
                  {tarea.descripcion && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {tarea.descripcion}
                    </div>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                {tarea.proceso?.nombre || tarea.procesoId}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                  Canal: {tarea.canalCodigo || 'Interno (SCHEDULER)'}
                </div>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                <div style={{ fontSize: '12px' }}>
                  {descripcionCron(tarea.expresionCron)}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {tarea.expresionCron}
                </div>
              </td>
              <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                <button
                  onClick={() => handleCambiarEstado(tarea.id, !tarea.activo)}
                  style={{
                    ...getEstadoColor(tarea.activo),
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {tarea.activo ? '● ACTIVO' : '○ INACTIVO'}
                </button>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '12px' }}>
                {formatearFecha(tarea.ultimaEjecucion)}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '12px' }}>
                {formatearFecha(tarea.proximaEjecucion)}
              </td>
              <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleEjecutarManual(tarea.id, tarea.nombre)}
                    disabled={ejecutando === tarea.id}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: ejecutando === tarea.id ? 'not-allowed' : 'pointer'
                    }}
                    title="Ejecutar ahora"
                  >
                    {ejecutando === tarea.id ? '...' : '▶'}
                  </button>
                  <button
                    onClick={() => verHistorial(tarea)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                    title="Ver historial"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => onEditar(tarea)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleEliminar(tarea.id, tarea.nombre)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Modal de ejecuciones */}
      <EjecucionesModal
        tareaProgramadaId={modalEjecuciones.tareaProgramadaId}
        nombreTarea={modalEjecuciones.nombreTarea}
        isOpen={modalEjecuciones.isOpen}
        onClose={cerrarModal}
      />
    </div>
  );
};

export default TareaProgramadaList;