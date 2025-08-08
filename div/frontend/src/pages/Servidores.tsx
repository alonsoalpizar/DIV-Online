import { useState, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import ServidorList from '../components/ServidorList';
import ServidorForm from '../components/ServidorForm';
import Modal from '../components/Modal';
import { FaPlus, FaServer, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { getApiBase } from '../utils/configuracion';


const Servidores = () => {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [servidoresFiltrados, setServidoresFiltrados] = useState<Servidor[]>([]);
  const [filtroLocal, setFiltroLocal] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState<Servidor | null>(null);

  const cargarServidores = async () => {
    try {
      const response = await axios.get(`${getApiBase()}/servidores`);
      setServidores(response.data);
      setServidoresFiltrados(response.data);
    } catch (error) {
      console.error('Error al cargar servidores:', error);
    }
  };

  const filtrarServidores = (termino: string) => {
    setFiltroLocal(termino);
    
    if (!termino.trim()) {
      setServidoresFiltrados(servidores);
      return;
    }

    const filtrados = servidores.filter(servidor =>
      servidor.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      servidor.tipo.toLowerCase().includes(termino.toLowerCase()) ||
      servidor.codigo.toLowerCase().includes(termino.toLowerCase()) ||
      servidor.host.toLowerCase().includes(termino.toLowerCase())
    );
    
    setServidoresFiltrados(filtrados);
  };

  useEffect(() => {
    cargarServidores();
  }, []);

  const guardarServidor = async (servidor: Servidor) => {
    try {
      console.log('Datos del servidor a guardar:', servidor);
      
      // Verificación más explícita para determinar si es nuevo o edición
      if (servidor.id && servidor.id !== '') {
        console.log('Actualizando servidor existente con ID:', servidor.id);
        await axios.put(`${getApiBase()}/servidores/${servidor.id}`, servidor);
        console.log('Servidor actualizado:', servidor.codigo);
      } else {
        console.log('Creando nuevo servidor...');
        // Eliminar el id si es undefined para evitar problemas
        const { id, ...servidorSinId } = servidor;
        console.log('Datos a enviar:', servidorSinId);
        const response = await axios.post(`${getApiBase()}/servidores`, servidorSinId);
        console.log('Servidor creado:', response.data);
      }
      cargarServidores();
      setMostrarFormulario(false);
      setServidorSeleccionado(null);
    } catch (error: any) {
      console.error('Error completo al guardar servidor:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      console.error('Estado HTTP:', error.response?.status);
      
      let mensajeError = 'Error al guardar el servidor.';
      if (error.response?.data?.error) {
        mensajeError += ` ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        mensajeError += ` ${error.response.data.message}`;
      } else if (error.message) {
        mensajeError += ` ${error.message}`;
      }
      
      alert(mensajeError);
    }
  };


  const editarServidor = (servidor: Servidor) => {
    setServidorSeleccionado(servidor);
    setMostrarFormulario(true);
  };

  const eliminarServidor = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/servidores/${id}`);
      cargarServidores();
    } catch (error) {
      console.error('Error al eliminar servidor:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <FaServer />
          </div>
          <div>
            <h1 className="page-title">Gestión de Servidores</h1>
            <p className="page-subtitle">Configura conexiones a bases de datos y servicios externos</p>
          </div>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setServidorSeleccionado(null);
              setMostrarFormulario(true);
            }}
          >
            <FaPlus />
            Nuevo Servidor
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="page-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar servidores por nombre o tipo..."
            className="search-input"
            value={filtroLocal}
            onChange={(e) => filtrarServidores(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <ServidorList 
          servidores={servidoresFiltrados} 
          onEditar={editarServidor} 
          onEliminar={eliminarServidor} 
        />
        {servidoresFiltrados.length === 0 && filtroLocal && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaSearch />
            </div>
            <h3 className="empty-state-title">Sin resultados</h3>
            <p className="empty-state-description">
              No se encontraron servidores que coincidan con "{filtroLocal}"
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={mostrarFormulario} onClose={() => setMostrarFormulario(false)}>
        <ServidorForm
          servidor={servidorSeleccionado}
          onGuardar={guardarServidor}
          onCancelar={() => setMostrarFormulario(false)}
        />
      </Modal>
    </div>
  );
};

export default Servidores;
