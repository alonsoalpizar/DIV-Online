import { useState, useCallback } from 'react';

export interface PosicionCursor {
  inicio: number;
  fin: number;
}

export const useFuncionesGlobales = (
  initialValue: string = '',
  onChange?: (value: string) => void
) => {
  const [valor, setValor] = useState(initialValue);
  const [posicionCursor, setPosicionCursor] = useState<PosicionCursor>({ inicio: 0, fin: 0 });

  const actualizarValor = useCallback((nuevoValor: string) => {
    setValor(nuevoValor);
    if (onChange) {
      onChange(nuevoValor);
    }
  }, [onChange]);

  const insertarFuncion = useCallback((funcionTexto: string, inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) => {
    if (inputRef?.current) {
      const input = inputRef.current;
      const inicio = input.selectionStart || 0;
      const fin = input.selectionEnd || 0;
      
      const textoAnterior = valor.substring(0, inicio);
      const textoPosterior = valor.substring(fin);
      const nuevoValor = textoAnterior + funcionTexto + textoPosterior;
      
      actualizarValor(nuevoValor);
      
      // Posicionar cursor después de la función insertada
      setTimeout(() => {
        const nuevaPosicion = inicio + funcionTexto.length;
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
        input.focus();
      }, 0);
    } else {
      // Si no hay referencia al input, insertar al final
      const nuevoValor = valor + funcionTexto;
      actualizarValor(nuevoValor);
    }
  }, [valor, actualizarValor]);

  const insertarFuncionEnPosicion = useCallback((funcionTexto: string, posicion: number) => {
    const textoAnterior = valor.substring(0, posicion);
    const textoPosterior = valor.substring(posicion);
    const nuevoValor = textoAnterior + funcionTexto + textoPosterior;
    actualizarValor(nuevoValor);
  }, [valor, actualizarValor]);

  const handleCursorChange = useCallback((inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) => {
    if (inputRef.current) {
      const inicio = inputRef.current.selectionStart || 0;
      const fin = inputRef.current.selectionEnd || 0;
      setPosicionCursor({ inicio, fin });
    }
  }, []);

  // Función para validar si el texto contiene funciones válidas
  const validarFunciones = useCallback((texto: string): { valido: boolean; errores: string[] } => {
    const errores: string[] = [];
    
    // Buscar patrones de funciones
    const patronFuncion = /\b[A-Z][a-zA-Z]*\(/g;
    const funcionesEncontradas = texto.match(patronFuncion);
    
    if (funcionesEncontradas) {
      const funcionesConocidas = [
        'Ahora(', 'Hoy(', 'DiaSemana(', 'MesActual(', 'AnoActual(',
        'UsuarioActual(', 'RolActual(', 'UUID(', 'Random(',
        'SubTexto(', 'Longitud(', 'TextoEnMayusculas(',
        'NombreProceso(', 'IDFlujo(', 'Tabla('
      ];
      
      funcionesEncontradas.forEach(func => {
        if (!funcionesConocidas.some(conocida => func.startsWith(conocida.split('(')[0] + '('))) {
          errores.push(`Función desconocida: ${func.replace('(', '')}`);
        }
      });
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }, []);

  // Función para formatear el texto con resaltado de funciones
  const formatearTexto = useCallback((texto: string): string => {
    return texto.replace(
      /\b[A-Z][a-zA-Z]*\([^)]*\)/g,
      '<span class="funcion-resaltada">$&</span>'
    );
  }, []);

  return {
    valor,
    actualizarValor,
    insertarFuncion,
    insertarFuncionEnPosicion,
    handleCursorChange,
    posicionCursor,
    validarFunciones,
    formatearTexto
  };
};