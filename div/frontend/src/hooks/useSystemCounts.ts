import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '../utils/configuracion';

interface SystemCounts {
  servidores: number;
  canales: number;
  procesos: number;
  tareas: number;
  parametros: number;
  tablas: number;
}

export const useSystemCounts = () => {
  const [counts, setCounts] = useState<SystemCounts>({
    servidores: 0,
    canales: 0,
    procesos: 0,
    tareas: 0,
    parametros: 0,
    tablas: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const baseUrl = getApiBase();

      // Hacer todas las peticiones en paralelo
      const [
        servidoresRes,
        canalesRes,
        procesosRes,
        tareasRes,
        parametrosRes,
        tablasRes
      ] = await Promise.allSettled([
        axios.get(`${baseUrl}/servidores`),
        axios.get(`${baseUrl}/canales`),
        axios.get(`${baseUrl}/procesos`),
        axios.get(`${baseUrl}/tareas-programadas`),
        axios.get(`${baseUrl}/parametros`),
        axios.get(`${baseUrl}/tablas`)
      ]);

      setCounts({
        servidores: servidoresRes.status === 'fulfilled' ? servidoresRes.value.data.length : 0,
        canales: canalesRes.status === 'fulfilled' ? canalesRes.value.data.length : 0,
        procesos: procesosRes.status === 'fulfilled' ? procesosRes.value.data.length : 0,
        tareas: tareasRes.status === 'fulfilled' ? tareasRes.value.data.length : 0,
        parametros: parametrosRes.status === 'fulfilled' ? parametrosRes.value.data.length : 0,
        tablas: tablasRes.status === 'fulfilled' ? tablasRes.value.data.length : 0,
      });

      setError(null);
    } catch (err) {
      console.error('Error al obtener conteos:', err);
      setError('Error al cargar conteos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Actualizar conteos cada 30 segundos
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { counts, loading, error, refresh: fetchCounts };
};