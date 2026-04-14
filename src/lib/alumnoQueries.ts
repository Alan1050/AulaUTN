import { supabase } from './supabaseClient'
import { getSesion } from './auth'

export interface GrupoAlumno {
  id: number
  nombre: string
  materia: string
  cuatrimestre: string
  codigo_grupo: string
}

export interface MateriaAlumno {
  id: number
  nombre: string
  materia: string
  cuatrimestre: string
  grupo_id: number
  codigo_grupo: string
}

export interface EstadisticasAlumno {
  materias_activas: number
  material_nuevo: number
}

export interface AvisoReciente {
  id: number
  titulo: string
  descripcion: string
  tipo: string
  created_at: string
  grupo_id: number
  grupo_nombre: string
  materia_nombre: string
}

export interface MaterialAlumno {
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
  docente_nombre?: string
}

export interface ExamenAlumno {
  id: number
  titulo: string
  descripcion: string
  grupo_id: number
  tiempo_limite: number
  fecha_inicio: string
  fecha_fin: string
  intentos_permitidos: number
  aleatorio: boolean
  mostrar_resultados: boolean
  activo: boolean
  materia_nombre: string
  grupo_nombre: string
  intentos_realizados?: number
  mejor_calificacion?: number
  estado?: 'pendiente' | 'en_curso' | 'completado' | 'no_disponible'
}

export interface IntentoAlumno {
  id: number
  examen_id: number
  fecha_inicio: string
  fecha_entrega: string
  calificacion: number
  intento_numero: number
  estado: 'en_curso' | 'completado' | 'cancelado'
}

export interface ResultadoPregunta {
  pregunta_id: number
  pregunta: string
  respuesta_alumno: string
  respuesta_correcta: string
  es_correcta: boolean
  puntos_obtenidos: number
  puntos_posibles: number
}

// Obtener el ID del alumno actual
export function getAlumnoId(): number | null {
  const sesion = getSesion()
  return sesion?.id || null
}

// Obtener información del alumno
export async function obtenerInfoAlumno() {
  const alumnoId = getAlumnoId()
  
  if (!alumnoId) return null
  
  const { data, error } = await supabase
    .from('Alumnos')
    .select('id, nombre, apellidoPaterno, apellidoMaterno, matricula, email')
    .eq('id', alumnoId)
    .single()
  
  if (error) {
    console.error('Error al obtener info del alumno:', error)
    return null
  }
  
  return data
}

// Obtener grupos/materias del alumno
export async function obtenerMateriasAlumno(): Promise<MateriaAlumno[]> {
  const alumnoId = getAlumnoId()
  
  if (!alumnoId) {
    console.error('No se encontró ID del alumno')
    return []
  }
  
  const { data, error } = await supabase
    .from('alumnogrupo')
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
    .eq('alumno_id', alumnoId)
  
  if (error) {
    console.error('Error al obtener materias del alumno:', error)
    return []
  }
  
  const materias: MateriaAlumno[] = []
  
  if (data) {
    for (const item of data) {
      const gruposData = item.grupos as any
      if (gruposData && !Array.isArray(gruposData)) {
        materias.push({
          id: gruposData.id,
          nombre: gruposData.nombre || '',
          materia: gruposData.materia || '',
          cuatrimestre: gruposData.cuatrimestre || '',
          grupo_id: gruposData.id,
          codigo_grupo: gruposData.codigo_grupo || ''
        })
      }
    }
  }
  
  return materias
}

// Obtener estadísticas del alumno
export async function obtenerEstadisticasAlumno(): Promise<EstadisticasAlumno> {
  const alumnoId = getAlumnoId()
  
  if (!alumnoId) {
    return { materias_activas: 0, material_nuevo: 0 }
  }
  
  const materias = await obtenerMateriasAlumno()
  const gruposIds = materias.map(m => m.grupo_id)
  
  let materialNuevo = 0
  if (gruposIds.length > 0) {
    const unaSemanaAtras = new Date()
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7)
    
    const { count, error: materialesError } = await supabase
      .from('materiales')
      .select('id', { count: 'exact', head: true })
      .in('grupo_id', gruposIds)
      .gte('created_at', unaSemanaAtras.toISOString())
    
    if (!materialesError && count) {
      materialNuevo = count
    }
  }
  
  return {
    materias_activas: materias.length,
    material_nuevo: materialNuevo
  }
}

