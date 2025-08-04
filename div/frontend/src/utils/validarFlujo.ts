// src/utils/validarFlujo.ts
import { Node, Edge } from 'reactflow';

export interface Validacion {
  tipo: 'error' | 'warning';
  nodoId: string;
  mensaje: string;
}

// 🔒 Modo de validación desactivado temporalmente
export const validarFlujo = (nodes: Node[], edges: Edge[]): Validacion[] => {
  // TODO: Reactivar las validaciones específicas cuando se establezcan reglas fijas
  return []; // ← Aquí se devuelve vacío intencionalmente

  /*
  // VALIDACIONES COMENTADAS:
  const errores: Validacion[] = [];
  const nodosPorId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const nodosConEntradas = new Set(edges.map(e => e.target));
  const nodosConSalidas = new Set(edges.map(e => e.source));

  for (const nodo of nodes) {
    const { id, type, data } = nodo;

    if (!data?.label || data.label.trim() === '') {
      errores.push({ tipo: 'warning', nodoId: id, mensaje: 'El nodo no tiene un label definido.' });
    }

    if (['salida', 'proceso', 'splitter', 'subproceso'].includes(type)) {
      if (!Array.isArray(data?.parametrosEntrada) || data.parametrosEntrada.length === 0) {
        errores.push({ tipo: 'warning', nodoId: id, mensaje: 'No tiene parámetros de entrada definidos.' });
      }
    }

    if (!['entrada', 'salida', 'salidaError'].includes(type)) {
      if (!nodosConEntradas.has(id) && !nodosConSalidas.has(id)) {
        errores.push({ tipo: 'warning', nodoId: id, mensaje: 'Este nodo no tiene conexiones.' });
      }
    }

    const asignaciones = data?.asignaciones || {};
    for (const [sourceId, asigns] of Object.entries(asignaciones)) {
      const nodoOrigen = nodosPorId[sourceId];
      if (!nodoOrigen) {
        errores.push({ tipo: 'error', nodoId: id, mensaje: `El nodo origen '${sourceId}' no existe.` });
        continue;
      }

      const camposOrigen = (nodoOrigen.data?.parametrosSalida || nodoOrigen.data?.campos || []).map((c: any) => c.nombre);
      const camposDestino = (data.parametrosEntrada || data.campos || []).map((c: any) => c.nombre);

      for (const a of asigns) {
        if (a.tipo === 'campo') {
          if (!camposOrigen.includes(a.valor)) {
            errores.push({ tipo: 'error', nodoId: id, mensaje: `El campo de origen '${a.valor}' no existe en '${nodoOrigen.data?.label || sourceId}'.` });
          }
        }
        if (!camposDestino.includes(a.destino)) {
          errores.push({ tipo: 'error', nodoId: id, mensaje: `El campo destino '${a.destino}' no está definido en '${data.label || id}'.` });
        }
      }
    }

    const entradasEsperadas = (data?.parametrosEntrada || []).map((c: any) => c.nombre);
    const entradasAsignadas = new Set(
      Object.values(asignaciones).flat().map((a: any) => a.destino)
    );
    const entradasNoAsignadas = entradasEsperadas.filter(nombre => !entradasAsignadas.has(nombre));

    if (entradasNoAsignadas.length > 0) {
      errores.push({
        tipo: 'warning',
        nodoId: id,
        mensaje: `Faltan asignaciones para: ${entradasNoAsignadas.join(', ')}`
      });
    }
  }

  return errores;
  */
};
