export interface Canal {
  id: string;
  codigo: string;
  nombre: string;
  tipoPublicacion: string;
  fechaCreacion: string;
  puerto: string;
  tipoData: String;
  extras: Record<string, string>;
}
