import { useState, useEffect } from 'react';
import { obtenerFuncionesGlobales, FuncionGlobal } from '../utils/funcionesGlobales';
import SelectorFuncionTabla from './SelectorFuncionTabla';
import './PanelFuncionesGlobales.css';

interface CampoDisponible {
  nombre: string;
  tipo: string;
}

interface Props {
  onInsertarFuncion?: (funcionTexto: string) => void;
  mostrarCategoria?: string; // 'todas' | 'fecha' | 'texto' | 'sistema' | 'tabla'
  compacto?: boolean;
  camposDisponibles?: CampoDisponible[]; // Campos del contexto actual
}

const PanelFuncionesGlobales: React.FC<Props> = ({ 
  onInsertarFuncion, 
  mostrarCategoria = 'todas',
  compacto = false,
  camposDisponibles = []
}) => {
  const [funciones, setFunciones] = useState<FuncionGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(mostrarCategoria);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarSelectorTabla, setMostrarSelectorTabla] = useState(false);

  useEffect(() => {
    const cargarFunciones = async () => {
      try {
        const funcionesDisponibles = await obtenerFuncionesGlobales();
        setFunciones(funcionesDisponibles);
      } catch (error) {
        console.error('Error al cargar funciones:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarFunciones();
  }, []);

  const categorizarFunciones = () => {
    const categorias = {
      fecha: funciones.filter(f => ['Ahora', 'Hoy', 'DiaSemana', 'MesActual', 'AnoActual'].includes(f.nombre)),
      usuario: funciones.filter(f => ['UsuarioActual', 'RolActual'].includes(f.nombre)),
      utilidad: funciones.filter(f => ['UUID', 'Random'].includes(f.nombre)),
      texto: funciones.filter(f => ['SubTexto', 'Longitud', 'TextoEnMayusculas'].includes(f.nombre)),
      sistema: funciones.filter(f => ['NombreProceso', 'IDFlujo'].includes(f.nombre)),
      tabla: funciones.filter(f => f.origen === 'tabla')
    };

    if (categoriaSeleccionada === 'todas') {
      return Object.entries(categorias);
    }
    
    return [[categoriaSeleccionada, categorias[categoriaSeleccionada as keyof typeof categorias] || []]] as [string, FuncionGlobal[]][];
  };

  const filtrarPorBusqueda = (funcionesPorCategoria: [string, FuncionGlobal[]][]): [string, FuncionGlobal[]][] => {
    if (!busqueda) return funcionesPorCategoria;
    
    return funcionesPorCategoria.map(([categoria, fns]) => [
      categoria,
      fns.filter(f => 
        f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      )
    ] as [string, FuncionGlobal[]]).filter(([, fns]) => fns.length > 0);
  };

  const handleInsertarFuncion = (funcion: FuncionGlobal) => {
    // Si es una función de tabla, abrir el selector especial
    if (funcion.origen === 'tabla' || funcion.nombre.includes('Tabla(')) {
      setMostrarSelectorTabla(true);
      return;
    }
    
    let textoFuncion = '';
    const nombreBase = funcion.nombre.includes('(') ? funcion.nombre.split('(')[0] : funcion.nombre;
    
    // Para funciones con parámetros, mostrar la estructura básica
    if (funcion.parametros && funcion.parametros.length > 0) {
      const params = funcion.parametros.map(p => `<${p.nombre}>`).join(', ');
      textoFuncion = `${nombreBase}(${params})`;
    } else {
      // Para funciones sin parámetesis vacíos
      textoFuncion = `${nombreBase}()`;
    }
    
    if (onInsertarFuncion) {
      onInsertarFuncion(textoFuncion);
    }
  };

  const categoriaLabels = {
    fecha: '📅 Fecha y Hora',
    usuario: '👤 Usuario',
    utilidad: '🔄 Utilidad',
    texto: '📝 Texto',
    sistema: '⚙️ Sistema',
    tabla: '🗃️ Tablas'
  };

  if (loading) {
    return (
      <div className={`panel-funciones ${compacto ? 'compacto' : ''}`}>
        <div className="loading-funciones">⏳ Cargando funciones...</div>
      </div>
    );
  }

  const funcionesFiltradas = filtrarPorBusqueda(categorizarFunciones());

  return (
    <div className={`panel-funciones ${compacto ? 'compacto' : ''}`}>
      <div className="funciones-header">
        <h4>🔧 Funciones del Sistema</h4>
        
        {!compacto && (
          <>
            <div className="funciones-search">
              <input
                type="text"
                placeholder="Buscar función..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-funciones"
              />
            </div>
            
            <div className="funciones-tabs">
              <button
                className={categoriaSeleccionada === 'todas' ? 'active' : ''}
                onClick={() => setCategoriaSeleccionada('todas')}
              >
                Todas
              </button>
              {Object.keys(categoriaLabels).map(cat => (
                <button
                  key={cat}
                  className={categoriaSeleccionada === cat ? 'active' : ''}
                  onClick={() => setCategoriaSeleccionada(cat)}
                >
                  {categoriaLabels[cat as keyof typeof categoriaLabels].split(' ')[0]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="funciones-lista">
        {funcionesFiltradas.length === 0 ? (
          <div className="no-funciones">
            {busqueda ? 'Sin resultados para la búsqueda' : 'No hay funciones en esta categoría'}
          </div>
        ) : (
          funcionesFiltradas.map(([categoria, funcionesCategoria]) => (
            <div key={categoria as string} className="categoria-funciones">
              {!compacto && categoriaSeleccionada === 'todas' && (
                <div className="categoria-titulo">
                  {categoriaLabels[categoria as keyof typeof categoriaLabels]}
                </div>
              )}
              
              {/* Botón especial para Tabla() */}
              {categoria === 'tabla' && (
                <div
                  className="funcion-item funcion-tabla-especial"
                  onClick={() => setMostrarSelectorTabla(true)}
                  style={{
                    background: 'linear-gradient(135deg, #fff7e6 0%, #ffeac1 100%)',
                    border: '2px solid #f0b429',
                    cursor: 'pointer',
                    marginBottom: '10px'
                  }}
                  title="Constructor visual para función Tabla()"
                >
                  <div className="funcion-nombre" style={{ color: '#b8860b', fontWeight: 'bold' }}>
                    📊 Constructor Tabla()
                  </div>
                  {!compacto && (
                    <div className="funcion-descripcion" style={{ color: '#8b6f00' }}>
                      Constructor visual para crear funciones Tabla() con selector de tabla, clave y campo
                    </div>
                  )}
                </div>
              )}
              
              {(funcionesCategoria as FuncionGlobal[]).map(funcion => (
                <div
                  key={funcion.nombre}
                  className="funcion-item"
                  onClick={() => handleInsertarFuncion(funcion)}
                  title={funcion.descripcion}
                >
                  <div className="funcion-nombre">{funcion.nombre}</div>
                  {!compacto && (
                    <>
                      <div className="funcion-descripcion">{funcion.descripcion}</div>
                      {funcion.ejemplo && (
                        <div className="funcion-ejemplo">
                          <strong>Ejemplo:</strong> <code>{funcion.ejemplo}</code>
                        </div>
                      )}
                      <div className="funcion-retorno">
                        <span className="retorno-badge">{funcion.retorno}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      
      {/* Selector de función Tabla() */}
      <SelectorFuncionTabla
        visible={mostrarSelectorTabla}
        onClose={() => setMostrarSelectorTabla(false)}
        camposDisponibles={camposDisponibles}
        onInsertarFuncion={(funcionTexto) => {
          if (onInsertarFuncion) {
            onInsertarFuncion(funcionTexto);
          }
          setMostrarSelectorTabla(false);
        }}
      />
    </div>
  );
};

export default PanelFuncionesGlobales;