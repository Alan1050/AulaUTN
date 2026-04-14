// pages/Docente/GrupoPage.tsx (nuevo archivo)
import { useState,useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import GestionRecursos from '../../components/docente/GestionRecursos'
import BancoPreguntas from '../../components/docente/BancoPreguntas'
import GestionExamenes from '../../components/docente/GestionExamenes'

import { obtenerGruposDocente, obtenerInfoDocente } from '../../lib/docenteQueries'
import type { GrupoDocente } from '../../lib/docenteQueries'
import { logout } from '../../lib/auth'

import './GrupoPage.css'

export default function GrupoPage() {
  const location = useLocation()
  const { grupoId, grupoNombre, materia } = location.state || {}
  const [activeTab, setActiveTab] = useState('recursos')

  const navigate = useNavigate()

  // Estados del Sidebar
  const [collapsed, setCollapsed] = useState(false)
  const [gruposOpen, setGruposOpen] = useState(true)
  const [activeNav, setActiveNav] = useState('grupos')
  const [docenteInfo, setDocenteInfo] = useState<{ nombre: string; apellidoPaterno: string } | null>(null)
  const [grupos, setGrupos] = useState<GrupoDocente[]>([])
 
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const info = await obtenerInfoDocente()
        if (info) setDocenteInfo({ nombre: info.nombre, apellidoPaterno: info.apellidoPaterno })
        const gruposData = await obtenerGruposDocente()
        setGrupos(gruposData)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      }
    }
    cargarDatos()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleGrupoClick = (id: number, nombre: string, mat: string) => {
    navigate(`/Docente/grupo/${id}`, { 
      state: { grupoNombre: nombre, grupoId: id, materia: mat } 
    })
  }

  const getInitials = () => {
    if (!docenteInfo) return '??'
    const n = docenteInfo.nombre?.charAt(0).toUpperCase() || ''
    const a = docenteInfo.apellidoPaterno?.charAt(0).toUpperCase() || ''
    return `${n}${a}`
  }
  const tabs = [
    { id: 'recursos', label: '📚 Recursos', component: GestionRecursos },
    { id: 'preguntas', label: '📝 Banco de Preguntas', component: BancoPreguntas },
    { id: 'examenes', label: '📋 Exámenes', component: GestionExamenes },

  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

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
            <span className="sb-logo-name" translate="no">Aula<span>UTN</span></span>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar" translate="no">{getInitials()}</div>
          <div className="sb-info">
           <div className="sb-uname" translate="no" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              {docenteInfo ? (
                <>
                  <span>Mtro. {docenteInfo.nombre}</span>
                  <span>{docenteInfo.apellidoPaterno}</span>
                </>
              ) : (
                'Mtro. Docente'
              )}
            </div>
            <div className="sb-uid">Docente</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>

          <div 
            className={`nav-item ${activeNav === 'inicio' ? 'active' : ''}`} 
            onClick={() => {
              setActiveNav('inicio')
              navigate('/Docente')
            }}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Inicio</span>
          </div>

          <div>
            <div 
              className={`nav-item ${activeNav === 'grupos' ? 'active' : ''}`} 
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false)
                  setGruposOpen(true)
                } else {
                  setGruposOpen(!gruposOpen)
                }
                setActiveNav('grupos')
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
                {grupos.length > 0 ? (
                  grupos.map((grupo) => (
                    <div 
                      key={grupo.id}
                      className={`nav-item course-item ${grupo.id === grupoId ? 'active' : ''}`} 
                      onClick={() => handleGrupoClick(grupo.id, grupo.nombre, grupo.materia)}
                    >
                      <div className="course-avatar" style={{backgroundColor: 'rgba(229, 198, 135, 0.15)'}}>
                        {grupo.nombre.replace(/[^0-9]/g, '').slice(-2) || 'G'}
                      </div>
                      <span className="course-title">{grupo.nombre}</span>
                    </div>
                  ))
                ) : (
                  <div></div>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="sb-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

    <div className="grupo-page">
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {ActiveComponent && (
          <ActiveComponent 
            grupoId={grupoId} 
            grupoNombre={grupoNombre}
            materia={materia}
          />
        )}
      </div>
    </div>
    </div>
  )
}