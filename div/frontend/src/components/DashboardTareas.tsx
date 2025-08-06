import { useState, useEffect } from 'react';
import { TareaProgramada, EjecucionTarea } from '../types/tareaProgramada';
import { tareasProgramadasService } from '../services/tareasProgramadasService';

interface Props {
  tareas: TareaProgramada[];
}

interface EstadisticasTareas {
  totalTareas: number;
  tareasActivas: number;
  tareasInactivas: number;
  ultimasEjecuciones: EjecucionTarea[];
  ejecucionesExitosas: number;
  ejecucionesConError: number;
  proximasEjecuciones: Array<{
    tarea: TareaProgramada;
    proximaEjecucion: Date;
  }>;
}

const DashboardTareas: React.FC<Props> = ({ tareas }) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasTareas>({
    totalTareas: 0,
    tareasActivas: 0,
    tareasInactivas: 0,
    ultimasEjecuciones: [],
    ejecucionesExitosas: 0,
    ejecucionesConError: 0,
    proximasEjecuciones: []
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    calcularEstadisticas();
  }, [tareas]);

  const calcularEstadisticas = async () => {
    setCargando(true);
    try {
      // Estadísticas básicas
      const totalTareas = tareas.length;
      const tareasActivas = tareas.filter(t => t.activo).length;
      const tareasInactivas = totalTareas - tareasActivas;

      // Obtener ejecuciones recientes
      const todasLasEjecuciones: EjecucionTarea[] = [];
      for (const tarea of tareas.slice(0, 5)) { // Solo las primeras 5 para no sobrecargar
        try {
          const ejecuciones = await tareasProgramadasService.obtenerEjecuciones(tarea.id);
          todasLasEjecuciones.push(...ejecuciones.slice(0, 3)); // Últimas 3 de cada tarea
        } catch (error) {
          console.error(`Error obteniendo ejecuciones de tarea ${tarea.nombre}:`, error);
        }
      }

      // Ordenar por fecha más reciente
      const ultimasEjecuciones = todasLasEjecuciones
        .sort((a, b) => new Date(b.fechaEjecucion).getTime() - new Date(a.fechaEjecucion).getTime())
        .slice(0, 10);

      // Contar éxitos y errores
      const ejecucionesExitosas = ultimasEjecuciones.filter(e => e.estado === 'exitoso').length;
      const ejecucionesConError = ultimasEjecuciones.filter(e => e.estado === 'error').length;

      // Próximas ejecuciones
      const proximasEjecuciones = tareas
        .filter(t => t.activo && t.proximaEjecucion)
        .map(t => ({
          tarea: t,
          proximaEjecucion: new Date(t.proximaEjecucion!)
        }))
        .sort((a, b) => a.proximaEjecucion.getTime() - b.proximaEjecucion.getTime())
        .slice(0, 5);

      setEstadisticas({
        totalTareas,
        tareasActivas,
        tareasInactivas,
        ultimasEjecuciones,
        ejecucionesExitosas,
        ejecucionesConError,
        proximasEjecuciones
      });
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearFechaRelativa = (fecha: string | Date) => {
    const ahora = new Date();
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const diff = fechaObj.getTime() - ahora.getTime();
    const minutos = Math.floor(Math.abs(diff) / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (diff > 0) {
      // Futuro
      if (minutos < 60) return `En ${minutos} min`;
      if (horas < 24) return `En ${horas}h ${minutos % 60}min`;
      return `En ${dias} días`;
    } else {
      // Pasado
      if (minutos < 60) return `Hace ${minutos} min`;
      if (horas < 24) return `Hace ${horas}h ${minutos % 60}min`;
      return `Hace ${dias} días`;
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

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando estadísticas...</div>;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Tarjetas de estadísticas principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
            {estadisticas.totalTareas}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Total de tareas</div>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #c8e6c9'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
            {estadisticas.tareasActivas}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Tareas activas</div>
        </div>

        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #c8e6c9'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
            {estadisticas.ejecucionesExitosas}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Ejecuciones exitosas (recientes)</div>
        </div>

        <div style={{ 
          backgroundColor: '#ffebee', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #ffcdd2'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d32f2f' }}>
            {estadisticas.ejecucionesConError}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Ejecuciones con error</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Próximas ejecuciones */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🕐 Próximas Ejecuciones</h4>
          {estadisticas.proximasEjecuciones.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No hay tareas programadas</p>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {estadisticas.proximasEjecuciones.map((item, index) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {item.tarea.nombre}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {item.proximaEjecucion.toLocaleString('es-ES')}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#007bff',
                    fontWeight: 'bold'
                  }}>
                    {formatearFechaRelativa(item.proximaEjecucion)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas ejecuciones */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Últimas Ejecuciones</h4>
          {estadisticas.ultimasEjecuciones.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No hay ejecuciones registradas</p>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {estadisticas.ultimasEjecuciones.map((ejecucion, index) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: getEstadoColor(ejecucion.estado) }}>
                        {getEstadoIcon(ejecucion.estado)}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        Tarea ID: {ejecucion.tareaProgramadaId.substring(0, 8)}...
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {formatearFechaRelativa(ejecucion.fechaEjecucion)} • {ejecucion.trigger}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: getEstadoColor(ejecucion.estado),
                    color: 'white'
                  }}>
                    {ejecucion.estado.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTareas;