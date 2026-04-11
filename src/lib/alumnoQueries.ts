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
  
  // Transformar los datos
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
  
  // Obtener grupos del alumno
  const materias = await obtenerMateriasAlumno()
  const gruposIds = materias.map(m => m.grupo_id)
  
  // Contar materiales nuevos (últimos 7 días) en sus grupos
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

// Obtener avisos recientes (materiales nuevos en sus grupos)
export async function obtenerAvisosRecientes(limite: number = 5): Promise<AvisoReciente[]> {
  const alumnoId = getAlumnoId()
  
  if (!alumnoId) return []
  
  // Obtener grupos del alumno
  const materias = await obtenerMateriasAlumno()
  const gruposIds = materias.map(m => m.grupo_id)
  
  if (gruposIds.length === 0) return []
  
  // Obtener materiales recientes de esos grupos
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
  
  // Transformar datos
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

// Función para formatear el tiempo relativo (hace X horas/días)
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