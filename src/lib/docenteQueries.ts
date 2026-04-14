import { supabase } from './supabaseClient'
import { getSesion } from './auth'

// ========== INTERFACES ==========
export interface GrupoDocente {
  id: number
  nombre: string
  materia: string
  cuatrimestre: string
  codigo_grupo: string
  alumnos_count?: number
}

export interface EstadisticasDocente {
  grupos_activos: number
  total_alumnos: number
  materiales_subidos: number
}

export interface Material {
  id: number
  titulo: string
  descripcion: string
  tipo: 'archivo' | 'enlace' | 'tarea' | 'examen'
  url?: string
  archivo_path?: string
  tamanio_bytes?: number
  descargas: number
  etiquetas: string[]
  grupo_id: number
  docente_id: number
  created_at: string
  activo: boolean
}

export interface Pregunta {
  id: number
  materia: string
  tema: string
  pregunta: string
  tipo: 'opcion_multiple' | 'verdadero_falso' | 'abierta'
  opciones?: string[]
  respuesta_correcta: string
  dificultad: 'facil' | 'media' | 'dificil'
  puntos: number
  docente_id: number
  grupo_id: number
  created_at: string
}

export interface Examen {
  id: number
  titulo: string
  descripcion: string
  grupo_id: number
  docente_id: number
  tiempo_limite: number
  fecha_inicio: string
  fecha_fin: string
  intentos_permitidos: number
  aleatorio: boolean
  mostrar_resultados: boolean
  activo: boolean
  created_at: string
}

export interface IntentoExamen {
  id: number
  alumno_id: number
  examen_id: number
  fecha_inicio: string
  fecha_entrega: string
  calificacion: number
  intento_numero: number
  estado: 'en_curso' | 'completado' | 'cancelado'
}

export interface ExamenConPreguntas extends Examen {
  preguntasAsignadas?: PreguntaConPuntaje[]
}

export interface PreguntaConPuntaje extends Pregunta {
  puntos_asignados: number
  orden: number
}

// ========== FUNCIONES DE AUTENTICACIÓN Y DOCENTE ==========
export function getDocenteId(): number | null {
  const sesion = getSesion()
  return sesion?.id || null
}

export async function obtenerGruposDocente(): Promise<GrupoDocente[]> {
  const docenteId = getDocenteId()
  
  if (!docenteId) {
    console.error('No se encontró ID del docente')
    return []
  }
  
  const { data, error } = await supabase
    .from('docentegrupo')
    .select(`
      grupo_id,
      grupos:grupo_id (
        id,
        nombre,
        materia,
        cuatrimestre,
        codigo_grupo
      )
    `)
    .eq('docente_id', docenteId)
  
  if (error) {
    console.error('Error al obtener grupos:', error)
    return []
  }
  
  const grupos: GrupoDocente[] = []
  
  if (data) {
    for (const item of data) {
      const gruposData = item.grupos as any
      if (gruposData && !Array.isArray(gruposData)) {
        grupos.push({
          id: gruposData.id,
          nombre: gruposData.nombre || '',
          materia: gruposData.materia || '',
          cuatrimestre: gruposData.cuatrimestre || '',
          codigo_grupo: gruposData.codigo_grupo || ''
        })
      }
    }
  }
  
  return grupos
}

export async function obtenerEstadisticasDocente(): Promise<EstadisticasDocente> {
  const docenteId = getDocenteId()
  
  if (!docenteId) {
    return { grupos_activos: 0, total_alumnos: 0, materiales_subidos: 0 }
  }
  
  const grupos = await obtenerGruposDocente()
  const gruposIds = grupos.map(g => g.id)
  
  let totalAlumnos = 0
  if (gruposIds.length > 0) {
    const { count, error: alumnosError } = await supabase
      .from('alumnogrupo')
      .select('alumno_id', { count: 'exact', head: true })
      .in('grupo_id', gruposIds)
    
    if (!alumnosError && count) {
      totalAlumnos = count
    }
  }
  
  const { count: materialesCount, error: materialesError } = await supabase
    .from('materiales')
    .select('id', { count: 'exact', head: true })
    .eq('docente_id', docenteId)
  
  const materialesSubidos = !materialesError && materialesCount ? materialesCount : 0
  
  return {
    grupos_activos: grupos.length,
    total_alumnos: totalAlumnos,
    materiales_subidos: materialesSubidos
  }
}

