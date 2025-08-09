import { useState, useEffect } from 'react';
import { getApiBase } from '../utils/configuracion';

interface Categoria {
  id?: string;
  nombre: string;
  color: string;
  activo?: boolean;
  ambito?: string;
}

const Categorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formData, setFormData] = useState<Categoria>({ nombre: '', color: '#3B82F6', ambito: 'proceso' });
  const [editando, setEditando] = useState<string | null>(null);
  const [ambitoActual, setAmbitoActual] = useState('proceso');

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${getApiBase()}/categorias?ambito=${ambitoActual}`);
      const data = await res.json();
      setCategorias(data || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, [ambitoActual]);

  // Guardar categoría
  const handleGuardar = async () => {
    if (!formData.nombre) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const url = editando 
        ? `${getApiBase()}/categorias/${editando}`
        : `${getApiBase()}/categorias`;
      
      const method = editando ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ambito: ambitoActual })
      });

      if (res.ok) {
        cargarCategorias();
        setFormData({ nombre: '', color: '#3B82F6', ambito: ambitoActual });
        setEditando(null);
      } else {
        const error = await res.text();
        console.error('Error al guardar:', error);
        alert('Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error guardando categoría:', error);
      alert('Error de conexión al guardar');
    }
  };

  // Editar categoría
  const handleEditar = (cat: Categoria) => {
    setFormData({ nombre: cat.nombre, color: cat.color || '#3B82F6', ambito: cat.ambito || ambitoActual });
    setEditando(cat.id || null);
  };

  // Eliminar categoría
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;

    try {
      const res = await fetch(`${getApiBase()}/categorias/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        cargarCategorias();
      } else {
        alert('Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert('Error de conexión al eliminar');
    }
  };

  return (
    <div className="container">
      <h2>Administración de Categorías</h2>
      
      {/* Selector de ámbito */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Ámbito de Categorías</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label htmlFor="ambito-select">Mostrar categorías para:</label>
          <select 
            id="ambito-select"
            value={ambitoActual} 
            onChange={(e) => setAmbitoActual(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1em' }}
          >
            <option value="proceso">Procesos</option>
            <option value="servidor">Servidores</option>
            <option value="canal">Canales</option>
          </select>
          <span style={{ 
            padding: '4px 12px', 
            borderRadius: '12px', 
            background: '#f0f0f0', 
            fontSize: '0.9em',
            color: '#666'
          }}>
            {categorias.length} {categorias.length === 1 ? 'categoría' : 'categorías'}
          </span>
        </div>
      </div>
      
      <div className="card">
        <h3>{editando ? 'Editar' : 'Nueva'} Categoría para {ambitoActual === 'proceso' ? 'Procesos' : ambitoActual === 'servidor' ? 'Servidores' : 'Canales'}</h3>
        
        <div style={{ marginBottom: '15px' }}>
          {/* Primera fila: Nombre y Color */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              style={{ width: '60px', height: '36px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          {/* Segunda fila: Ámbito */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ minWidth: '60px', fontWeight: 'bold' }}>Ámbito:</label>
            <select 
              value={formData.ambito || ambitoActual} 
              onChange={(e) => setFormData({...formData, ambito: e.target.value})}
              style={{ 
                flex: 1, 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: editando ? '#f9f9f9' : '#fff'
              }}
              disabled={!!editando} // Deshabilitado al editar para evitar inconsistencias
            >
              <option value="proceso">Procesos</option>
              <option value="servidor">Servidores</option>
              <option value="canal">Canales</option>
            </select>
            {editando && (
              <small style={{ color: '#666', fontSize: '0.85em', marginLeft: '5px' }}>
                ⚠️ El ámbito no se puede cambiar al editar
              </small>
            )}
          </div>

          {/* Tercera fila: Botones */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleGuardar}
              style={{
                padding: '8px 16px',
                background: editando ? '#f59e0b' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {editando ? '✏️ Actualizar' : '➕ Agregar'}
            </button>
            
            {editando && (
              <button 
                onClick={() => {
                  setEditando(null);
                  setFormData({ nombre: '', color: '#3B82F6', ambito: ambitoActual });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Categorías Existentes</h3>
        
        {categorias.length === 0 ? (
          <p>No hay categorías registradas</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ámbito</th>
                <th>Color</th>
                <th>Vista Previa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 'bold' }}>{cat.nombre}</td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: cat.ambito === 'proceso' ? '#e0f2fe' : cat.ambito === 'servidor' ? '#f3e8ff' : '#ecfdf5',
                      color: cat.ambito === 'proceso' ? '#0369a1' : cat.ambito === 'servidor' ? '#7c3aed' : '#059669',
                      fontSize: '0.85em',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {cat.ambito === 'proceso' ? 'Procesos' : cat.ambito === 'servidor' ? 'Servidores' : 'Canales'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: cat.color || '#e0e0e0',
                        border: '1px solid #ddd'
                      }}></div>
                      <code style={{ fontSize: '0.85em', color: '#666' }}>{cat.color}</code>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      backgroundColor: cat.color || '#e0e0e0',
                      color: '#fff',
                      fontSize: '0.9em',
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      {cat.nombre}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => handleEditar(cat)}
                        style={{
                          padding: '4px 8px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                        title="Editar categoría"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => handleEliminar(cat.id!)}
                        style={{
                          padding: '4px 8px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                        title="Eliminar categoría"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Categorias;