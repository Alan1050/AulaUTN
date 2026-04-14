// components/docente/GestionRecursos.tsx
import { useState, useEffect } from 'react'
import { 
  obtenerMaterialesGrupo, 
  subirMaterial, 
  eliminarMaterial,
  type Material 
} from '../../lib/docenteQueries'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  grupoId: number
  grupoNombre: string
}

// Definir el tipo para el tipo de recurso
type TipoRecurso = 'archivo' | 'enlace' | 'tarea' | 'examen'

export default function GestionRecursos({ grupoId, grupoNombre }: Props) {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'archivo' as TipoRecurso, // Cambiado a TipoRecurso
    url: '',
    etiquetas: ''
  })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    cargarMateriales()
  }, [grupoId])

  const cargarMateriales = async () => {
    setLoading(true)
    const data = await obtenerMaterialesGrupo(grupoId)
    setMateriales(data)
    setLoading(false)
  }

  const handleSubirMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    try {
      let archivo_path = ''
      let tamanio_bytes = 0

      // Subir archivo a Supabase Storage si es necesario
      if (formData.tipo === 'archivo' && archivo) {
        const fileName = `${Date.now()}_${archivo.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('materiales')
          .upload(`${grupoId}/${fileName}`, archivo)

        if (uploadError) throw uploadError
        archivo_path = uploadData.path
        tamanio_bytes = archivo.size
      }

      const nuevoMaterial = await subirMaterial({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        url: formData.tipo === 'enlace' ? formData.url : undefined,
        archivo_path: archivo_path || undefined,
        tamanio_bytes: tamanio_bytes || undefined,
        etiquetas: formData.etiquetas.split(',').map(e => e.trim()),
        grupo_id: grupoId,
        activo: true,
        docente_id: 0
      })

      if (nuevoMaterial) {
        await cargarMateriales()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error al subir material:', error)
      alert('Error al subir el material')
    } finally {
      setSubiendo(false)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'archivo',
      url: '',
      etiquetas: ''
    })
    setArchivo(null)
  }

  const handleEliminar = async (id: number) => {
    if (confirm('¿Eliminar este material?')) {
      await eliminarMaterial(id)
      await cargarMateriales()
    }
  }

  const getIconoTipo = (tipo: TipoRecurso) => { // Cambiado el tipo del parámetro
    switch (tipo) {
      case 'archivo': return '📄'
      case 'enlace': return '🔗'
      case 'tarea': return '📝'
      case 'examen': return '📋'
      default: return '📎'
    }
  }

  return (
    <div className="recursos-container">
      <div className="recursos-header">
        <div>
          <h2>Recursos Digitales</h2>
          <p className="subtitle">Grupo: {grupoNombre}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Subir Recurso
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando recursos...</div>
      ) : (
        <div className="materiales-grid">
          {materiales.length === 0 ? (
            <div className="empty-state">
              <p>No hay recursos disponibles</p>
              <p className="empty-sub">Sube tu primer recurso digital</p>
            </div>
          ) : (
            materiales.map(material => (
              <div key={material.id} className="material-card">
                <div className="material-icon">{getIconoTipo(material.tipo as TipoRecurso)}</div>
                <div className="material-content">
                  <h3>{material.titulo}</h3>
                  <p>{material.descripcion}</p>
                  {material.etiquetas && material.etiquetas.length > 0 && (
                    <div className="etiquetas">
                      {material.etiquetas.map(et => (
                        <span key={et} className="etiqueta">{et}</span>
                      ))}
                    </div>
                  )}
                  <div className="material-meta">
                    <span>📥 {material.descargas} descargas</span>
                    <span>📅 {new Date(material.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="material-actions">
                  <button onClick={() => handleEliminar(material.id)} className="btn-icon">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para subir recurso */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Subir Nuevo Recurso</h3>
            <form onSubmit={handleSubirMaterial}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Recurso *</label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as TipoRecurso })}
                >
                  <option value="archivo">Archivo (PDF, Word, PPT, etc.)</option>
                  <option value="enlace">Enlace Web</option>
                  <option value="tarea">Tarea</option>
                  <option value="examen">Examen</option>
                </select>
              </div>

              {formData.tipo === 'archivo' && (
                <div className="form-group">
                  <label>Archivo *</label>
                  <input
                    type="file"
                    required
                    onChange={e => setArchivo(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
                  />
                </div>
              )}

              {formData.tipo === 'enlace' && (
                <div className="form-group">
                  <label>URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.etiquetas}
                  onChange={e => setFormData({ ...formData, etiquetas: e.target.value })}
                  placeholder="ej: PDF, tema1, ejercicios"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={subiendo} className="btn-primary">
                  {subiendo ? 'Subiendo...' : 'Subir Recurso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}