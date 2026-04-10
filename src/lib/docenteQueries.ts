import { supabase } from './supabaseClient'
import { getSesion } from './auth'

// Exportar interfaces como tipos
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

// Obtener el ID del docente actual
export function getDocenteId(): number | null {
  const sesion = getSesion()
  return sesion?.id || null
}

// Obtener grupos del docente
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
  
  // Transformar los datos con tipado correcto
  const grupos: GrupoDocente[] = []
  
  if (data) {
    for (const item of data) {
      // Verificar que grupos existe y no es null
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

// Obtener estadísticas del docente
export async function obtenerEstadisticasDocente(): Promise<EstadisticasDocente> {
  const docenteId = getDocenteId()
  
  if (!docenteId) {
    return { grupos_activos: 0, total_alumnos: 0, materiales_subidos: 0 }
  }
  
  // Obtener grupos del docente
  const grupos = await obtenerGruposDocente()
  const gruposIds = grupos.map(g => g.id)
  
  // Contar alumnos en esos grupos
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
  
  // Contar materiales subidos por este docente
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

// Obtener datos completos del docente (nombre, etc.)
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