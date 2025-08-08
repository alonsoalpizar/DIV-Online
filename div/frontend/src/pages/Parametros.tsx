import { useEffect, useState } from 'react';
import axios from 'axios';
import { Parametro } from '../types/parametro';
import ParametroForm from '../components/ParametroForm';
import ParametroList from '../components/ParametroList';
import Modal from '../components/Modal';
import { FaPlus, FaCog, FaSearch } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';


const Parametros = () => {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [parametrosFiltrados, setParametrosFiltrados] = useState<Parametro[]>([]);
  const [filtroLocal, setFiltroLocal] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [parametroSeleccionado, setParametroSeleccionado] = useState<Parametro | null>(null);

  const cargarParametros = async () => {
    const res = await axios.get(`${getApiBase()}/parametros`);
    setParametros(res.data);
    setParametrosFiltrados(res.data);
  };

  const filtrarParametros = (termino: string) => {
    setFiltroLocal(termino);
    
    if (!termino.trim()) {
      setParametrosFiltrados(parametros);
      return;
    }

    const filtrados = parametros.filter(parametro =>
      parametro.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      (parametro.descripcion && parametro.descripcion.toLowerCase().includes(termino.toLowerCase()))
    );
    
    setParametrosFiltrados(filtrados);
  };

  const guardarParametro = async (parametro: Parametro) => {
    try {
      if (parametro.id) {
        await axios.put(`${getApiBase()}/parametros/${parametro.id}`, parametro);
      } else {
        await axios.post(`${getApiBase()}/parametros`, parametro);
      }
      cargarParametros();
      setMostrarFormulario(false);
      setParametroSeleccionado(null);
    } catch (error) {
      console.error('Error al guardar parámetro:', error);
    }
  };

  const eliminarParametro = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/parametros/${id}`);
      cargarParametros();
    } catch (error) {
      console.error('Error al eliminar parámetro:', error);
    }
  };

  useEffect(() => {
    cargarParametros();
  }, []);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <FaCog />
          </div>
          <div>
            <h1 className="page-title">Gestión de Parámetros</h1>
            <p className="page-subtitle">Configura variables del sistema y aplicación</p>
          </div>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setParametroSeleccionado(null);
              setMostrarFormulario(true);
            }}
          >
            <FaPlus />
            Nuevo Parámetro
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{filtroLocal ? parametrosFiltrados.length : parametros.length}</div>
          <div className="stat-label">{filtroLocal ? 'Resultados' : 'Parámetros Totales'}</div>
          <div className="stat-change">+{parametros.length} configurados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{parametros.filter(p => p.descripcion).length}</div>
          <div className="stat-label">Con Descripción</div>
          <div className="stat-change">Documentados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">42</div>
          <div className="stat-label">Usos Activos</div>
          <div className="stat-change">En sistema</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="page-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar parámetros por nombre o descripción..."
            className="search-input"
            value={filtroLocal}
            onChange={(e) => filtrarParametros(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <ParametroList
          parametros={parametrosFiltrados}
          onEditar={(parametro) => {
            setParametroSeleccionado(parametro);
            setMostrarFormulario(true);
          }}
          onEliminar={eliminarParametro}
        />
        {parametrosFiltrados.length === 0 && filtroLocal && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaSearch />
            </div>
            <h3 className="empty-state-title">Sin resultados</h3>
            <p className="empty-state-description">
              No se encontraron parámetros que coincidan con "{filtroLocal}"
            </p>
          </div>
        )}
      </div>

      {/* Modal para formulario de parámetro */}
      <Modal isOpen={mostrarFormulario} onClose={() => setMostrarFormulario(false)}>
        <ParametroForm
          parametro={parametroSeleccionado}
          onGuardar={guardarParametro}
          onCancelar={() => {
            setMostrarFormulario(false);
            setParametroSeleccionado(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Parametros;
