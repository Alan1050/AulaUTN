// pages/Alumno/MateriaPage.tsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  obtenerMaterialesPorGrupo, 
  descargarMaterial,
  obtenerExamenesAlumno,
  obtenerInfoAlumno,
  obtenerMateriasAlumno,
  type MateriaAlumno,
  type MaterialAlumno,
  type ExamenAlumno
} from '../../lib/alumnoQueries'
import { formatTiempoRelativo } from '../../lib/alumnoQueries'
import './MateriaPage.css'
import { logout } from '../../lib/auth'

export default function MateriaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { materiaId, materiaNombre } = location.state || {}
  
  const [activeTab, setActiveTab] = useState('recursos')
  const [materiales, setMateriales] = useState<MaterialAlumno[]>([])
  const [examenes, setExamenes] = useState<ExamenAlumno[]>([])
  const [loading, setLoading] = useState(true)

  const [collapsed, setCollapsed] = useState(false)
  const [materiasOpen, setMateriasOpen] = useState(false)
  const [alumnoInfo, setAlumnoInfo] = useState<{ nombre: string; apellidoPaterno: string; matricula: string; } | null>(null)
  const [materias, setMaterias] = useState<MateriaAlumno[]>([])

  useEffect(() => {
    if (materiaId) {
      cargarDatos()
    }
  }, [materiaId])

  const cargarDatos = async () => {
    setLoading(true)
    const [materialesData, examenesData] = await Promise.all([
      obtenerMaterialesPorGrupo(materiaId),
      obtenerExamenesAlumno()
    ])
    setMateriales(materialesData)
    setExamenes(examenesData.filter(e => e.grupo_id === materiaId))
   
     // Obtener información del alumno
     const info = await obtenerInfoAlumno()
        if (info) {
          setAlumnoInfo({
            nombre: info.nombre,
            apellidoPaterno: info.apellidoPaterno,
            matricula: info.matricula
          })
        }
    // Obtener materias
    const materiasData = await obtenerMateriasAlumno()
    setMaterias(materiasData)
    setLoading(false)
  }

  const handleDescargar = async (material: MaterialAlumno) => {
    if (material.tipo === 'archivo' && material.archivo_path) {
      await descargarMaterial(material.id, material.archivo_path)
    } else if (material.tipo === 'enlace' && material.url) {
      window.open(material.url, '_blank')
    }
  }

  const handleTomarExamen = (examen: ExamenAlumno) => {
    navigate(`/Alumno/examen/${examen.id}`, { 
      state: { 
        examenId: examen.id,
        examenTitulo: examen.titulo,
        materiaNombre: materiaNombre
      } 
    })
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'archivo': return '📄'
      case 'enlace': return '🔗'
      case 'tarea': return '📝'
      case 'examen': return '📋'
      default: return '📎'
    }
  }

  const getEstadoExamen = (examen: ExamenAlumno) => {
    switch (examen.estado) {
      case 'pendiente': return { text: 'Próximo', class: 'badge-blue' }
      case 'en_curso': return { text: 'Disponible', class: 'badge-green' }
      case 'completado': return { text: 'Completado', class: 'badge-gray' }
      default: return { text: 'No disponible', class: 'badge-red' }
    }
  }
   // Obtener iniciales del nombre para el avatar
