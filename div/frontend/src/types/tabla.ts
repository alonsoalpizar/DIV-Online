export interface CampoTabla {
  nombre: string;
  tipo: string;
}

export interface Tabla {
  id: string;
  nombre: string;
  campos: CampoTabla[];
  datos: any[];
}

export interface Campo {
  nombre: string;
  tipo: string;
  subcampos?: Campo[];
}