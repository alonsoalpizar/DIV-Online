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

export interface CampoAvanzado extends Campo {
  longitud?: number;
  relleno?: string;
  alineacion?: 'izquierda' | 'derecha' | 'centrado';
  multiple?: boolean;
  repeticiones?: number;
  repeticiones_minimas?: number;
}

export interface ConfigSplitter {
  modo: 'unir' | 'descomponer';
  formato: 'delimitado' | 'posicional' | 'plantilla';
  codificacion: 'none' | 'base64' | 'hex' | 'ascii' | 'utf8';
  prefijo: string;
  sufijo: string;
  separador: string;
  campos: CampoAvanzado[];
}