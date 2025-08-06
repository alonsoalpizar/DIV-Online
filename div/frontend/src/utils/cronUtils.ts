import { OpcionesCron } from '../types/tareaProgramada';

/**
 * Convierte opciones de interfaz a expresión cron
 */
export function opcionesToCron(opciones: OpcionesCron): string {
  switch (opciones.tipo) {
    case 'minutos':
      return `*/${opciones.valor || 5} * * * *`;
    
    case 'horas':
      return `0 */${opciones.valor || 1} * * *`;
    
    case 'diario':
      const [hora, minuto] = (opciones.hora || '00:00').split(':');
      return `${minuto} ${hora} * * *`;
    
    case 'semanal':
      const [horaS, minutoS] = (opciones.hora || '00:00').split(':');
      return `${minutoS} ${horaS} * * ${opciones.diaSemana || 0}`;
    
    case 'mensual':
      const [horaM, minutoM] = (opciones.hora || '00:00').split(':');
      return `${minutoM} ${horaM} ${opciones.diaMes || 1} * *`;
    
    case 'personalizado':
      return opciones.expresionPersonalizada || '0 0 * * *';
    
    default:
      return '0 0 * * *'; // Diario a medianoche
  }
}

/**
 * Convierte expresión cron a opciones de interfaz
 */
export function cronToOpciones(expresion: string): OpcionesCron {
  const partes = expresion.split(' ');
  if (partes.length !== 5) {
    return { tipo: 'personalizado', expresionPersonalizada: expresion };
  }

  const [minuto, hora, dia, mes, diaSemana] = partes;

  // Cada X minutos
  if (minuto.startsWith('*/') && hora === '*' && dia === '*' && mes === '*' && diaSemana === '*') {
    return { tipo: 'minutos', valor: parseInt(minuto.replace('*/', '')) };
  }

  // Cada X horas
  if (minuto === '0' && hora.startsWith('*/') && dia === '*' && mes === '*' && diaSemana === '*') {
    return { tipo: 'horas', valor: parseInt(hora.replace('*/', '')) };
  }

  // Diario
  if (!minuto.includes('*') && !hora.includes('*') && dia === '*' && mes === '*' && diaSemana === '*') {
    return { tipo: 'diario', hora: `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}` };
  }

  // Semanal
  if (!minuto.includes('*') && !hora.includes('*') && dia === '*' && mes === '*' && !diaSemana.includes('*')) {
    return { 
      tipo: 'semanal', 
      hora: `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`,
      diaSemana: parseInt(diaSemana)
    };
  }

  // Mensual
  if (!minuto.includes('*') && !hora.includes('*') && !dia.includes('*') && mes === '*' && diaSemana === '*') {
    return { 
      tipo: 'mensual', 
      hora: `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`,
      diaMes: parseInt(dia)
    };
  }

  // Si no coincide con ningún patrón, es personalizado
  return { tipo: 'personalizado', expresionPersonalizada: expresion };
}

/**
 * Descripción legible de una expresión cron
 */
export function descripcionCron(expresion: string): string {
  const opciones = cronToOpciones(expresion);
  
  switch (opciones.tipo) {
    case 'minutos':
      return `Cada ${opciones.valor} minutos`;
    
    case 'horas':
      return `Cada ${opciones.valor} horas`;
    
    case 'diario':
      return `Diario a las ${opciones.hora}`;
    
    case 'semanal':
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `Semanal los ${dias[opciones.diaSemana!]} a las ${opciones.hora}`;
    
    case 'mensual':
      return `Mensual el día ${opciones.diaMes} a las ${opciones.hora}`;
    
    case 'personalizado':
      return `Personalizado: ${expresion}`;
    
    default:
      return expresion;
  }
}