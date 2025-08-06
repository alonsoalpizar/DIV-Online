import { useEffect, useState } from 'react';
import axios from 'axios';
import { Proceso } from '../types/proceso';
import ProcesoForm from '../components/ProcesoForm';
import ProcesoList from '../components/ProcesoList';
import { FaPlus, FaCogs, FaSearch } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';


const Procesos = () => {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [procesosFiltrados, setProcesosFiltrados] = useState<Proceso[]>([]);
  const [filtroLocal, setFiltroLocal] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<Proceso | null>(null);

  const cargarProcesos = async () => {
    const res = await axios.get(`${getApiBase()}/procesos`);
    setProcesos(res.data);
    setProcesosFiltrados(res.data);
  };

  const filtrarProcesos = (termino: string) => {
    setFiltroLocal(termino);
    
    if (!termino.trim()) {
      setProcesosFiltrados(procesos);
      return;
    }

    const filtrados = procesos.filter(proceso =>
      proceso.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      (proceso.descripcion && proceso.descripcion.toLowerCase().includes(termino.toLowerCase()))
    );
    
    setProcesosFiltrados(filtrados);
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

  if (mostrarFormulario) {
    return (
      <div className="page-container">
        <div className="form-container">
          <ProcesoForm
            proceso={procesoSeleccionado}
            onGuardar={guardarProceso}
            onCancelar={() => {
              setMostrarFormulario(false);
              setProcesoSeleccionado(null);
            }}
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
          <div className="stat-value">{filtroLocal ? procesosFiltrados.length : procesos.length}</div>
          <div className="stat-label">{filtroLocal ? 'Resultados' : 'Procesos Totales'}</div>
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

      {/* Search and Filters */}
      <div className="page-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar procesos por nombre o descripción..."
            className="search-input"
            value={filtroLocal}
            onChange={(e) => filtrarProcesos(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <ProcesoList
          procesos={procesosFiltrados}
          onEditar={(proceso) => {
            setProcesoSeleccionado(proceso);
            setMostrarFormulario(true);
          }}
          onEliminar={eliminarProceso}
        />
        {procesosFiltrados.length === 0 && filtroLocal && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaSearch />
            </div>
            <h3 className="empty-state-title">Sin resultados</h3>
            <p className="empty-state-description">
              No se encontraron procesos que coincidan con "{filtroLocal}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Procesos;
 