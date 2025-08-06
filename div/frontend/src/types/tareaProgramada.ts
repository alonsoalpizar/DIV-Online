export interface TareaProgramada {
  id: string;
  nombre: string;
  descripcion: string;
  procesoId: string;
  canalCodigo?: string;
  expresionCron: string;
  activo: boolean;
  ultimaEjecucion?: string;
  proximaEjecucion?: string;
  parametrosEntrada: Record<string, any>;
  fechaCreacion: string;
  fechaActualizacion: string;
  proceso?: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
  };
}

export interface EjecucionTarea {
  id: string;
  tareaProgramadaId: string;
  fechaEjecucion: string;
  estado: 'exitoso' | 'error' | 'ejecutando';
  duracionMs: number;
  resultado: Record<string, any>;
  mensajeError: string;
  trigger: 'programado' | 'manual';
  tareaProgramada?: TareaProgramada;
}

export interface OpcionesCron {
  tipo: 'minutos' | 'horas' | 'diario' | 'semanal' | 'mensual' | 'personalizado';
  valor?: number;
  hora?: string; // "14:30"
  diaSemana?: number; // 0=domingo, 1=lunes...
  diaMes?: number; // 1-31
  expresionPersonalizada?: string;
}