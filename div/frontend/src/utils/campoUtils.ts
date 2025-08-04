export interface Campo {
  nombre: string;
  tipo: string;
  campos?: Campo[];
}

export const aplanarCampos = (campos: Campo[], prefix = ''): Campo[] => {
  return campos.flatMap(campo => {
    const nombreCompleto = prefix ? `${prefix}.${campo.nombre}` : campo.nombre;
    if (campo.campos && campo.campos.length > 0) {
      return aplanarCampos(campo.campos, nombreCompleto);
    } else {
      return [{ nombre: nombreCompleto, tipo: campo.tipo }];
    }
  });
};