// Obtener avisos recientes
export async function obtenerAvisosRecientes(limite: number = 5): Promise<AvisoReciente[]> {
  const alumnoId = getAlumnoId()
  
  if (!alumnoId) return []
  
  const materias = await obtenerMateriasAlumno()
  const gruposIds = materias.map(m => m.grupo_id)
  
  if (gruposIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('materiales')
    .select(`
      id,
      titulo,
      descripcion,
      tipo,
      created_at,
      grupo_id,
      grupos:grupo_id (
        nombre,
        materia
      )
    `)
    .in('grupo_id', gruposIds)
    .order('created_at', { ascending: false })
    .limit(limite)
  
  if (error) {
    console.error('Error al obtener avisos recientes:', error)
    return []
  }
  
  const avisos: AvisoReciente[] = []
  
  if (data) {
    for (const item of data) {
      const grupoData = item.grupos as any
      avisos.push({
        id: item.id,
        titulo: item.titulo,
        descripcion: item.descripcion || '',
        tipo: item.tipo || 'archivo',
        created_at: item.created_at,
        grupo_id: item.grupo_id,
        grupo_nombre: grupoData?.nombre || '',
        materia_nombre: grupoData?.materia || ''
      })
    }
  }
  
  return avisos
}

// Función para formatear el tiempo relativo
export function formatTiempoRelativo(fecha: string): string {
  const ahora = new Date()
  const fechaDate = new Date(fecha)
  const diffMs = ahora.getTime() - fechaDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Hace unos segundos'
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  
  return fechaDate.toLocaleDateString()
}

// ========== FUNCIONES PARA RECURSOS/MATERIALES ==========
export async function obtenerMaterialesPorGrupo(grupoId: number): Promise<MaterialAlumno[]> {
  const { data, error } = await supabase
    .from('materiales')
    .select(`
      *,
      Docentes!materiales_docente_id_fkey (
        nombre,
        apellidoPaterno
      )
    `)
    .eq('grupo_id', grupoId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener materiales:', error)
    return []
  }

  const materiales = data.map(item => ({
    ...item,
    docente_nombre: item.Docentes ? `${item.Docentes.nombre} ${item.Docentes.apellidoPaterno}` : 'Docente'
  }))

  return materiales || []
}

export async function descargarMaterial(materialId: number, materialPath: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('materiales')
      .createSignedUrl(materialPath, 60)

    if (error) throw error

    const alumnoId = getAlumnoId()
    if (alumnoId) {
      await supabase.from('log_descargas').insert([{
        material_id: materialId,
        usuario_id: alumnoId,
        usuario_rol: 'alumno',
        ip_address: 'client-side'
      }])
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
      return true
    }

    return false
  } catch (error) {
    console.error('Error al descargar material:', error)
    return false
  }
}

// ========== FUNCIONES PARA EXÁMENES ==========
export async function obtenerExamenesAlumno(): Promise<ExamenAlumno[]> {
  const alumnoId = getAlumnoId()
  if (!alumnoId) return []

  const materias = await obtenerMateriasAlumno()
  const gruposIds = materias.map(m => m.grupo_id)

  if (gruposIds.length === 0) return []

  const { data, error } = await supabase
    .from('examenes')
    .select(`
      *,
      grupos!inner (
        nombre,
        materia
      )
    `)
    .in('grupo_id', gruposIds)
    .eq('activo', true)
    .order('fecha_fin', { ascending: true })

  if (error) {
    console.error('Error al obtener exámenes:', error)
    return []
  }

  const examenes: ExamenAlumno[] = []
  
  for (const examen of data) {
    const { data: intentos } = await supabase
      .from('intentos_examen')
      .select('*')
      .eq('examen_id', examen.id)
      .eq('alumno_id', alumnoId)
      .order('calificacion', { ascending: false })

    const intentosRealizados = intentos?.length || 0
    const mejorCalificacion = intentos?.reduce((max, i) => Math.max(max, i.calificacion || 0), 0) || 0
    
    const ahora = new Date()
    const inicio = new Date(examen.fecha_inicio)
    const fin = new Date(examen.fecha_fin)
    let estado: ExamenAlumno['estado'] = 'no_disponible'
    
    if (ahora < inicio) {
      estado = 'pendiente'
    } else if (ahora > fin) {
      estado = 'completado'
    } else if (intentosRealizados >= examen.intentos_permitidos) {
      estado = 'completado'
    } else {
      estado = 'en_curso'
    }

    examenes.push({
      ...examen,
      materia_nombre: examen.grupos.materia,
      grupo_nombre: examen.grupos.nombre,
      intentos_realizados: intentosRealizados,
      mejor_calificacion: mejorCalificacion,
      estado
    })
  }

  return examenes
}

