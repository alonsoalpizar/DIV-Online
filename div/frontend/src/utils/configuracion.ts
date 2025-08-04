// src/utils/configuracion.ts

export interface ConfiguracionSistema {
  nombreProyecto: string;
  descripcion: string;
  urlBase: string;
}

const CLAVE = 'configSistema';

// Recupera toda la configuración
export const getConfiguracion = (): ConfiguracionSistema | null => {
  const raw = localStorage.getItem(CLAVE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/* // Devuelve solo la URL base
export const getApiBase = (): string => {
  const config = getConfiguracion();
  return config?.urlBase || 'http://localhost:30000';
}; */
export const getApiBase = (): string => {
  const config = getConfiguracion();
  if (config?.urlBase) {
    return config.urlBase;
  } else {
    console.warn('⚠️ No hay configuración definida. Usando fallback localhost.');
    return 'http://localhost:30000';
  }
};


// Guarda la configuración
export const setConfiguracion = (config: ConfiguracionSistema) => {
  localStorage.setItem(CLAVE, JSON.stringify(config));
};

// Limpia la configuración
export const limpiarConfiguracion = () => {
  localStorage.removeItem(CLAVE);
};
