// utils/funcionesGlobales.ts

export interface FuncionGlobal {
  nombre: string;
  descripcion: string;
  retorno: string;
  parametros?: { nombre: string; tipo: string }[];
  ejemplo?: string;
  origen?: 'estatica' | 'tabla';
}

// 📦 FUNCIONES ESTÁTICAS (predefinidas)
const funcionesEstaticas: FuncionGlobal[] = [
  // 📅 FECHA Y HORA
  {
    nombre: 'Ahora',
    descripcion: 'Devuelve la fecha y hora actual del sistema',
    retorno: 'datetime',
    ejemplo: 'Ahora()',
    origen: 'estatica'
  },
  {
    nombre: 'Hoy',
    descripcion: 'Devuelve la fecha actual sin hora',
    retorno: 'date',
    ejemplo: 'Hoy()',
    origen: 'estatica'
  },
  {
    nombre: 'DiaSemana',
    descripcion: 'Devuelve el número del día de la semana actual (1=lunes, 7=domingo)',
    retorno: 'int',
    ejemplo: 'DiaSemana()',
    origen: 'estatica'
  },
  {
    nombre: 'MesActual',
    descripcion: 'Devuelve el número del mes actual',
    retorno: 'int',
    ejemplo: 'MesActual()',
    origen: 'estatica'
  },
  {
    nombre: 'AnoActual',
    descripcion: 'Devuelve el año actual',
    retorno: 'int',
    ejemplo: 'AnoActual()',
    origen: 'estatica'
  },

  // 👤 USUARIO Y SESIÓN
  {
    nombre: 'UsuarioActual',
    descripcion: 'Devuelve el código del usuario autenticado',
    retorno: 'string',
    ejemplo: 'UsuarioActual()',
    origen: 'estatica'
  },
  {
    nombre: 'RolActual',
    descripcion: 'Devuelve el rol principal del usuario autenticado',
    retorno: 'string',
    ejemplo: 'RolActual()',
    origen: 'estatica'
  },

  // 🔄 UTILIDAD
  {
    nombre: 'UUID',
    descripcion: 'Genera un identificador único (UUID v4)',
    retorno: 'string',
    ejemplo: 'UUID()',
    origen: 'estatica'
  },
  {
    nombre: 'Random',
    descripcion: 'Devuelve un número aleatorio entre 0 y 1',
    retorno: 'float',
    ejemplo: 'Random()',
    origen: 'estatica'
  },

  // 📝 TEXTO
  {
    nombre: 'SubTexto',
    descripcion: 'Extrae subcadena desde una posición',
    retorno: 'string',
    parametros: [
      { nombre: 'texto', tipo: 'string' },
      { nombre: 'inicio', tipo: 'int' },
      { nombre: 'longitud', tipo: 'int' }
    ],
    ejemplo: "SubTexto('ABCDE', 1, 3)",
    origen: 'estatica'
  },
  {
    nombre: 'Longitud',
    descripcion: 'Devuelve la longitud de un texto',
    retorno: 'int',
    parametros: [{ nombre: 'texto', tipo: 'string' }],
    ejemplo: "Longitud('Hola')",
    origen: 'estatica'
  },
  {
    nombre: 'TextoEnMayusculas',
    descripcion: 'Convierte un texto a mayúsculas',
    retorno: 'string',
    parametros: [{ nombre: 'texto', tipo: 'string' }],
    ejemplo: "TextoEnMayusculas('hola')",
    origen: 'estatica'
  },

  // ⚙️ SISTEMA
  {
    nombre: 'NombreProceso',
    descripcion: 'Devuelve el nombre del proceso en ejecución',
    retorno: 'string',
    ejemplo: 'NombreProceso()',
    origen: 'estatica'
  },
  {
    nombre: 'IDFlujo',
    descripcion: 'Devuelve el ID del flujo actual',
    retorno: 'string',
    ejemplo: 'IDFlujo()',
    origen: 'estatica'
  }
];

// 🔄 FUNCIÓN PARA OBTENER FUNCIONES DINÁMICAS DE TABLAS
export const obtenerFuncionesGlobales = async (): Promise<FuncionGlobal[]> => {
  const base = [...funcionesEstaticas];

  try {
    const res = await fetch('http://localhost:30000/tablas');
    const tablas = await res.json();

    const funcionesTablas: FuncionGlobal[] = tablas.map((t: { nombre: string }) => ({
      nombre: `Tabla("${t.nombre}", clave).Campo`,
      descripcion: `Consulta un campo específico de la tabla '${t.nombre}' mediante clave`,
      retorno: 'string',
      parametros: [
        { nombre: 'nombreTabla', tipo: 'string' },
        { nombre: 'clave', tipo: 'string' }
      ],
      ejemplo: `Tabla("${t.nombre}", "ACTIVO").Descripcion`,
      origen: 'tabla'
    }));

    return [...base, ...funcionesTablas];
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar las funciones de tabla:', error);
    return base;
  }
};
