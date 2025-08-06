import { useState, useEffect } from 'react';
import { obtenerFuncionesGlobales, FuncionGlobal } from '../utils/funcionesGlobales';
import './PanelFuncionesGlobales.css';

interface Props {
  onInsertarFuncion?: (funcionTexto: string) => void;
  mostrarCategoria?: string; // 'todas' | 'fecha' | 'texto' | 'sistema' | 'tabla'
  compacto?: boolean;
}

const PanelFuncionesGlobales: React.FC<Props> = ({ 
  onInsertarFuncion, 
  mostrarCategoria = 'todas',
  compacto = false 
}) => {
  const [funciones, setFunciones] = useState<FuncionGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(mostrarCategoria);
  const [busqueda, setBusqueda] = useState('');

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
    
    return [[categoriaSeleccionada, categorias[categoriaSeleccionada as keyof typeof categorias] || []]];
  };

  const filtrarPorBusqueda = (funcionesPorCategoria: [string, FuncionGlobal[]][]) => {
    if (!busqueda) return funcionesPorCategoria;
    
    return funcionesPorCategoria.map(([categoria, fns]) => [
      categoria,
      fns.filter(f => 
        f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      )
    ]).filter(([, fns]) => (fns as FuncionGlobal[]).length > 0);
  };

  const handleInsertarFuncion = (funcion: FuncionGlobal) => {
    let textoFuncion = funcion.nombre;
    
    // Para funciones con parámetros, mostrar la estructura básica
    if (funcion.parametros && funcion.parametros.length > 0) {
      const params = funcion.parametros.map(p => `<${p.nombre}>`).join(', ');
      textoFuncion = `${funcion.nombre.split('(')[0]}(${params})`;
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
            <div key={categoria} className="categoria-funciones">
              {!compacto && categoriaSeleccionada === 'todas' && (
                <div className="categoria-titulo">
                  {categoriaLabels[categoria as keyof typeof categoriaLabels]}
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
    </div>
  );
};

export default PanelFuncionesGlobales;