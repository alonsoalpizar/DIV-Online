import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DocumentationLayout from './components/DocumentationLayout';
import Home from './pages/Home';
import Servidores from './pages/Servidores';
import Canales from './pages/Canales';
import Procesos from './pages/Procesos';
import Parametros from './pages/Parametros';
import Tablas from './pages/Tablas';
import FlujoCanvas from './pages/FlujoCanvas';
import AsignarProcesosACanal from './components/AsignarProcesosACanal';
import WrapperAsignarProcesosACanal from "./pages/WrapperAsignarProcesosACanal";
import ConfiguracionSistema from './pages/ConfiguracionSistema';
import TareasProgramadas from './pages/TareasProgramadas';
import TestClient from './pages/TestClient';
import DocumentacionCamposServidor from './pages/DocumentacionCamposServidor';
import './styles/design-system.css';
import './styles/home.css';
import './styles/pages.css';
import './styles/forms.css';


const App = () => {
  return (
    <Routes>
      {/* Rutas con layout completo del sistema */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/servidores" element={<Layout><Servidores /></Layout>} />
      <Route path="/canales" element={<Layout><Canales /></Layout>} />
      <Route path="/procesos" element={<Layout><Procesos /></Layout>} />
      <Route path="/parametros" element={<Layout><Parametros /></Layout>} />
      <Route path="/tablas" element={<Layout><Tablas /></Layout>} />
      <Route path="/flujo/:id" element={<Layout><FlujoCanvas /></Layout>} />
      <Route path="/canales/:id/asignar-procesos" element={<Layout><WrapperAsignarProcesosACanal /></Layout>} />
      <Route path="/configuracion" element={<Layout><ConfiguracionSistema /></Layout>} />
      <Route path="/tareas-programadas" element={<Layout><TareasProgramadas /></Layout>} />
      <Route path="/test-client" element={<Layout><TestClient /></Layout>} />
      
      {/* Rutas de documentación con layout limpio */}
      <Route path="/docs/campos-servidor" element={
        <DocumentationLayout>
          <DocumentacionCamposServidor />
        </DocumentationLayout>
      } />
    </Routes>
  );
};

export default App;



