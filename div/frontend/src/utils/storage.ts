import { Servidor } from '../types/servidor';

const STORAGE_KEY = 'servidores';

export const obtenerServidores = (): Servidor[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const guardarServidores = (servidores: Servidor[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servidores));
};

export const agregarServidor = (nuevo: Servidor) => {
  const servidores = obtenerServidores();
  guardarServidores([...servidores, nuevo]);
};

export const actualizarServidor = (actualizado: Servidor) => {
  const servidores = obtenerServidores().map(s =>
    s.id === actualizado.id ? actualizado : s
  );
  guardarServidores(servidores);
};

export const eliminarServidor = (id: string) => {
  const servidores = obtenerServidores().filter(s => s.id !== id);
  guardarServidores(servidores);
};
