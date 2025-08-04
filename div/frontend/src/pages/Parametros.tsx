import { useEffect, useState } from 'react';
import axios from 'axios';
import { Parametro } from '../types/parametro';
import ParametroForm from '../components/ParametroForm';
import ParametroList from '../components/ParametroList';
import { getApiBase } from '../utils/configuracion';


const Parametros = () => {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [parametroSeleccionado, setParametroSeleccionado] = useState<Parametro | null>(null);

  const cargarParametros = async () => {
    const res = await axios.get(`${getApiBase()}/parametros`);
    setParametros(res.data);
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
    <div>
      <h2>Gestión de Parámetros</h2>
      {!mostrarFormulario && (
        <button onClick={() => setMostrarFormulario(true)}>➕ Nuevo Parámetro</button>
      )}

      {mostrarFormulario && (
        <ParametroForm
          parametro={parametroSeleccionado}
          onGuardar={guardarParametro}
          onCancelar={() => {
            setMostrarFormulario(false);
            setParametroSeleccionado(null);
          }}
        />
      )}

      <ParametroList
        parametros={parametros}
        onEditar={(parametro) => {
          setParametroSeleccionado(parametro);
          setMostrarFormulario(true);
        }}
        onEliminar={eliminarParametro}
      />
    </div>
  );
};

export default Parametros;
