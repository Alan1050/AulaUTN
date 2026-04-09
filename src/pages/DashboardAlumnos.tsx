import './DashboardAlumno.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DashboardAlumno() {

  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('inicio')
  const [materiasOpen, setMateriasOpen] = useState(false)

  // Navega a la página de la PanelMateria
  const irAMateria = (id: string) => {
    navigate(`/Alumno/materia/${id}`)
  }

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

        <div className="sb-top">
          <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                <path d="M12 3L22 9L12 15L2 9L12 3Z"/>
                <path d="M6 11.5V17c0 0 2.5 2.5 6 2.5s6-2.5 6-2.5V11.5"/>
                <line x1="22" y1="9" x2="22" y2="14"/>
              </svg>
            </div>
            <span className="sb-logo-name">Aula<span>UTN</span></span>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">JL</div>
          <div className="sb-info">
            <div className="sb-uname">Juan Lopez</div>
            <div className="sb-uid">TIC-310000</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>

          <div
            className={`nav-item ${activeNav === 'inicio' ? 'active' : ''}`}
            onClick={() => setActiveNav('inicio')}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Inicio</span>
          </div>

          {/* Acordeon materias */}
          <div>
            <div
              className={`nav-item ${activeNav === 'materias' ? 'active' : ''}`}
              onClick={() => {
                setActiveNav('materias')
                setMateriasOpen(!materiasOpen)
              }}
              style={{ justifyContent: 'space-between', paddingRight: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                <span className="nav-label">Materias</span>
              </div>
              <svg className={`chevron ${materiasOpen ? 'open' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {/* Materias sidebar */}
            {materiasOpen && (
              <div className="accordion-content">
                <div className="nav-item course-item" onClick={() => irAMateria('prog-web')}>
                  <div className="course-avatar" style={{ backgroundColor: 'rgba(229, 198, 135, 0.15)' }}>P</div>
                  <span className="course-title">Programación Web</span>
                </div>

                <div className="nav-item course-item" onClick={() => irAMateria('base-datos')}>
                  <div className="course-avatar" style={{ backgroundColor: 'rgba(138, 154, 91, 0.15)' }}>B</div>
                  <span className="course-title">Base de Datos</span>
                </div>

                <div className="nav-item course-item" onClick={() => irAMateria('redes')}>
                  <div className="course-avatar" style={{ backgroundColor: 'rgba(176, 125, 79, 0.15)' }}>R</div>
                  <span className="course-title">Redes</span>
                </div>
                <div className="nav-item course-item" onClick={() => irAMateria('redes')}>
                  <div className="course-avatar" style={{ backgroundColor: 'rgba(176, 125, 79, 0.15)' }}>R</div>
                  <span className="course-title">Diseño web</span>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="sb-footer">
          <button className="logout-btn">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="main">

        <header className="topbar">
          <h1 className="topbar-title">Hola, Juan</h1>
          <span className="topbar-date">4.º Cuatrimestre</span>
        </header>

        <div className="content">

          <div className="stats-row">
            <div className="stat-card">
              <p className="stat-label">Materias activas</p>
              <p className="stat-val">4</p>
              <p className="stat-sub">Este cuatrimestre</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Material disponible</p>
              <p className="stat-val">10</p>
              <p className="stat-sub">Nuevos esta semana</p>
            </div>
          </div>

          <div className="two-col">

            {/* Materias contenido principal */}
            <section>
              <p className="section-title">Mis materias</p>
              <div className="materias-grid">

                <div className="materia-card" onClick={() => irAMateria('prog-web')}>
                  <p className="mat-name">Programación Web</p>
                  <p className="mat-desc">HTML, CSS, JS y frameworks</p>
                </div>

                <div className="materia-card" onClick={() => irAMateria('base-datos')}>
                  <p className="mat-name">Base de Datos</p>
                  <p className="mat-desc">SQL, modelado y normalización</p>
                </div>

                <div className="materia-card" onClick={() => irAMateria('redes')}>
                  <p className="mat-name">Redes y Comunicaciones</p>
                  <p className="mat-desc">Protocolos, TCP/IP y seguridad</p>
                </div>

                <div className="materia-card" onClick={() => irAMateria('ing-software')}>
                  <p className="mat-name">Diseño web</p>
                </div>

              </div>
            </section>

            {/* Avisos */}
            <section>
              <p className="section-title">Avisos recientes</p>
              <div className="avisos-list">

                <div className="aviso">
                  <div className="aviso-dot info" />
                  <div>
                    <p className="aviso-text">Nuevos recursos de Programación Web: ejercicios de React.</p>
                    <p className="aviso-time">Hace 2 horas</p>
                  </div>
                </div>

                <div className="aviso">
                  <div className="aviso-dot warn" />
                  <div>
                    <p className="aviso-text">Ejercicios de Base de Datos.</p>
                    <p className="aviso-time">Hace 1 día</p>
                  </div>
                </div>

                <div className="aviso">
                  <div className="aviso-dot info" />
                  <div>
                    <p className="aviso-text">Nuevo material de Redes: capítulo 4</p>
                    <p className="aviso-time">Hace 2 días</p>
                  </div>
                </div>

                <div className="aviso">
                  <div className="aviso-dot info" />
                  <div>
                    <p className="aviso-text">Tu avance en desarrollo web</p>
                    <p className="aviso-time">Hace 3 días</p>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}