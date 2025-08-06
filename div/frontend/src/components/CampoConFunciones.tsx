import React, { useState, useRef } from 'react';
import { useFuncionesGlobales } from '../hooks/useFuncionesGlobales';
import PanelFuncionesGlobales from './PanelFuncionesGlobales';
import { FaCode, FaEye, FaEyeSlash } from 'react-icons/fa';
import './CampoConFunciones.css';

interface CampoDisponible {
  nombre: string;
  tipo: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  mostrarFunciones?: boolean;
  categoriaFunciones?: string;
  validarSintaxis?: boolean;
  camposDisponibles?: CampoDisponible[]; // Campos del contexto actual
}

const CampoConFunciones: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = '',
  multiline = false,
  rows = 3,
  disabled = false,
  required = false,
  mostrarFunciones = true,
  categoriaFunciones = 'todas',
  validarSintaxis = true,
  camposDisponibles = []
}) => {
  const [mostrarPanelFunciones, setMostrarPanelFunciones] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  const {
    valor,
    actualizarValor,
    insertarFuncion,
    handleCursorChange,
    validarFunciones
  } = useFuncionesGlobales(value, onChange);

  const validacion = validarSintaxis ? validarFunciones(valor) : { valido: true, errores: [] };

  const handleInsertarFuncion = (funcionTexto: string) => {
    insertarFuncion(funcionTexto, inputRef);
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="campo-con-funciones">
      <div className="campo-header">
        <label className={`campo-label ${required ? 'required' : ''}`}>
          {label}
        </label>
        {mostrarFunciones && (
          <button
            type="button"
            className={`btn-toggle-funciones ${mostrarPanelFunciones ? 'active' : ''}`}
            onClick={() => setMostrarPanelFunciones(!mostrarPanelFunciones)}
            title="Mostrar/ocultar funciones del sistema"
          >
            <FaCode />
            {mostrarPanelFunciones ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>

      <div className="campo-content">
        <div className="input-container">
          <InputComponent
            ref={inputRef as any}
            className={`campo-input ${!validacion.valido ? 'error' : ''}`}
            value={valor}
            onChange={(e) => actualizarValor(e.target.value)}
            onSelect={() => handleCursorChange(inputRef)}
            onKeyUp={() => handleCursorChange(inputRef)}
            placeholder={placeholder}
            disabled={disabled}
            rows={multiline ? rows : undefined}
            style={multiline ? { resize: 'vertical' } : {}}
          />
          
          {!validacion.valido && (
            <div className="validation-errors">
              {validacion.errores.map((error, index) => (
                <div key={index} className="validation-error">
                  ⚠️ {error}
                </div>
              ))}
            </div>
          )}
        </div>

        {mostrarFunciones && mostrarPanelFunciones && (
          <div className="panel-funciones-container">
            <PanelFuncionesGlobales
              onInsertarFuncion={handleInsertarFuncion}
              mostrarCategoria={categoriaFunciones}
              compacto={true}
              camposDisponibles={camposDisponibles}
            />
          </div>
        )}
      </div>

      {mostrarFunciones && (
        <div className="campo-help">
          💡 Usa el botón <FaCode /> para insertar funciones del sistema como Ahora(), UUID(), etc.
        </div>
      )}
    </div>
  );
};

export default CampoConFunciones;