 import { useEffect, useState } from 'react';
import axios from 'axios';
import { Proceso } from '../types/proceso';
import ProcesoForm from '../components/ProcesoForm';
import ProcesoList from '../components/ProcesoList';
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
    <div>
      <h2>Gestión de Procesos</h2>
      {!mostrarFormulario && (
        <button onClick={() => setMostrarFormulario(true)}>➕ Nuevo Proceso</button>
      )}

      {mostrarFormulario && (
        <ProcesoForm
          proceso={procesoSeleccionado}
          onGuardar={guardarProceso}
          onCancelar={() => {
            setMostrarFormulario(false);
            setProcesoSeleccionado(null);
          }}
        />
      )}

      <ProcesoList
        procesos={procesos}
        onEditar={(proceso) => {
          setProcesoSeleccionado(proceso);
          setMostrarFormulario(true);
        }}
        onEliminar={eliminarProceso}
      />
    </div>
  );
};

export default Procesos;
 