export async function obtenerInfoDocente() {
  const docenteId = getDocenteId()
  
  if (!docenteId) return null
  
  const { data, error } = await supabase
    .from('Docentes')
    .select('id, nombre, apellidoPaterno, apellidoMaterno, email, clave')
    .eq('id', docenteId)
    .single()
  
  if (error) {
    console.error('Error al obtener info del docente:', error)
    return null
  }
  
  return data
}

// ========== FUNCIONES PARA RECURSOS/MATERIALES ==========
export async function obtenerMaterialesGrupo(grupoId: number): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materiales')
    .select('*')
    .eq('grupo_id', grupoId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener materiales:', error)
    return []
  }

  return data || []
}

export async function subirMaterial(
  material: Omit<Material, 'id' | 'created_at' | 'descargas'>
): Promise<Material | null> {
  const docenteId = getDocenteId()
  if (!docenteId) return null

  const { data, error } = await supabase
    .from('materiales')
    .insert([{ ...material, docente_id: docenteId, descargas: 0 }])
    .select()
    .single()

  if (error) {
    console.error('Error al subir material:', error)
    return null
  }

  return data
}

export async function eliminarMaterial(materialId: number): Promise<boolean> {
  const { error } = await supabase
    .from('materiales')
    .update({ activo: false })
    .eq('id', materialId)

  if (error) {
    console.error('Error al eliminar material:', error)
    return false
  }

  return true
}

export async function registrarDescarga(materialId: number, usuarioId: number, usuarioRol: string, ip: string) {
  const { error } = await supabase
    .from('log_descargas')
    .insert([{
      material_id: materialId,
      usuario_id: usuarioId,
      usuario_rol: usuarioRol,
      ip_address: ip
    }])

  if (error) {
    console.error('Error al registrar descarga:', error)
  }
}

// ========== FUNCIONES PARA BANCO DE PREGUNTAS ==========
export async function obtenerPreguntasDocente(filtros?: {
  materia?: string
  dificultad?: string
  tipo?: string
}): Promise<Pregunta[]> {
  const docenteId = getDocenteId()
  if (!docenteId) return []

  let query = supabase
    .from('banco_preguntas')
    .select('*')
    .eq('docente_id', docenteId)
    .order('created_at', { ascending: false })

  if (filtros?.materia) query = query.eq('materia', filtros.materia)
  if (filtros?.dificultad) query = query.eq('dificultad', filtros.dificultad)
  if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener preguntas:', error)
    return []
  }

  return data || []
}

export async function crearPregunta(pregunta: Omit<Pregunta, 'id' | 'created_at'>): Promise<Pregunta | null> {
  const docenteId = getDocenteId()
  if (!docenteId) return null

  const { data, error } = await supabase
    .from('banco_preguntas')
    .insert([{ ...pregunta, docente_id: docenteId }])
    .select()
    .single()

  if (error) {
    console.error('Error al crear pregunta:', error)
    return null
  }

  return data
}

export async function actualizarPregunta(id: number, updates: Partial<Omit<Pregunta, 'id' | 'created_at'>>): Promise<boolean> {
  const { error } = await supabase
    .from('banco_preguntas')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error al actualizar pregunta:', error)
    return false
  }

  return true
}

export async function eliminarPregunta(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('banco_preguntas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar pregunta:', error)
    return false
  }

  return true
}

// ========== FUNCIONES PARA EXÁMENES ==========
export async function obtenerExamenesGrupo(grupoId: number): Promise<Examen[]> {
  const docenteId = getDocenteId()
  if (!docenteId) return []

  const { data, error } = await supabase
    .from('examenes')
    .select('*')
    .eq('grupo_id', grupoId)
    .eq('docente_id', docenteId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener exámenes:', error)
    return []
  }

  return data || []
}

export async function obtenerExamenConPreguntas(examenId: number): Promise<ExamenConPreguntas | null> {
  const { data: examen, error: examenError } = await supabase
    .from('examenes')
    .select('*')
    .eq('id', examenId)
    .single()

  if (examenError) {
    console.error('Error al obtener examen:', examenError)
    return null
  }

  const { data: preguntasAsignadas, error: preguntasError } = await supabase
    .from('examen_preguntas')
    .select(`
      orden,
      puntos_asignados,
      banco_preguntas:pregunta_id (*)
    `)
    .eq('examen_id', examenId)
    .order('orden', { ascending: true })

  if (preguntasError) {
    console.error('Error al obtener preguntas del examen:', preguntasError)
    return examen
  }

  const preguntas = preguntasAsignadas.map(item => {
    const preguntaData = item.banco_preguntas as any
    return {
      ...preguntaData,
      puntos_asignados: item.puntos_asignados,
      orden: item.orden
    }
  })

  return { ...examen, preguntasAsignadas: preguntas }
}