export async function obtenerExamenParaTomar(examenId: number): Promise<{
  examen: ExamenAlumno;
  preguntas: any[];
} | null> {
  const alumnoId = getAlumnoId()
  if (!alumnoId) return null

  const { data: examen, error: examenError } = await supabase
    .from('examenes')
    .select(`
      *,
      grupos!inner (
        nombre,
        materia
      )
    `)
    .eq('id', examenId)
    .single()

  if (examenError || !examen) {
    console.error('Error al obtener examen:', examenError)
    return null
  }

  const { data: intentos } = await supabase
    .from('intentos_examen')
    .select('*')
    .eq('examen_id', examenId)
    .eq('alumno_id', alumnoId)

  if (intentos && intentos.length >= examen.intentos_permitidos) {
    throw new Error('Has alcanzado el número máximo de intentos')
  }

  const { data: preguntasData, error: preguntasError } = await supabase
    .from('examen_preguntas')
    .select(`
      orden,
      puntos_asignados,
      banco_preguntas:pregunta_id (*)
    `)
    .eq('examen_id', examenId)
    .order('orden', { ascending: true })

  if (preguntasError) {
    console.error('Error al obtener preguntas:', preguntasError)
    return null
  }

  // ✅ CORREGIDO: Verificar que preguntasData no sea null
  if (!preguntasData || preguntasData.length === 0) {
    console.error('El examen no tiene preguntas asignadas')
    return null
  }

  let preguntasArray = [...preguntasData]

  if (examen.aleatorio) {
    preguntasArray = preguntasArray.sort(() => Math.random() - 0.5)
  }

  const preguntasFormateadas = preguntasArray.map(item => {
    const pregunta = item.banco_preguntas as any
    return {
      id: pregunta.id,
      pregunta: pregunta.pregunta,
      tipo: pregunta.tipo,
      opciones: pregunta.opciones,
      puntos: item.puntos_asignados,
      orden: item.orden
    }
  })

  return {
    examen: {
      ...examen,
      materia_nombre: examen.grupos.materia,
      grupo_nombre: examen.grupos.nombre
    },
    preguntas: preguntasFormateadas
  }
}

export async function iniciarIntentoExamen(examenId: number): Promise<number | null> {
  const alumnoId = getAlumnoId()
  if (!alumnoId) return null

  const { count: intentosCount } = await supabase
    .from('intentos_examen')
    .select('id', { count: 'exact', head: true })
    .eq('examen_id', examenId)
    .eq('alumno_id', alumnoId)

  const nuevoIntento = (intentosCount || 0) + 1

  const { data, error } = await supabase
    .from('intentos_examen')
    .insert([{
      alumno_id: alumnoId,
      examen_id: examenId,
      intento_numero: nuevoIntento,
      estado: 'en_curso',
      fecha_inicio: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error al iniciar intento:', error)
    return null
  }

  return data.id
}

export async function guardarRespuesta(
  intentoId: number,
  preguntaId: number,
  respuesta: string,
  esCorrecta: boolean,
  puntosObtenidos: number
): Promise<boolean> {
  const { error } = await supabase
    .from('respuestas_alumno')
    .insert([{
      intento_id: intentoId,
      pregunta_id: preguntaId,
      respuesta: respuesta,
      es_correcta: esCorrecta,
      puntos_obtenidos: puntosObtenidos
    }])

  if (error) {
    console.error('Error al guardar respuesta:', error)
    return false
  }

  return true
}

export async function finalizarExamen(intentoId: number, calificacionTotal: number): Promise<boolean> {
  const { error } = await supabase
    .from('intentos_examen')
    .update({
      estado: 'completado',
      fecha_entrega: new Date().toISOString(),
      calificacion: calificacionTotal
    })
    .eq('id', intentoId)

  if (error) {
    console.error('Error al finalizar examen:', error)
    return false
  }

  return true
}

export async function obtenerResultadosExamen(intentoId: number): Promise<{
  calificacion: number;
  respuestas: ResultadoPregunta[];
  fecha_entrega: string;
} | null> {
  const { data: intento, error: intentoError } = await supabase
    .from('intentos_examen')
    .select('*')
    .eq('id', intentoId)
    .single()

  if (intentoError || !intento) {
    console.error('Error al obtener intento:', intentoError)
    return null
  }

  const { data: respuestas, error: respuestasError } = await supabase
    .from('respuestas_alumno')
    .select(`
      *,
      banco_preguntas!inner (*)
    `)
    .eq('intento_id', intentoId)

  if (respuestasError) {
    console.error('Error al obtener respuestas:', respuestasError)
    return null
  }

  const respuestasFormateadas: ResultadoPregunta[] = respuestas.map(r => {
    const pregunta = r.banco_preguntas as any
    return {
      pregunta_id: r.pregunta_id,
      pregunta: pregunta.pregunta,
      respuesta_alumno: r.respuesta,
      respuesta_correcta: pregunta.respuesta_correcta,
      es_correcta: r.es_correcta,
      puntos_obtenidos: r.puntos_obtenidos,
      puntos_posibles: pregunta.puntos
    }
  })

  return {
    calificacion: intento.calificacion,
    respuestas: respuestasFormateadas,
    fecha_entrega: intento.fecha_entrega
  }
}