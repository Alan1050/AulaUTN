import { useState, useEffect } from 'react'
import {
  obtenerPreguntasDocente,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
  type Pregunta
} from '../../lib/docenteQueries'
import { getDocenteId } from '../../lib/docenteQueries'

interface Props {
  grupoId: number
  materia: string
}

// Definir tipos para el formulario
type TipoPregunta = 'opcion_multiple' | 'verdadero_falso' | 'abierta'
type Dificultad = 'facil' | 'media' | 'dificil'

interface FormData {
  materia: string
  tema: string
  pregunta: string
  tipo: TipoPregunta
  opciones: string[]
  respuesta_correcta: string
  dificultad: Dificultad
  puntos: number
}

export default function BancoPreguntas({ grupoId, materia }: Props) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Pregunta | null>(null)
  const [filtros, setFiltros] = useState({
    materia: materia,
    dificultad: '',
    tipo: ''
  })
  const [formData, setFormData] = useState<FormData>({
    materia: materia,
    tema: '',
    pregunta: '',
    tipo: 'opcion_multiple',
    opciones: ['', '', '', ''],
    respuesta_correcta: '',
    dificultad: 'media',
    puntos: 1
  })

  useEffect(() => {
    cargarPreguntas()
  }, [filtros])

  const cargarPreguntas = async () => {
    setLoading(true)
    const data = await obtenerPreguntasDocente(filtros)
    setPreguntas(data)
    setLoading(false)
  }

  const handleGuardar = async () => {
    // Obtener el ID del docente actual
    const docenteId = getDocenteId()
    if (!docenteId) {
      alert('Error: No se pudo identificar al docente')
      return
    }

    // Preparar los datos para enviar
    const preguntaData = {
      materia: formData.materia,
      tema: formData.tema,
      pregunta: formData.pregunta,
      tipo: formData.tipo,
      opciones: formData.tipo === 'opcion_multiple' ? formData.opciones.filter(o => o.trim() !== '') : undefined,
      respuesta_correcta: formData.respuesta_correcta,
      dificultad: formData.dificultad,
      puntos: formData.puntos,
      grupo_id: grupoId,
      docente_id: docenteId  // Agregar el docente_id
    }

    let success
    if (editando) {
      success = await actualizarPregunta(editando.id, preguntaData)
    } else {
      const result = await crearPregunta(preguntaData)
      success = !!result
    }

    if (success) {
      await cargarPreguntas()
      setShowModal(false)
      resetForm()
    } else {
      alert('Error al guardar la pregunta')
    }
  }

  const resetForm = () => {
    setFormData({
      materia: materia,
      tema: '',
      pregunta: '',
      tipo: 'opcion_multiple',
      opciones: ['', '', '', ''],
      respuesta_correcta: '',
      dificultad: 'media',
      puntos: 1
    })
    setEditando(null)
  }

  const handleEditar = (pregunta: Pregunta) => {
    setEditando(pregunta)
    setFormData({
      materia: pregunta.materia,
      tema: pregunta.tema || '',
      pregunta: pregunta.pregunta,
      tipo: pregunta.tipo as TipoPregunta,
      opciones: pregunta.opciones || ['', '', '', ''],
      respuesta_correcta: pregunta.respuesta_correcta,
      dificultad: pregunta.dificultad as Dificultad,
      puntos: pregunta.puntos
    })
    setShowModal(true)
  }

  const handleEliminar = async (id: number) => {
    if (confirm('¿Eliminar esta pregunta?')) {
      await eliminarPregunta(id)
      await cargarPreguntas()
    }
  }

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case 'facil': return 'badge-green'
      case 'media': return 'badge-yellow'
      case 'dificil': return 'badge-red'
      default: return 'badge-gray'
    }
  }

  return (
    <div className="banco-preguntas">
      <div className="header">
        <div>
          <h2>Banco de Preguntas</h2>
          <p className="subtitle">Materia: {materia}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Nueva Pregunta
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <select
          value={filtros.dificultad}
          onChange={e => setFiltros({ ...filtros, dificultad: e.target.value })}
        >
          <option value="">Todas las dificultades</option>
          <option value="facil">Fácil</option>
          <option value="media">Media</option>
          <option value="dificil">Difícil</option>
        </select>
        <select
          value={filtros.tipo}
          onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
        >
          <option value="">Todos los tipos</option>
          <option value="opcion_multiple">Opción Múltiple</option>
          <option value="verdadero_falso">Verdadero/Falso</option>
          <option value="abierta">Abierta</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Cargando preguntas...</div>
      ) : (
        <div className="preguntas-list">
          {preguntas.length === 0 ? (
            <div className="empty-state">
              <p>No hay preguntas en el banco</p>
              <p className="empty-sub">Crea tu primera pregunta</p>
            </div>
          ) : (
            preguntas.map(p => (
              <div key={p.id} className="pregunta-card">
                <div className="pregunta-header">
                  <span className={`badge ${getDificultadColor(p.dificultad)}`}>
                    {p.dificultad.toUpperCase()}
                  </span>
                  <span className="badge badge-gray">
                    {p.tipo === 'opcion_multiple' ? 'OPCIÓN MÚLTIPLE' : 
                     p.tipo === 'verdadero_falso' ? 'V/F' : 'ABIERTA'}
                  </span>
                  <span className="puntos">{p.puntos} pts</span>
                </div>
                <p className="pregunta-text">{p.pregunta}</p>
                {p.tema && <p className="tema">📚 {p.tema}</p>}
                {p.tipo === 'opcion_multiple' && p.opciones && (
                  <div className="opciones">
                    {p.opciones.map((opcion, idx) => (
                      <div key={idx} className="opcion">
                        <span className="opcion-letra">{String.fromCharCode(65 + idx)}.</span>
                        <span>{opcion}</span>
                        {opcion === p.respuesta_correcta && (
                          <span className="check-correcta">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="pregunta-actions">
                  <button onClick={() => handleEditar(p)} className="btn-icon" title="Editar">
                    ✏️
                  </button>
                  <button onClick={() => handleEliminar(p.id)} className="btn-icon" title="Eliminar">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <h3>{editando ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
            <form onSubmit={e => { e.preventDefault(); handleGuardar() }}>
              <div className="form-group">
                <label>Tema</label>
                <input
                  type="text"
                  value={formData.tema}
                  onChange={e => setFormData({ ...formData, tema: e.target.value })}
                  placeholder="ej: Álgebra, SQL, etc."
                />
              </div>

              <div className="form-group">
                <label>Pregunta *</label>
                <textarea
                  required
                  value={formData.pregunta}
                  onChange={e => setFormData({ ...formData, pregunta: e.target.value })}
                  rows={3}
                  placeholder="Escribe la pregunta aquí..."
                />
              </div>

              <div className="form-group">
                <label>Tipo de Pregunta *</label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as TipoPregunta })}
                >
                  <option value="opcion_multiple">Opción Múltiple</option>
                  <option value="verdadero_falso">Verdadero/Falso</option>
                  <option value="abierta">Respuesta Abierta</option>
                </select>
              </div>

              {formData.tipo === 'opcion_multiple' && (
                <div className="form-group">
                  <label>Opciones</label>
                  {formData.opciones.map((opcion, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opcion}
                      onChange={e => {
                        const nuevas = [...formData.opciones]
                        nuevas[idx] = e.target.value
                        setFormData({ ...formData, opciones: nuevas })
                      }}
                      placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                      className="opcion-input"
                    />
                  ))}
                </div>
              )}

              <div className="form-group">
                <label>Respuesta Correcta *</label>
                {formData.tipo === 'opcion_multiple' ? (
                  <select
                    value={formData.respuesta_correcta}
                    onChange={e => setFormData({ ...formData, respuesta_correcta: e.target.value })}
                    required
                  >
                    <option value="">Selecciona la opción correcta</option>
                    {formData.opciones.filter(o => o.trim() !== '').map((opcion, idx) => (
                      <option key={idx} value={opcion}>
                        {String.fromCharCode(65 + idx)}. {opcion}
                      </option>
                    ))}
                  </select>
                ) : formData.tipo === 'verdadero_falso' ? (
                  <select
                    value={formData.respuesta_correcta}
                    onChange={e => setFormData({ ...formData, respuesta_correcta: e.target.value })}
                    required
                  >
                    <option value="">Selecciona la respuesta correcta</option>
                    <option value="true">Verdadero</option>
                    <option value="false">Falso</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.respuesta_correcta}
                    onChange={e => setFormData({ ...formData, respuesta_correcta: e.target.value })}
                    placeholder="Respuesta esperada"
                  />
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dificultad</label>
                  <select
                    value={formData.dificultad}
                    onChange={e => setFormData({ ...formData, dificultad: e.target.value as Dificultad })}
                  >
                    <option value="facil">Fácil</option>
                    <option value="media">Media</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Puntos</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.puntos}
                    onChange={e => setFormData({ ...formData, puntos: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editando ? 'Actualizar' : 'Crear Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}