import { Link } from 'react-router-dom';
import './SiteMap.css';

function Sitemap() {
  return (
    <div className="sitemap-container">
      <h1 className='h1Site'>Mapa del Sitio</h1>
      <ul>
        <li><Link className='Enlaces' to="/">Login</Link></li>
        <li><Link className='Enlaces' to="/Docente">Dashboard Docente</Link></li>
        <li><Link className='Enlaces' to="/Alumno">Dashboard Alumno</Link></li>
      </ul>
    </div>
  );
}

export default Sitemap;