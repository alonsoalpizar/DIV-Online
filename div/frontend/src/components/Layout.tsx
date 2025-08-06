import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../styles/design-system.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="main-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
