import { useState, useEffect } from 'react';
import { TareaProgramada, OpcionesCron } from '../types/tareaProgramada';
import { Proceso } from '../types/proceso';
import { Canal } from '../types/canal';
import { opcionesToCron, cronToOpciones, descripcionCron } from '../utils/cronUtils';

interface Props {
  tarea?: TareaProgramada;
  procesos: Proceso[];
  canales: Canal[];
  onGuardar: (tarea: Omit<TareaProgramada, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => void;
  onCancelar: () => void;
}

const TareaProgramadaForm: React.FC<Props> = ({ tarea, procesos, canales, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(tarea?.nombre || '');
  const [descripcion, setDescripcion] = useState(tarea?.descripcion || '');
  const [procesoId, setProcesoId] = useState(tarea?.procesoId || '');
  const [canalCodigo, setCanalCodigo] = useState(tarea?.canalCodigo || '');
  const [activo, setActivo] = useState(tarea?.activo ?? true);
  const [parametrosEntrada, setParametrosEntrada] = useState(
    JSON.stringify(tarea?.parametrosEntrada || {}, null, 2)
  );
  
  // Estado para el selector de cron
  const [opcionesCron, setOpcionesCron] = useState<OpcionesCron>(
    tarea ? cronToOpciones(tarea.expresionCron) : { tipo: 'diario', hora: '00:00' }
  );

  const [expresionCronFinal, setExpresionCronFinal] = useState(
    tarea?.expresionCron || '0 0 * * *'
  );

  // Actualizar expresión cron cuando cambien las opciones
  useEffect(() => {
    const nuevaExpresion = opcionesToCron(opcionesCron);
    setExpresionCronFinal(nuevaExpresion);
  }, [opcionesCron]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    
    if (!procesoId) {
      alert('Debe seleccionar un proceso');
      return;
    }
    
    // Canal es opcional para tareas programadas
    // if (!canalCodigo) {
    //   alert('Debe seleccionar un canal');
    //   return;
    // }

    let parametrosObj = {};
    try {
      parametrosObj = JSON.parse(parametrosEntrada);
    } catch (error) {
      alert('Los parámetros de entrada deben ser un JSON válido');
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      procesoId,
      canalCodigo,
      expresionCron: expresionCronFinal,
      activo,
      parametrosEntrada: parametrosObj,
      ultimaEjecucion: tarea?.ultimaEjecucion,
      proximaEjecucion: tarea?.proximaEjecucion
    });
  };

  const handleOpcionCronChange = (campo: keyof OpcionesCron, valor: any) => {
    setOpcionesCron(prev => ({ ...prev, [campo]: valor }));
  };

  const diasSemana = [
    { valor: 0, etiqueta: 'Domingo' },
    { valor: 1, etiqueta: 'Lunes' },
    { valor: 2, etiqueta: 'Martes' },
    { valor: 3, etiqueta: 'Miércoles' },
    { valor: 4, etiqueta: 'Jueves' },
    { valor: 5, etiqueta: 'Viernes' },
    { valor: 6, etiqueta: 'Sábado' }
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h3>{tarea ? 'Editar Tarea Programada' : 'Nueva Tarea Programada'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nombre *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Nombre de la tarea"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '60px' }}
            placeholder="Descripción opcional de la tarea"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Proceso *
            </label>
            <select
              value={procesoId}
              onChange={(e) => setProcesoId(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Seleccionar proceso</option>
              {procesos.map(proceso => (
                <option key={proceso.id} value={proceso.id}>
                  {proceso.nombre} ({proceso.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Canal (opcional)
            </label>
            <select
              value={canalCodigo}
              onChange={(e) => setCanalCodigo(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Sin canal (ejecución interna)</option>
              {canales.map(canal => (
                <option key={canal.id} value={canal.codigo}>
                  {canal.nombre} ({canal.codigo})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Dejar vacío para ejecución interna automática
            </div>
          </div>
        </div>

        {/* Selector de programación */}
        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Programación
          </label>
          
          <div style={{ marginBottom: '10px' }}>
            <select
              value={opcionesCron.tipo}
              onChange={(e) => handleOpcionCronChange('tipo', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="minutos">Cada X minutos</option>
              <option value="horas">Cada X horas</option>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {/* Opciones específicas según el tipo */}
          {(opcionesCron.tipo === 'minutos' || opcionesCron.tipo === 'horas') && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Intervalo:
              </label>
              <input
                type="number"
                min="1"
                max={opcionesCron.tipo === 'minutos' ? 59 : 23}
                value={opcionesCron.valor || 1}
                onChange={(e) => handleOpcionCronChange('valor', parseInt(e.target.value))}
                style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <span style={{ marginLeft: '10px' }}>
                {opcionesCron.tipo === 'minutos' ? 'minutos' : 'horas'}
              </span>
            </div>
          )}

          {(opcionesCron.tipo === 'diario' || opcionesCron.tipo === 'semanal' || opcionesCron.tipo === 'mensual') && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Hora:
              </label>
              <input
                type="time"
                value={opcionesCron.hora || '00:00'}
                onChange={(e) => handleOpcionCronChange('hora', e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}

          {opcionesCron.tipo === 'semanal' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Día de la semana:
              </label>
              <select
                value={opcionesCron.diaSemana || 0}
                onChange={(e) => handleOpcionCronChange('diaSemana', parseInt(e.target.value))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                {diasSemana.map(dia => (
                  <option key={dia.valor} value={dia.valor}>
                    {dia.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          )}

          {opcionesCron.tipo === 'mensual' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Día del mes:
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={opcionesCron.diaMes || 1}
                onChange={(e) => handleOpcionCronChange('diaMes', parseInt(e.target.value))}
                style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          )}

          {opcionesCron.tipo === 'personalizado' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Expresión cron:
              </label>
              <input
                type="text"
                value={opcionesCron.expresionPersonalizada || ''}
                onChange={(e) => handleOpcionCronChange('expresionPersonalizada', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="0 0 * * *"
              />
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            <strong>Resultado:</strong> {descripcionCron(expresionCronFinal)}
            <br />
            <strong>Expresión cron:</strong> <code>{expresionCronFinal}</code>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Parámetros de entrada (JSON)
          </label>
          <textarea
            value={parametrosEntrada}
            onChange={(e) => setParametrosEntrada(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px', 
              minHeight: '100px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            placeholder='{"parametro1": "valor1", "parametro2": 123}'
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <span style={{ fontWeight: 'bold' }}>Tarea activa</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancelar}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {tarea ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TareaProgramadaForm;