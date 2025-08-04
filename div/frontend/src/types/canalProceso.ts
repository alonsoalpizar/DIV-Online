import { Proceso } from './proceso';

export interface CanalProceso {
  id: string;
  canalId: string;
  procesoId: string;
  trigger: string;
  fechaCreacion?: string; // opcional, por si se necesita
  proceso?: Proceso; // se rellena con el preload del backend
}
