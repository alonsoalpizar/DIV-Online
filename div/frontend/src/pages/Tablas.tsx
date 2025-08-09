import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabla } from '../types/tabla';
import TablaForm from '../components/TablaForm';
import TablaList from '../components/TablaList';
import Modal from '../components/Modal';
import { FaPlus, FaTable, FaSearch } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';


const Tablas = () => {
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [tablasFiltradas, setTablasFiltradas] = useState<Tabla[]>([]);
  const [filtroLocal, setFiltroLocal] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tablaSeleccionada, setTablaSeleccionada] = useState<Tabla | null>(null);

  const cargarTablas = async () => {
    const res = await axios.get(`${getApiBase()}/tablas`);
    setTablas(res.data);
    setTablasFiltradas(res.data);
  };

  const filtrarTablas = (termino: string) => {
    setFiltroLocal(termino);
    
    if (!termino.trim()) {
      setTablasFiltradas(tablas);
      return;
    }

    const filtradas = tablas.filter(tabla =>
      tabla.nombre.toLowerCase().includes(termino.toLowerCase())
    );
    
    setTablasFiltradas(filtradas);
  };

  const guardarTabla = async (tabla: Tabla) => {
    try {
      if (tabla.id) {
        await axios.put(`${getApiBase()}/tablas/${tabla.id}`, tabla);
      } else {
        await axios.post(`${getApiBase()}/tablas`, tabla);
      }
      cargarTablas();
      setMostrarFormulario(false);
      setTablaSeleccionada(null);
    } catch (error) {
      console.error('Error al guardar tabla:', error);
    }
  };

  const eliminarTabla = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/tablas/${id}`);
      cargarTablas();
    } catch (error) {
      console.error('Error al eliminar tabla:', error);
    }
  };

  useEffect(() => {
    cargarTablas();
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <FaTable />
          </div>
          <div>
            <h1 className="page-title">Gestión de Tablas</h1>
            <p className="page-subtitle">Define esquemas y datos de tablas dinámicas</p>
          </div>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setTablaSeleccionada(null);
              setMostrarFormulario(true);
            }}
          >
            <FaPlus />
            Nueva Tabla
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="page-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar tablas por nombre..."
            className="search-input"
            value={filtroLocal}
            onChange={(e) => filtrarTablas(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <TablaList
          tablas={tablasFiltradas}
          onEditar={(tabla) => {
            setTablaSeleccionada(tabla);
            setMostrarFormulario(true);
          }}
          onEliminar={eliminarTabla}
        />
        {tablasFiltradas.length === 0 && filtroLocal && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaSearch />
            </div>
            <h3 className="empty-state-title">Sin resultados</h3>
            <p className="empty-state-description">
              No se encontraron tablas que coincidan con "{filtroLocal}"
            </p>
          </div>
        )}
      </div>

      {/* Modal para formulario de tabla */}
      <Modal isOpen={mostrarFormulario} onClose={() => setMostrarFormulario(false)}>
        <TablaForm
          tabla={tablaSeleccionada}
          onGuardar={guardarTabla}
          onCancelar={() => {
            setMostrarFormulario(false);
            setTablaSeleccionada(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Tablas;
