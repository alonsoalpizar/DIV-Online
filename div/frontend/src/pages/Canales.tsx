import { useEffect, useState } from 'react';
import axios from 'axios';
import { Canal } from '../types/canal';
import CanalForm from '../components/CanalForm';
import CanalList from '../components/CanalList';
import AsignarProcesosACanal from '../components/AsignarProcesosACanal';
import Modal from '../components/Modal';
import { FaPlus, FaLink } from 'react-icons/fa';
import { getApiBase } from '../utils/configuracion';


const Canales = () => {
  const [canales, setCanales] = useState<Canal[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [canalSeleccionado, setCanalSeleccionado] = useState<Canal | null>(null);
  const [canalParaAsignar, setCanalParaAsignar] = useState<Canal | null>(null); // 🆕 asignación

  const cargarCanales = async () => {
    const res = await axios.get(`${getApiBase()}/canales`);
    setCanales(res.data);
  };

  const guardarCanal = async (canal: Canal) => {
  try {
    // Validar código duplicado
    const codigoDuplicado = canales.some(c =>
      c.codigo === canal.codigo && c.id !== canal.id
    );
    if (codigoDuplicado) {
      alert(`Ya existe un canal con el código "${canal.codigo}". Debe ser único.`);
      return;
    }

    if (canal.id) {
      await axios.put(`${getApiBase()}/canales/${canal.id}`, canal);
    } else {
      await axios.post(`${getApiBase()}/canales`, canal);
    }
    cargarCanales();
    setMostrarFormulario(false);
    setCanalSeleccionado(null);
  } catch (error) {
    console.error('Error al guardar canal:', error);
  }
};


  const eliminarCanal = async (id: string) => {
    try {
      await axios.delete(`${getApiBase()}/canales/${id}`);
      cargarCanales();
    } catch (error) {
      console.error('Error al eliminar canal:', error);
    }
  };

  const asignarProcesosACanal = async (
    asignaciones: { canalId: string; procesoId: string; trigger: string }[]
  ) => {
    try {
      for (const asignacion of asignaciones) {
        await axios.post(`${getApiBase()}/canal-procesos`, asignacion);
      }
      alert('Procesos asignados correctamente.');
      // setCanalParaAsignar(null); // cerrar el formulario
    } catch (error) {
      console.error('Error al asignar procesos:', error);
      alert('Ocurrió un error al asignar los procesos');
    }
  };

  useEffect(() => {
    cargarCanales();
  }, []);

  if (canalParaAsignar) {
    return (
      <div className="page-container">
        <AsignarProcesosACanal
          canal={canalParaAsignar}
          onAsignar={asignarProcesosACanal}
          onCancelar={() => setCanalParaAsignar(null)}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div className="page-icon">
            <FaLink />
          </div>
          <div>
            <h1 className="page-title">Gestión de Canales</h1>
            <p className="page-subtitle">Publica tus procesos como API REST y SOAP accesibles externamente</p>
          </div>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(true)}
          >
            <FaPlus />
            Nuevo Canal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        <CanalList
          canales={canales}
          onEditar={(canal) => {
            setCanalSeleccionado(canal);
            setMostrarFormulario(true);
          }}
          onEliminar={eliminarCanal}
          onAsignar={(canal) => {
            setCanalParaAsignar(canal);
          }}
        />
      </div>

      {/* Modal para formulario de canal */}
      <Modal isOpen={mostrarFormulario} onClose={() => setMostrarFormulario(false)}>
        <CanalForm
          canal={canalSeleccionado}
          onGuardar={guardarCanal}
          onCancelar={() => {
            setMostrarFormulario(false);
            setCanalSeleccionado(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Canales;
