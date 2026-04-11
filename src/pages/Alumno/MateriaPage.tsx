// pages/Alumno/MateriaPage.tsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  obtenerMaterialesPorGrupo, 
  descargarMaterial,
  obtenerExamenesAlumno,
  type MaterialAlumno,
  type ExamenAlumno
} from '../../lib/alumnoQueries'
import { formatTiempoRelativo } from '../../lib/alumnoQueries'

export default function MateriaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { materiaId, materiaNombre } = location.state || {}
  
  const [activeTab, setActiveTab] = useState('recursos')
  const [materiales, setMateriales] = useState<MaterialAlumno[]>([])
  const [examenes, setExamenes] = useState<ExamenAlumno[]>([])
  const [loading, setLoading] = useState(true)

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

  if (!materiaId) {
    return <div className="error">No se encontró la materia</div>
  }

  return (
    <div className="materia-page">
      <div className="materia-header">
        <button onClick={() => navigate('/Alumno')} className="back-btn">
          ← Volver
        </button>
        <h1>{materiaNombre}</h1>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'recursos' ? 'active' : ''}`}
          onClick={() => setActiveTab('recursos')}
        >
          📚 Recursos Digitales
        </button>
        <button 
          className={`tab ${activeTab === 'examenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('examenes')}
        >
          📋 Exámenes
        </button>
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : activeTab === 'recursos' ? (
          <div className="materiales-grid">
            {materiales.length === 0 ? (
              <div className="empty-state">
                <p>No hay recursos disponibles</p>
              </div>
            ) : (
              materiales.map(material => (
                <div key={material.id} className="material-card">
                  <div className="material-icon">{getIconoTipo(material.tipo)}</div>
                  <div className="material-info">
                    <h3>{material.titulo}</h3>
                    <p>{material.descripcion}</p>
                    <div className="material-meta">
                      <span>👨‍🏫 {material.docente_nombre}</span>
                      <span>📅 {formatTiempoRelativo(material.created_at)}</span>
                      <span>📥 {material.descargas} descargas</span>
                    </div>
                    {material.etiquetas?.length > 0 && (
                      <div className="etiquetas">
                        {material.etiquetas.map(et => (
                          <span key={et} className="etiqueta">{et}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDescargar(material)}
                    className="btn-descargar"
                  >
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
  )
}