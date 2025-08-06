import axios from 'axios';
import { TareaProgramada, EjecucionTarea } from '../types/tareaProgramada';
import { getApiBase } from '../utils/configuracion';

const API_BASE = getApiBase();

export const tareasProgramadasService = {
  // Obtener todas las tareas programadas
  async listar(): Promise<TareaProgramada[]> {
    const response = await axios.get(`${API_BASE}/tareas-programadas`);
    return response.data;
  },

  // Obtener una tarea por ID
  async obtener(id: string): Promise<TareaProgramada> {
    const response = await axios.get(`${API_BASE}/tareas-programadas/${id}`);
    return response.data;
  },

  // Crear nueva tarea
  async crear(tarea: Omit<TareaProgramada, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<TareaProgramada> {
    const response = await axios.post(`${API_BASE}/tareas-programadas`, tarea);
    return response.data;
  },

  // Actualizar tarea existente
  async actualizar(id: string, tarea: Partial<TareaProgramada>): Promise<TareaProgramada> {
    const response = await axios.put(`${API_BASE}/tareas-programadas/${id}`, tarea);
    return response.data;
  },

  // Eliminar tarea
  async eliminar(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/tareas-programadas/${id}`);
  },

  // Ejecutar tarea manualmente
  async ejecutarManual(id: string): Promise<{ mensaje: string; ejecucionId: string }> {
    const response = await axios.post(`${API_BASE}/tareas-programadas/${id}/ejecutar`);
    return response.data;
  },

  // Obtener historial de ejecuciones
  async obtenerEjecuciones(id: string): Promise<EjecucionTarea[]> {
    const response = await axios.get(`${API_BASE}/tareas-programadas/${id}/ejecuciones`);
    return response.data;
  },

  // Cambiar estado activo/inactivo
  async cambiarEstado(id: string, activo: boolean): Promise<TareaProgramada> {
    const response = await axios.put(`${API_BASE}/tareas-programadas/${id}`, { activo });
    return response.data;
  }
};