const getInitials = () => {
    if (!alumnoInfo) return '??'
    const nombreInicial = alumnoInfo.nombre ? alumnoInfo.nombre.charAt(0).toUpperCase() : ''
    const apellidoInicial = alumnoInfo.apellidoPaterno ? alumnoInfo.apellidoPaterno.charAt(0).toUpperCase() : ''
    return `${nombreInicial}${apellidoInicial}`
  }
   // Navega a la página de la materia
  const irAMateria = (id: number, nombre: string) => {
    navigate(`/Alumno/materia/${id}`, { state: { materiaNombre: nombre, materiaId: id } })
  }
   // Manejar cierre de sesión
  const handleLogout = () => {
      logout()
      navigate('/login')
    }
    
    // Obtener matrícula
  const getMatricula = () => {
    if (!alumnoInfo) return 'XXX-000000'
    return alumnoInfo.matricula
  }

  if (!materiaId) {
    return <div className="error">No se encontró la materia</div>
  }

  return (
    <div className="dashboard">
     
      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sb-top">
          <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
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
            <span className="sb-logo-name" translate="no">Aula<span>UTN</span></span>
          </div>
        </div>

       <div className="sb-user">
          <div className="sb-avatar" translate="no">{getInitials()}</div>
          <div className="sb-info">
            <div className="sb-uname" translate="no" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              {alumnoInfo ? (
                <>
                  <span>{alumnoInfo.nombre}</span>
                  <span>{alumnoInfo.apellidoPaterno}</span>
                </>
              ) : (
                'Alumno'
              )}
            </div>
            {/* Aquí llamas a tu función */}
            <div className="sb-uid">{getMatricula()}</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>
          <div className="nav-item" onClick={() => navigate('/Alumno')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Inicio</span>
          </div>

          <div>
            <div
              className={`nav-item ${activeTab ? 'active' : ''}`}
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false)
                  setMateriasOpen(true)
                } else {
                  setMateriasOpen(v => !v)
                }
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
              <svg className={`chevron${materiasOpen ? ' open' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {materiasOpen && (
              <div className="accordion-content">
                {materias.map((materia) => (
                  <div 
                    key={materia.id}
                    className={`nav-item course-item ${materia.id === materiaId ? 'active' : ''}`} 
                    onClick={() => irAMateria(materia.id, materia.materia)}
                  >
                    <div className="course-avatar" style={{ backgroundColor: 'rgba(229, 198, 135, 0.15)' }}>
                      {materia.materia.charAt(0).toUpperCase()}
                    </div>
                    <span className="course-title">{materia.materia}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

          <div className="sb-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido  */}
      <div className="mp-main">
        <header className="mp-topbar">
          <button onClick={() => navigate('/Alumno')} className="mp-back">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Volver
          </button>
          <h1 className="mp-titulo">{materiaNombre}</h1>
        </header>

        <div className="mp-tabs">
          <button 
            className={`mp-tab ${activeTab === 'recursos' ? 'active' : ''}`}
            onClick={() => setActiveTab('recursos')}
          >
            📚 Recursos Digitales
          </button>
          <button 
            className={`mp-tab ${activeTab === 'examenes' ? 'active' : ''}`}
            onClick={() => setActiveTab('examenes')}
          >
            📋 Exámenes
          </button>
        </div>

        <div className="mp-content">
          {loading ? (
            <p className="mp-loading">Cargando...</p>
          ) : activeTab === 'recursos' ? (
            <div className="mp-grid">
              {materiales.length === 0 ? (
                <div className="mp-empty">No hay recursos disponibles</div>
              ) : (
                materiales.map(material => (
                  <div key={material.id} className="mp-card">
                    <div className="mp-card-icon">{getIconoTipo(material.tipo)}</div>
                    <div className="mp-card-body">
                      <p className="mp-card-titulo">{material.titulo}</p>
                      {material.descripcion && ( 
                        <p className="mp-card-desc">{material.descripcion}</p>
                      )}
                      <div className="mp-card-meta">
                        <span>👨‍🏫 {material.docente_nombre}</span>
                        <span>📅 {formatTiempoRelativo(material.created_at)}</span>
                        <span>📥 {material.descargas} descargas</span>
                      </div>
                      {material.etiquetas?.length > 0 && (
                        <div className="mp-etiquetas">
                          {material.etiquetas.map(et => (
                            <span key={et} className="mp-etiqueta">{et}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleDescargar(material)} className="mp-btn">
                      {material.tipo === 'enlace' ? 'Abrir enlace' : 'Descargar'}
                    </button>
                  </div>
                ))
              )}
            </div>
        ) : (
          <div className="examenes-grid">
            {examenes.length === 0 ? (
              <div className="empty-state">
                <p>No hay exámenes disponibles</p>
              </div>
            ) : (
              examenes.map(examen => {
                const estado = getEstadoExamen(examen)
                return (
                  <div key={examen.id} className="examen-card">
                    <div className="examen-header">
                      <h3>{examen.titulo}</h3>
                      <span className={`badge ${estado.class}`}>{estado.text}</span>
                    </div>
                    <p className="examen-descripcion">{examen.descripcion}</p>
                    <div className="examen-detalles">
                      <div>⏱️ {examen.tiempo_limite} minutos</div>
                      <div>🔄 {examen.intentos_permitidos} intento(s)</div>
                      <div>📅 {new Date(examen.fecha_fin).toLocaleDateString()}</div>
                    </div>
                    {/* ✅ CORREGIDO: Verificar si mejor_calificacion existe y es mayor a 0 */}
                    {examen.mejor_calificacion !== undefined && examen.mejor_calificacion > 0 && (
                      <div className="mejor-calificacion">
                        Mejor puntaje: {examen.mejor_calificacion}%
                      </div>
                    )}
                    <button 
                      onClick={() => handleTomarExamen(examen)}
                      disabled={examen.estado !== 'en_curso'}
                      className={`btn-examen ${examen.estado === 'en_curso' ? 'btn-primary' : 'btn-disabled'}`}
                    >
                      {examen.estado === 'en_curso' ? 'Tomar examen' : 
                       examen.estado === 'pendiente' ? 'Próximamente' : 
                       'Finalizado'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  )
}