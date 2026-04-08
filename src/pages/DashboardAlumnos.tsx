import './DashboardAlumno.css'
import { useState } from 'react'

export default function DashboardAlumno() {
   
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="dashboard">

      {/* Sidebar */}
       <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

        <div className="sb-top">
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
           <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">JL</div>
          <div className="sb-info">
            <div className="sb-uname">Juan Lopez </div>
            <div className="sb-uid">TIC-310000</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>

          <div className="nav-item active">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Inicio</span>
          </div>

          <div className="nav-item">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
            <span>Materias</span>
          </div>

          <div className="nav-item">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
            </svg>
            <span>Mis avances</span>
          </div>

          <div className="nav-item">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span>Avisos</span>
          </div>
        </nav>

        <div className="sb-footer">
          <button className="logout-btn">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar sesión</span>
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
            <div className="stat-card">
              <p className="stat-label">Avance general</p>
              
            </div>
          </div>

          <div className="two-col">

            {/* Materias */}
            <section>
              <p className="section-title">Mis materias</p>
              <div className="materias-grid">

                <div className="materia-card">
                  <p className="mat-name">Programación Web</p>
                  <p className="mat-desc">HTML, CSS, JS y frameworks</p>
                </div>

                <div className="materia-card">
                  <p className="mat-name">Base de Datos</p>
                  <p className="mat-desc">SQL, modelado y normalización</p>
                </div>

                <div className="materia-card">
                  <p className="mat-name">Redes y Comunicaciones</p>
                  <p className="mat-desc">Protocolos, TCP/IP y seguridad</p>
                </div>

                <div className="materia-card">
                  <p className="mat-name">Ing. de Software</p>
                  <p className="mat-desc">Metodologías ágiles y ciclo</p>
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
                    <p className="aviso-text">Nuevo material de Redes: capítulo 4 </p>
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