export async function crearExamen(
  examen: Omit<Examen, 'id' | 'created_at' | 'docente_id'>
): Promise<Examen | null> {
  const docenteId = getDocenteId()
  if (!docenteId) return null

  const { data, error } = await supabase
    .from('examenes')
    .insert([{ ...examen, docente_id: docenteId }])
    .select()
    .single()

  if (error) {
    console.error('Error al crear examen:', error)
    return null
  }

  return data
}

export async function actualizarExamen(
  id: number,
  updates: Partial<Omit<Examen, 'id' | 'created_at' | 'docente_id'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('examenes')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error al actualizar examen:', error)
    return false
  }

  return true
}

export async function eliminarExamen(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('examenes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar examen:', error)
    return false
  }

  return true
}

export async function asignarPreguntasAExamen(
  examenId: number,
  preguntas: { pregunta_id: number; orden: number; puntos_asignados: number }[]
): Promise<boolean> {
  const { error: deleteError } = await supabase
    .from('examen_preguntas')
    .delete()
    .eq('examen_id', examenId)

  if (deleteError) {
    console.error('Error al eliminar asignaciones anteriores:', deleteError)
    return false
  }

  if (preguntas.length > 0) {
    const { error: insertError } = await supabase
      .from('examen_preguntas')
      .insert(preguntas.map(p => ({ ...p, examen_id: examenId })))

    if (insertError) {
      console.error('Error al asignar preguntas:', insertError)
      return false
    }
  }

  return true
}

export async function obtenerPreguntasExamen(examenId: number): Promise<Pregunta[]> {
  const { data, error } = await supabase
    .from('examen_preguntas')
    .select(`
      pregunta_id,
      puntos_asignados,
      orden,
      banco_preguntas:pregunta_id (*)
    `)
    .eq('examen_id', examenId)
    .order('orden', { ascending: true })

  if (error) {
    console.error('Error al obtener preguntas del examen:', error)
    return []
  }

  const preguntas: Pregunta[] = []
  if (data) {
    for (const item of data) {
      const preguntaData = item.banco_preguntas as any
      if (preguntaData) {
        preguntas.push({
          ...preguntaData,
          puntos: item.puntos_asignados
        })
      }
    }
  }

  return preguntas
}

export async function obtenerEstadisticasExamen(examenId: number) {
  const { data: intentos, error } = await supabase
    .from('intentos_examen')
    .select('*')
    .eq('examen_id', examenId)
    .eq('estado', 'completado')

  if (error) {
    console.error('Error al obtener estadísticas:', error)
    return null
  }

  const totalIntentos = intentos.length
  const promedio = intentos.reduce((acc, i) => acc + (i.calificacion || 0), 0) / (totalIntentos || 1)
  const aprobados = intentos.filter(i => (i.calificacion || 0) >= 60).length

  return {
    total_intentos: totalIntentos,
    promedio: promedio.toFixed(2),
    aprobados,
    reprobados: totalIntentos - aprobados,
    porcentaje_aprobacion: totalIntentos > 0 ? ((aprobados / totalIntentos) * 100).toFixed(1) : 0
  }
}

// ========== FUNCIONES DE ESTADÍSTICAS MEJORADAS ==========
export async function obtenerEstadisticasAvanzadasDocente() {
  const docenteId = getDocenteId()
  if (!docenteId) return null

  const { count: totalPreguntas } = await supabase
    .from('banco_preguntas')
    .select('id', { count: 'exact', head: true })
    .eq('docente_id', docenteId)

  const { count: totalExamenes } = await supabase
    .from('examenes')
    .select('id', { count: 'exact', head: true })
    .eq('docente_id', docenteId)

  const { data: materialesIds } = await supabase
    .from('materiales')
    .select('id')
    .eq('docente_id', docenteId)

  let totalDescargas = 0
  if (materialesIds && materialesIds.length > 0) {
    const { count } = await supabase
      .from('log_descargas')
      .select('id', { count: 'exact', head: true })
      .in('material_id', materialesIds.map(m => m.id))
    
    totalDescargas = count || 0
  }

  return {
    total_preguntas: totalPreguntas || 0,
    total_examenes: totalExamenes || 0,
    total_descargas: totalDescargas || 0
  }
}