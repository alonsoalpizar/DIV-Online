export interface TestRequest {
  canalCodigo: string;
  trigger: string;
  trama: Record<string, any>;
  procesoId?: string;
}

export interface TestResponse {
  exitoso: boolean;
  mensaje: string;
  resultado?: Record<string, any>;
  error?: string;
  duracion?: string;
}

export interface CanalConProcesos {
  id: string;
  codigo: string;
  nombre: string;
  triggers: string[];
}