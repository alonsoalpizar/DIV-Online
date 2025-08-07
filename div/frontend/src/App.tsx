import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import './styles/design-system.css';
import './styles/home.css';
import './styles/pages.css';
import './styles/forms.css';


const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/servidores" element={<Servidores />} />
        <Route path="/canales" element={<Canales />} />
        <Route path="/procesos" element={<Procesos />} />
        <Route path="/parametros" element={<Parametros />} />
        <Route path="/tablas" element={<Tablas />} />
        <Route path="/flujo/:id" element={<FlujoCanvas />} />
        {/* <Route path="/canales/:id/asignar-procesos" element={<AsignarProcesosACanal />} /> */}
        <Route path="/canales/:id/asignar-procesos" element={<WrapperAsignarProcesosACanal />} />
        <Route path="/configuracion" element={<ConfiguracionSistema />} />
        <Route path="/tareas-programadas" element={<TareasProgramadas />} />
        <Route path="/test-client" element={<TestClient />} />
      </Routes>
    </Layout>
  );
};

export default App;



