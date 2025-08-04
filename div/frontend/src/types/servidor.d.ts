export interface Servidor {
  id?: string; // generado automáticamente en backend si no se envía
  codigo: string;
  nombre: string;
  tipo: string;
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  fechaCreacion?: string; // puede ser opcional al crear
  extras?: Record<string, any>; // clave-valor dinámico, como JSONMap
}
