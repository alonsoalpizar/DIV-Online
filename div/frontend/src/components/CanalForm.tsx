

import { useState, useEffect } from 'react';
import { Canal } from '../types/canal';
import { extrasPorTipoCanal } from '../hooks/configExtrasPorTipoCanal';


interface Props {
  canal?: Canal | null;
  onGuardar: (canal: Canal) => void;
  onCancelar: () => void;
}

const CanalForm: React.FC<Props> = ({ canal, onGuardar, onCancelar }) => {
  const [id, setId] = useState(canal?.id || '');
  const [codigo, setCodigo] = useState(canal?.codigo || '');
  const [nombre, setNombre] = useState(canal?.nombre || '');
  const [tipoPublicacion, setTipoPublicacion] = useState(canal?.tipoPublicacion || '');
  const [puerto, setPuerto] = useState(canal?.puerto || '');
  const [tipoData, setTipoData] = useState<string>(String(canal?.tipoData || 'JSON'));
  const [extras, setExtras] = useState<Record<string, string>>(canal?.extras || {});

  useEffect(() => {
    if (canal) {
      setId(canal.id || '');
      setCodigo(canal?.codigo || '');
      setNombre(canal.nombre || '');
      setTipoPublicacion(canal.tipoPublicacion || '');
      setPuerto(canal.puerto || '');
      setTipoData(String(canal.tipoData || 'JSON'));
      setExtras(canal.extras || {});
    }
  }, [canal]);

  const handleGuardar = () => {
    if (!codigo || !nombre || !tipoPublicacion) {
  alert('Código, nombre y tipo de publicación son obligatorios');
  return;
}


    const nuevoCanal: Canal = {
    id: canal?.id || '',
    codigo,
    nombre,
    tipoPublicacion,
    puerto,
    fechaCreacion: canal?.fechaCreacion || new Date().toISOString(),
    tipoData, 
    extras,
       };


    onGuardar(nuevoCanal);
  };

  const handleTipoChange = (nuevoTipo: string) => {
    setTipoPublicacion(nuevoTipo);
    const defaults = extrasPorTipoCanal[nuevoTipo];
    if (defaults) {
      const confirmar = confirm("¿Desea reemplazar la configuración actual por la sugerida para este tipo de canal?");
      if (confirmar) {
        setExtras({ ...defaults });
      }
    }
  };

  const handleExtraChange = (key: string, value: string) => {
    setExtras(prev => ({ ...prev, [key]: value }));
  };

  const agregarCampoExtra = () => {
    const clave = prompt('Nombre del campo extra:');
    if (clave && !extras[clave]) {
      setExtras(prev => ({ ...prev, [clave]: '' }));
    }
  };

  const eliminarCampoExtra = (key: string) => {
    const { [key]: _, ...rest } = extras;
    setExtras(rest);
  };

  return (
    <div className="form-container">
      <h2>{canal ? 'Editar Canal' : 'Nuevo Canal'}</h2>
      <div className="form-grid">
        <label>Nombre:</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} />

        <label>Código:</label>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} />

        <label>Tipo de Publicación:</label>
        <select value={tipoPublicacion} onChange={e => handleTipoChange(e.target.value)}>
          <option value="">Seleccione...</option>
          <option value="REST">REST</option>
          <option value="SOAP">SOAP</option>
          <option value="SIMPLE">SIMPLE</option>
        </select>




        <label>Puerto:</label>
        <input value={puerto} onChange={e => setPuerto(e.target.value)} />
        
        <label>Tipo de Data:</label>
        <select value={tipoData} onChange={e => setTipoData(e.target.value)}>
        <option value="JSON">JSON</option>
        <option value="XML">XML</option>
        <option value="STRING">STRING</option>
        </select>





      </div>

      <div className="config-section">
        <h4>Campos Extras</h4>
        <button onClick={agregarCampoExtra} className="btn-agregar">➕ Agregar Campo</button>
        {Object.entries(extras).map(([key, value]) => (
          <div key={key} className="config-row">
            <label>{key}</label>
            <input
              value={value}
              onChange={e => handleExtraChange(key, e.target.value)}
            />
            <button onClick={() => eliminarCampoExtra(key)}>❌</button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button onClick={handleGuardar} className="btn-guardar">💾 Guardar</button>
        <button onClick={onCancelar} className="btn-cancelar">Cancelar</button>
      </div>
    </div>
  );
};

export default CanalForm;
