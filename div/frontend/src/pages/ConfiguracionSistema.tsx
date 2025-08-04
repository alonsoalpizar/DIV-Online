import { useEffect, useState } from 'react';
import { getApiBase, setConfiguracion } from '../utils/configuracion';

interface Configuracion {
  nombreProyecto: string;
  descripcion: string;
  urlBase: string;
  origen?: 'local' | 'backend';
}

const ConfiguracionSistema = () => {
  const [config, setConfig] = useState<Configuracion>({
    nombreProyecto: '',
    descripcion: '',
    urlBase: 'http://localhost:30000',
    origen: undefined
  });
  


  const [estadoConexion, setEstadoConexion] = useState<string>('');
  const [configRemota, setConfigRemota] = useState<Configuracion | null>(null);

  

  useEffect(() => {
    const local = localStorage.getItem('configSistema');

    if (local) {
      const parsed = JSON.parse(local);
      setConfig({ ...parsed, origen: 'local' });
    } else {
      fetch(`${getApiBase()}/configuracion`)
        .then(res => {
          if (!res.ok) throw new Error('Backend no respondió correctamente');
          return res.json();
        })
        .then(data => {
          const enriched = { ...data, origen: 'backend' };
          setConfig(enriched);
          localStorage.setItem('configSistema', JSON.stringify(enriched));
        })
        .catch(err => {
          console.warn('⚠️ No se pudo cargar configuración desde backend:', err);
        });
    }
  }, []);

  const guardarConfiguracion = () => {
    localStorage.setItem('configSistema', JSON.stringify({ ...config, origen: 'local' }));
    alert('✅ Configuración guardada localmente.');
  };

  const probarConexion = async () => {
    try {
      const res = await fetch(`${config.urlBase}/ping`);
      if (res.ok) {
        setEstadoConexion('✅ Conexión exitosa con el backend.');
      } else {
        setEstadoConexion('⚠️ El servidor respondió pero no fue exitoso.');
      }
    } catch (err) {
      setEstadoConexion('❌ No se pudo conectar al backend.');
    }
  };

  const guardarEnBackend = async () => {
    try {
      const payload = {
        nombreProyecto: config.nombreProyecto,
        descripcion: config.descripcion,
        urlBase: config.urlBase
      };

      const res = await fetch(`${config.urlBase}/configuracion`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

      const data = await res.text();

      if (res.ok) {
        alert('✅ Configuración guardada en el backend');
        setConfig(prev => ({ ...prev, origen: 'backend' }));
        localStorage.setItem('configSistema', JSON.stringify({ ...config, origen: 'backend' }));
      } else {
        alert('❌ No se pudo guardar en el backend');
        console.warn("❌ Backend error:", data);
      }
    } catch (error) {
      console.error("❌ Error en fetch:", error);
      alert('❌ Error al guardar en el backend');
    }
  };

  const restaurarDesdeBackend = async () => {
  try {
    const res = await fetch(`${getApiBase()}/configuracion`);
    if (!res.ok) throw new Error('Error en backend');
    const data = await res.json();

    const enriched = { ...data, origen: 'backend' as const };
    setConfig(enriched);
    setConfigRemota(enriched); // 👈 Guarda la copia para mostrar
    localStorage.setItem('configSistema', JSON.stringify(enriched));
    alert('✅ Configuración restaurada desde el servidor');
  } catch (error) {
    console.error('❌ Error restaurando config:', error);
    alert('❌ No se pudo restaurar configuración desde backend');
  }
};


  const limpiarConfiguracionLocal = () => {
  localStorage.removeItem('configSistema');
  setConfig({
    nombreProyecto: '',
    descripcion: '',
    urlBase: '',
    origen: undefined
  });
  setEstadoConexion('');
  alert('🧹 Configuración local eliminada.');
};


  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>⚙️ Configuración del Sistema</h2>

      <label>Nombre del Proyecto:</label>
      <input
        value={config.nombreProyecto}
        onChange={e => setConfig({ ...config, nombreProyecto: e.target.value })}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <label>Descripción:</label>
      <input
        value={config.descripcion}
        onChange={e => setConfig({ ...config, descripcion: e.target.value })}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <label>URL Base del Backend:</label>
      <input
        value={config.urlBase}
        onChange={e => setConfig({ ...config, urlBase: e.target.value })}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        <button onClick={guardarConfiguracion}>💾 Guardar</button>
        <button onClick={probarConexion}>🔌 Probar Conexión</button>
        <button onClick={restaurarDesdeBackend}>🔄 Restaurar desde servidor</button>
        <button onClick={limpiarConfiguracionLocal}>🧹 Limpiar localStorage</button>

      </div>

      {estadoConexion && (
        <>
          <p style={{ marginTop: '15px' }}>{estadoConexion}</p>
          <button
            onClick={guardarEnBackend}
            style={{
              marginTop: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '5px'
            }}
          >
            Guardar configuración en backend
          </button>
        </>
      )}

      {config.origen && (
        <p style={{ fontSize: '12px', marginTop: '15px', color: '#888' }}>
          ℹ️ Esta configuración proviene de: <strong>{config.origen}</strong>
        </p>
      )}
    {configRemota && (
  <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
    <h4>🗂️ Configuración actual en el backend</h4>
    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
      <li><strong>Nombre del Proyecto:</strong> {configRemota.nombreProyecto}</li>
      <li><strong>Descripción:</strong> {configRemota.descripcion}</li>
      <li><strong>URL Base:</strong> {configRemota.urlBase}</li>
    </ul>
    <button
      onClick={() => setConfig(configRemota)}
      style={{ marginTop: '10px', backgroundColor: '#28a745', color: '#fff', padding: '6px 10px', border: 'none', borderRadius: '4px' }}
    >
      📥 Usar esta configuración
    </button>
  </div>
)}

    </div>
  );
};

export default ConfiguracionSistema;
