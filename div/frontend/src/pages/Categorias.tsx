import { useState, useEffect } from 'react';
import { getApiBase } from '../utils/configuracion';

interface Categoria {
  id?: string;
  nombre: string;
  color: string;
  activo?: boolean;
}

const Categorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formData, setFormData] = useState<Categoria>({ nombre: '', color: '#3B82F6' });
  const [editando, setEditando] = useState<string | null>(null);

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${getApiBase()}/categorias`);
      const data = await res.json();
      setCategorias(data || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

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
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        cargarCategorias();
        setFormData({ nombre: '', color: '#3B82F6' });
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
    setFormData({ nombre: cat.nombre, color: cat.color || '#3B82F6' });
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
      
      <div className="card">
        <h3>{editando ? 'Editar' : 'Nueva'} Categoría</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            style={{ flex: 1, padding: '5px' }}
          />
          
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({...formData, color: e.target.value})}
            style={{ width: '50px' }}
          />
          
          <button onClick={handleGuardar}>
            {editando ? 'Actualizar' : 'Agregar'}
          </button>
          
          {editando && (
            <button onClick={() => {
              setEditando(null);
              setFormData({ nombre: '', color: '#3B82F6' });
            }}>
              Cancelar
            </button>
          )}
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
                <th>Color</th>
                <th>Vista Previa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.nombre}</td>
                  <td>{cat.color}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: cat.color || '#e0e0e0',
                      color: '#fff',
                      fontSize: '0.9em'
                    }}>
                      {cat.nombre}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEditar(cat)}>✏️</button>
                    <button onClick={() => handleEliminar(cat.id!)}>🗑️</button>
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