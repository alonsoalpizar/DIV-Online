import { useEffect, useState } from 'react';
import axios from 'axios';
import { Proceso } from '../types/proceso';
import ProcesoForm from '../components/ProcesoForm';
import ProcesoList from '../components/ProcesoList';
import Modal from '../components/Modal';
import { FaPlus, FaCogs } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';


const Procesos = () => {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<Proceso | null>(null);

  const cargarProcesos = async () => {
    const res = await axios.get(`${getApiBase()}/procesos`);
    setProcesos(res.data);
  };

  const guardarProceso = async (proceso: Proceso) => {
  try {
    if (proceso.id) {
      await axios.put(`${getApiBase()}/procesos/${proceso.id}`, proceso);
    } else {
      await axios.post(`${getApiBase()}/procesos`, proceso); // id = ""
    }

    cargarProcesos();
    setMostrarFormulario(false);
    setProcesoSeleccionado(null);
  } catch (error: any) {
    alert(error.response?.data || 'Error al guardar');
  }
};

  const eliminarProceso = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/procesos/${id}`);
      cargarProcesos();
    } catch (error) {
      console.error('Error al eliminar proceso:', error);
    }
  };

  useEffect(() => {
    cargarProcesos();
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <FaCogs />
          </div>
          <div>
            <h1 className="page-title">Gestión de Procesos</h1>
            <p className="page-subtitle">Diseña y administra flujos de integración visual</p>
          </div>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            <FaPlus />
            Nuevo Proceso
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{procesos.length}</div>
          <div className="stat-label">Procesos Totales</div>
          <div className="stat-change">+{procesos.length} creados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{procesos.filter(p => p.descripcion).length}</div>
          <div className="stat-label">Con Descripción</div>
          <div className="stat-change">Documentados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">89</div>
          <div className="stat-label">Ejecuciones Hoy</div>
          <div className="stat-change">+15% vs ayer</div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <ProcesoList
          procesos={procesos}
          onEditar={(proceso) => {
            setProcesoSeleccionado(proceso);
            setMostrarFormulario(true);
          }}
          onEliminar={eliminarProceso}
        />
      </div>

      {/* Modal para formulario de proceso */}
      <Modal isOpen={mostrarFormulario} onClose={() => setMostrarFormulario(false)}>
        <ProcesoForm
          proceso={procesoSeleccionado}
          onGuardar={guardarProceso}
          onCancelar={() => {
            setMostrarFormulario(false);
            setProcesoSeleccionado(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Procesos;
 