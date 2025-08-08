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
    console.log('📍 URL Base configurada:', config.urlBase);
    return config.urlBase;
  } else {
    console.warn('⚠️ No hay configuración definida. Usando fallback.');
    // En producción, usar /api a través de Nginx
    if (window.location.hostname === '173.249.49.235') {
      return 'http://173.249.49.235/api';
    }
    // En desarrollo, conectar directamente al backend
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
