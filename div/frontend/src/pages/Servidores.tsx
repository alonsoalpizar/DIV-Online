import { useState, useEffect } from 'react';
import { Servidor } from '../types/servidor';
import ServidorList from '../components/ServidorList';
import ServidorForm from '../components/ServidorForm';
import Modal from '../components/Modal';
import axios from 'axios';
import { getApiBase } from '../utils/configuracion';


const Servidores = () => {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState<Servidor | null>(null);

  const cargarServidores = async () => {
    try {
      const response = await axios.get(`${getApiBase()}/servidores`);
      setServidores(response.data);
    } catch (error) {
      console.error('Error al cargar servidores:', error);
    }
  };

  useEffect(() => {
    cargarServidores();
  }, []);

  const guardarServidor = async (servidor: Servidor) => {
    try {
      if (servidor.id) {
        await axios.put(`${getApiBase()}/servidores/${servidor.id}`, servidor);
      } else {
        await axios.post(`${getApiBase()}/servidores`, servidor);
      }
      cargarServidores();
      setMostrarFormulario(false);
      setServidorSeleccionado(null);
    } catch (error) {
      console.error('Error al guardar servidor:', error);
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
    <div>
      <h2>Gestión de Servidores</h2>
      <button onClick={() => {
        setServidorSeleccionado(null);
        setMostrarFormulario(true);
      }}>➕ Nuevo Servidor</button>

      <ServidorList servidores={servidores} onEditar={editarServidor} onEliminar={eliminarServidor} />

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
