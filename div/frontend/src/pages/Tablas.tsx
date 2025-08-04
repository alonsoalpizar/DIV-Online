import { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabla } from '../types/tabla';
import TablaForm from '../components/TablaForm';
import TablaList from '../components/TablaList';
import { getApiBase } from '../utils/configuracion';


const Tablas = () => {
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tablaSeleccionada, setTablaSeleccionada] = useState<Tabla | null>(null);

  const cargarTablas = async () => {
    const res = await axios.get(`${getApiBase()}/tablas`);
    setTablas(res.data);
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
    <div>
      <h2>Gestión de Tablas</h2>
      {!mostrarFormulario && (
        <button onClick={() => setMostrarFormulario(true)}>➕ Nueva Tabla</button>
      )}

      {mostrarFormulario && (
        <TablaForm
          tabla={tablaSeleccionada}
          onGuardar={guardarTabla}
          onCancelar={() => {
            setMostrarFormulario(false);
            setTablaSeleccionada(null);
          }}
        />
      )}

      <TablaList
        tablas={tablas}
        onEditar={(tabla) => {
          setTablaSeleccionada(tabla);
          setMostrarFormulario(true);
        }}
        onEliminar={eliminarTabla}
      />
    </div>
  );
};

export default Tablas;
