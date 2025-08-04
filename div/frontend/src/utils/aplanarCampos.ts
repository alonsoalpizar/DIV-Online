export interface CampoPlano {
  nombre: string;
  tipo: string;
  ruta: string;
}

interface CampoAnidado {
  nombre: string;
  tipo: string;
  subcampos?: CampoAnidado[];
}

export function aplanarCampos(campos: CampoAnidado[], rutaPadre: string = ''): CampoPlano[] {
  const resultado: CampoPlano[] = [];

  for (const campo of campos) {
    const rutaCompleta = rutaPadre ? `${rutaPadre}.${campo.nombre}` : campo.nombre;

    // 👇 Incluir también el nodo padre si es tipo object o array
    if ((campo.tipo === 'object' || campo.tipo === 'array') && campo.subcampos?.length) {
      resultado.push({
        nombre: campo.nombre,
        tipo: campo.tipo,
        ruta: rutaCompleta
      });

      const hijos = aplanarCampos(campo.subcampos, rutaCompleta);
      resultado.push(...hijos);
    } else {
      // Campo plano o sin subcampos
      resultado.push({
        nombre: campo.nombre,
        tipo: campo.tipo,
        ruta: rutaCompleta
      });
    }
  }

  return resultado;
}
