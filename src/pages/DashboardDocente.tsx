import './DashboardDocente.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DashboardDocente() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('inicio')
  const [gruposOpen, setGruposOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sb-top">
          <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                <path d="M12 3L22 9L12 15L2 9L12 3Z"/><path d="M6 11.5V17c0 0 2.5 2.5 6 2.5s6-2.5 6-2.5V11.5"/><line x1="22" y1="9" x2="22" y2="14"/>
              </svg>
            </div>
            <span className="sb-logo-name">Aula<span>UTN</span></span>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">MP</div>
          <div className="sb-info">
            <div className="sb-uname">Mtro. Pedro Garcia</div>
            <div className="sb-uid">Docente</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>

          <div 
            className={`nav-item ${activeNav === 'inicio' ? 'active' : ''}`} 
            onClick={() => setActiveNav('inicio')}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Inicio</span>
          </div>

          {/* Acordeon de Grupos */}
          <div>
            <div 
              className={`nav-item ${activeNav === 'grupos' ? 'active' : ''}`} 
              onClick={() => {
                setActiveNav('grupos')
                setGruposOpen(!gruposOpen)
              }}
              style={{ justifyContent: 'space-between', paddingRight: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span className="nav-label">Grupos</span>
              </div>
              <svg className={`chevron ${gruposOpen ? 'open' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {gruposOpen && (
              <div className="accordion-content">
                <div className="nav-item course-item" onClick={() => navigate('')}>
                  <div className="course-avatar" style={{backgroundColor: 'rgba(229, 198, 135, 0.15)'}}>81</div>
                  <span className="course-title">IDGS 81</span>
                </div>
                <div className="nav-item course-item" onClick={() => navigate('')}>
                  <div className="course-avatar" style={{backgroundColor: 'rgba(229, 198, 135, 0.15)'}}>82</div>
                  <span className="course-title">IDGS 82</span>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="sb-footer">
          <button className="logout-btn">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main">
        <header className="topbar">
          <h1 className="topbar-title">Hola, Pedro</h1>
        </header>

        <div className="content">
          <div className="stats-row">
            <div className="stat-card">
              <p className="stat-label">Grupos activos</p>
              <p className="stat-val">6</p>
              <p className="stat-sub">Este cuatrimestre</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total alumnos</p>
              <p className="stat-val">142</p>
              <p className="stat-sub">Inscritos</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Material subido</p>
              <p className="stat-val">38</p>
              <p className="stat-sub">Recursos publicados</p>
            </div>
          </div>

          <p className="section-title">Mis grupos</p>
          <div className="grupos-grid">
            <div className="grupo-card c1" onClick={() => navigate('')}>
              <p className="gc-nombre">Grupo IDGS 81</p>
              <p className="gc-materia">Admin de Base de Datos</p>
            </div>
            <div className="grupo-card c2" onClick={() => navigate('')}>
              <p className="gc-nombre">Grupo IDGS 82</p>
              <p className="gc-materia">Admin de Base de Datos</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}