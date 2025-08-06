import { useEffect, useState } from 'react';
import { TareaProgramada } from '../types/tareaProgramada';
import { Proceso } from '../types/proceso';
import { Canal } from '../types/canal';
import { tareasProgramadasService } from '../services/tareasProgramadasService';
import TareaProgramadaList from '../components/TareaProgramadaList';
import TareaProgramadaForm from '../components/TareaProgramadaForm';
import DashboardTareas from '../components/DashboardTareas';
import { FaPlus, FaClock, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { getApiBase } from '../utils/configuracion';

const TareasProgramadas = () => {
  const [tareas, setTareas] = useState<TareaProgramada[]>([]);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [canales, setCanales] = useState<Canal[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<TareaProgramada | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      await Promise.all([
        cargarTareas(),
        cargarProcesos(),
        cargarCanales()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarTareas = async () => {
    try {
      const data = await tareasProgramadasService.listar();
      setTareas(data);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  };

  const cargarProcesos = async () => {
    try {
      const response = await axios.get(`${getApiBase()}/procesos`);
      setProcesos(response.data);
    } catch (error) {
      console.error('Error al cargar procesos:', error);
    }
  };

  const cargarCanales = async () => {
    try {
      const response = await axios.get(`${getApiBase()}/canales`);
      setCanales(response.data);
    } catch (error) {
      console.error('Error al cargar canales:', error);
    }
  };

  const handleGuardarTarea = async (tareaData: Omit<TareaProgramada, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => {
    try {
      if (tareaSeleccionada) {
        // Actualizar
        await tareasProgramadasService.actualizar(tareaSeleccionada.id, tareaData);
      } else {
        // Crear nueva
        await tareasProgramadasService.crear(tareaData);
      }
      
      await cargarTareas();
      setMostrarFormulario(false);
      setTareaSeleccionada(null);
    } catch (error: any) {
      console.error('Error al guardar tarea:', error);
      alert(error.response?.data || 'Error al guardar la tarea');
    }
  };

  const handleEliminarTarea = async (id: string) => {
    try {
      await tareasProgramadasService.eliminar(id);
      await cargarTareas();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  };

  const handleEditarTarea = (tarea: TareaProgramada) => {
    setTareaSeleccionada(tarea);
    setMostrarFormulario(true);
  };

  const handleNuevaTarea = () => {
    setTareaSeleccionada(null);
    setMostrarFormulario(true);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setTareaSeleccionada(null);
  };

  if (cargando) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <FaSpinner className="loading-icon" />
          <span>Cargando tareas programadas...</span>
        </div>
      </div>
    );
  }

  if (mostrarFormulario) {
    return (
      <div className="page-container">
        <div className="form-container">
          <TareaProgramadaForm
            tarea={tareaSeleccionada || undefined}
            procesos={procesos}
            canales={canales}
            onGuardar={handleGuardarTarea}
            onCancelar={handleCancelarFormulario}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <FaClock />
          </div>
          <div>
            <h1 className="page-title">Tareas Programadas</h1>
            <p className="page-subtitle">
              Gestión de procesos automatizados y programación de ejecuciones
            </p>
          </div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={handleNuevaTarea}
          >
            <FaPlus />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Dashboard con estadísticas avanzadas */}
      <DashboardTareas tareas={tareas} />

      {/* Lista de tareas */}
      <div className="page-content">
        <TareaProgramadaList
          tareas={tareas}
          onEditar={handleEditarTarea}
          onEliminar={handleEliminarTarea}
          onRecargar={cargarTareas}
        />
      </div>
    </div>
  );
};

export default TareasProgramadas;