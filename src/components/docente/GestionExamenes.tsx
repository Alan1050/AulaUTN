// components/docente/GestionExamenes.tsx
import { useState, useEffect } from 'react'
import {
  obtenerExamenesGrupo,
  crearExamen,
  actualizarExamen,
  eliminarExamen,
  obtenerExamenConPreguntas,
  asignarPreguntasAExamen,
  obtenerPreguntasDocente,
  obtenerEstadisticasExamen,
  type Examen,
  type Pregunta
} from '../../lib/docenteQueries'

interface Props {
  grupoId: number
  grupoNombre: string
  materia: string
}

interface ExamenFormData {
  titulo: string
  descripcion: string
  tiempo_limite: number
  fecha_inicio: string
  fecha_fin: string
  intentos_permitidos: number
  aleatorio: boolean
  mostrar_resultados: boolean
  activo: boolean
}

export default function GestionExamenes({ grupoId, grupoNombre, materia }: Props) {
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreguntasModal, setShowPreguntasModal] = useState(false)
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(null)
  const [editando, setEditando] = useState<Examen | null>(null)
  const [preguntasDisponibles, setPreguntasDisponibles] = useState<Pregunta[]>([])
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState<Map<number, { orden: number; puntos: number }>>(new Map())
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [formData, setFormData] = useState<ExamenFormData>({
    titulo: '',
    descripcion: '',
    tiempo_limite: 60,
    fecha_inicio: new Date().toISOString().slice(0, 16),
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    intentos_permitidos: 1,
    aleatorio: false,
    mostrar_resultados: true,
    activo: true
  })

  useEffect(() => {
    cargarExamenes()
  }, [grupoId])

  const cargarExamenes = async () => {
    setLoading(true)
    const data = await obtenerExamenesGrupo(grupoId)
    setExamenes(data)
    setLoading(false)
  }

  const handleGuardarExamen = async () => {
    if (!formData.titulo) {
      alert('El título es requerido')
      return
    }

    const examenData = {
      ...formData,
      grupo_id: grupoId
    }

    let success
    if (editando) {
      success = await actualizarExamen(editando.id, examenData)
    } else {
      const result = await crearExamen(examenData)
      success = !!result
      if (result) setExamenSeleccionado(result)
    }

    if (success) {
      await cargarExamenes()
      setShowModal(false)
      resetForm()
    } else {
      alert('Error al guardar el examen')
    }
  }

  const handleEliminarExamen = async (id: number) => {
    if (confirm('¿Eliminar este examen? Esta acción no se puede deshacer.')) {
      await eliminarExamen(id)
      await cargarExamenes()
    }
  }

  const handleVerPreguntas = async (examen: Examen) => {
    setExamenSeleccionado(examen)
    // Cargar preguntas del examen
    const examenCompleto = await obtenerExamenConPreguntas(examen.id)
    if (examenCompleto?.preguntasAsignadas) {
      const nuevasSelecciones = new Map()
      examenCompleto.preguntasAsignadas.forEach(p => {
        nuevasSelecciones.set(p.id, {
          orden: p.orden,
          puntos: p.puntos_asignados
        })
      })
      setPreguntasSeleccionadas(nuevasSelecciones)
    }
    
    // Cargar preguntas disponibles
    const preguntas = await obtenerPreguntasDocente({ materia })
    setPreguntasDisponibles(preguntas)
    setShowPreguntasModal(true)
  }

  const handleVerEstadisticas = async (examen: Examen) => {
    const stats = await obtenerEstadisticasExamen(examen.id)
    setEstadisticas(stats)
  }

  const handleGuardarPreguntas = async () => {
    if (!examenSeleccionado) return

    const preguntasAsignar = Array.from(preguntasSeleccionadas.entries()).map(([preguntaId, config]) => ({
      pregunta_id: preguntaId,
      orden: config.orden,
      puntos_asignados: config.puntos
    }))

    const success = await asignarPreguntasAExamen(examenSeleccionado.id, preguntasAsignar)
    if (success) {
      alert('Preguntas asignadas correctamente')
      setShowPreguntasModal(false)
      setPreguntasSeleccionadas(new Map())
    } else {
      alert('Error al asignar preguntas')
    }
  }

  const togglePregunta = (pregunta: Pregunta) => {
    if (preguntasSeleccionadas.has(pregunta.id)) {
      preguntasSeleccionadas.delete(pregunta.id)
      setPreguntasSeleccionadas(new Map(preguntasSeleccionadas))
    } else {
      preguntasSeleccionadas.set(pregunta.id, {
        orden: preguntasSeleccionadas.size + 1,
        puntos: pregunta.puntos
      })
      setPreguntasSeleccionadas(new Map(preguntasSeleccionadas))
    }
  }

  const actualizarPuntosPregunta = (preguntaId: number, puntos: number) => {
    const config = preguntasSeleccionadas.get(preguntaId)
    if (config) {
      preguntasSeleccionadas.set(preguntaId, { ...config, puntos })
      setPreguntasSeleccionadas(new Map(preguntasSeleccionadas))
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tiempo_limite: 60,
      fecha_inicio: new Date().toISOString().slice(0, 16),
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      intentos_permitidos: 1,
      aleatorio: false,
      mostrar_resultados: true,
      activo: true
    })
    setEditando(null)
  }

  const handleEditar = (examen: Examen) => {
    setEditando(examen)
    setFormData({
      titulo: examen.titulo,
      descripcion: examen.descripcion || '',
      tiempo_limite: examen.tiempo_limite,
      fecha_inicio: examen.fecha_inicio.slice(0, 16),
      fecha_fin: examen.fecha_fin.slice(0, 16),
      intentos_permitidos: examen.intentos_permitidos,
      aleatorio: examen.aleatorio,
      mostrar_resultados: examen.mostrar_resultados,
      activo: examen.activo
    })
    setShowModal(true)
  }

  const getStatusBadge = (examen: Examen) => {
    const ahora = new Date()
    const inicio = new Date(examen.fecha_inicio)
    const fin = new Date(examen.fecha_fin)

    if (!examen.activo) return { text: 'Inactivo', class: 'badge-gray' }
    if (ahora < inicio) return { text: 'Próximo', class: 'badge-blue' }
    if (ahora > fin) return { text: 'Finalizado', class: 'badge-red' }
    return { text: 'Activo', class: 'badge-green' }
  }

  return (
    <div className="examenes-container">
      <div className="examenes-header">
        <div>
          <h2>Exámenes</h2>
          <p className="subtitle">Grupo: {grupoNombre}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Crear Examen
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando exámenes...</div>
      ) : (
        <div className="examenes-grid">
          {examenes.length === 0 ? (
            <div className="empty-state">
              <p>No hay exámenes creados</p>
              <p className="empty-sub">Crea tu primer examen</p>
            </div>
          ) : (
            examenes.map(examen => {
              const status = getStatusBadge(examen)
              return (
                <div key={examen.id} className="examen-card">
                  <div className="examen-header">
                    <h3>{examen.titulo}</h3>
                    <span className={`badge ${status.class}`}>{status.text}</span>
                  </div>
                  <p className="examen-descripcion">{examen.descripcion || 'Sin descripción'}</p>
                  <div className="examen-detalles">
                    <div className="detalle">
                      <span>⏱️</span>
                      <span>{examen.tiempo_limite} minutos</span>
                    </div>
                    <div className="detalle">
                      <span>🔄</span>
                      <span>{examen.intentos_permitidos} intento(s)</span>
                    </div>
                    <div className="detalle">
                      <span>📅</span>
                      <span>{new Date(examen.fecha_inicio).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="examen-actions">
                    <button onClick={() => handleVerPreguntas(examen)} className="btn-secondary-small">
                      📋 Preguntas
                    </button>
                    <button onClick={() => handleVerEstadisticas(examen)} className="btn-secondary-small">
                      📊 Estadísticas
                    </button>
                    <button onClick={() => handleEditar(examen)} className="btn-icon">✏️</button>
                    <button onClick={() => handleEliminarExamen(examen.id)} className="btn-icon">🗑️</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal de estadísticas */}
      {estadisticas && (
        <div className="modal-overlay" onClick={() => setEstadisticas(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Estadísticas del Examen</h3>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-value">{estadisticas.total_intentos}</span>
                <span className="stat-label">Intentos totales</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{estadisticas.promedio}</span>
                <span className="stat-label">Promedio</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{estadisticas.aprobados}</span>
                <span className="stat-label">Aprobados</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{estadisticas.reprobados}</span>
                <span className="stat-label">Reprobados</span>
              </div>
              <div className="stat-item full-width">
                <span className="stat-value">{estadisticas.porcentaje_aprobacion}%</span>
                <span className="stat-label">Tasa de aprobación</span>
              </div>
            </div>
            <button onClick={() => setEstadisticas(null)} className="btn-primary">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal de creación/edición de examen */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <h3>{editando ? 'Editar Examen' : 'Nuevo Examen'}</h3>
            <form onSubmit={e => { e.preventDefault(); handleGuardarExamen() }}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Examen Parcial 1"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Instrucciones para los alumnos..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de inicio *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_inicio}
                    onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de fin *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_fin}
                    onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tiempo límite (minutos)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.tiempo_limite}
                    onChange={e => setFormData({ ...formData, tiempo_limite: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Intentos permitidos</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.intentos_permitidos}
                    onChange={e => setFormData({ ...formData, intentos_permitidos: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.aleatorio}
                      onChange={e => setFormData({ ...formData, aleatorio: e.target.checked })}
                    />
                    Orden aleatorio de preguntas
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.mostrar_resultados}
                      onChange={e => setFormData({ ...formData, mostrar_resultados: e.target.checked })}
                    />
                    Mostrar resultados al alumno
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                    />
                    Examen activo
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editando ? 'Actualizar' : 'Crear Examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de selección de preguntas */}
      {showPreguntasModal && (
        <div className="modal-overlay" onClick={() => setShowPreguntasModal(false)}>
          <div className="modal-content preguntas-modal" onClick={e => e.stopPropagation()}>
            <h3>Seleccionar Preguntas para "{examenSeleccionado?.titulo}"</h3>
            <div className="preguntas-lista">
              {preguntasDisponibles.length === 0 ? (
                <div className="empty-state">
                  <p>No hay preguntas disponibles</p>
                  <p className="empty-sub">Crea preguntas en el Banco de Preguntas primero</p>
                </div>
              ) : (
                preguntasDisponibles.map(pregunta => (
                  <div key={pregunta.id} className="pregunta-select-item">
                    <div className="pregunta-select-info">
                      <input
                        type="checkbox"
                        checked={preguntasSeleccionadas.has(pregunta.id)}
                        onChange={() => togglePregunta(pregunta)}
                      />
                      <div className="pregunta-content">
                        <p className="pregunta-text">{pregunta.pregunta}</p>
                        <div className="pregunta-meta">
                          <span className={`badge ${pregunta.dificultad === 'facil' ? 'badge-green' : pregunta.dificultad === 'media' ? 'badge-yellow' : 'badge-red'}`}>
                            {pregunta.dificultad}
                          </span>
                          <span className="badge badge-gray">{pregunta.tipo}</span>
                        </div>
                      </div>
                    </div>
                    {preguntasSeleccionadas.has(pregunta.id) && (
                      <div className="pregunta-select-config">
                        <label>
                          Puntos:
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={preguntasSeleccionadas.get(pregunta.id)?.puntos || pregunta.puntos}
                            onChange={e => actualizarPuntosPregunta(pregunta.id, parseInt(e.target.value))}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowPreguntasModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleGuardarPreguntas} className="btn-primary">
                Guardar Preguntas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}