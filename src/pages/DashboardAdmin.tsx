import './DashboardAdmin.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { logout, getSesion } from '../lib/auth'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Usuario {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  email: string
  matricula?: string
  clave?: string
  rol: string
  created_at: string
}

interface EstadisticasGlobales {
  total_alumnos: number
  total_docentes: number
  total_grupos: number
  total_materiales: number
  total_examenes: number
  total_preguntas: number
  total_intentos: number
}

interface ReporteFiltros {
  fecha_inicio: string
  fecha_fin: string
  tipo_reporte: 'materiales' | 'examenes' | 'usuarios' | 'actividad'
}

interface Backup {
  id: number
  fecha: string
  tipo: string
  registros: number
  estado: string
  admin_nombre: string
}

export default function DashboardAdmin() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('inicio')
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState<EstadisticasGlobales>({
    total_alumnos: 0,
    total_docentes: 0,
    total_grupos: 0,
    total_materiales: 0,
    total_examenes: 0,
    total_preguntas: 0,
    total_intentos: 0
  })
  
  const [alumnos, setAlumnos] = useState<Usuario[]>([])
  const [docentes, setDocentes] = useState<Usuario[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'alumno' | 'docente'>('alumno')
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    matricula: '',
    clave: ''
  })
  
  const [showReporteModal, setShowReporteModal] = useState(false)
  const [reporteFiltros, setReporteFiltros] = useState<ReporteFiltros>({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_reporte: 'materiales'
  })
  const [generandoReporte, setGenerandoReporte] = useState(false)

  // Estados para respaldos
  const [backups, setBackups] = useState<Backup[]>([])
  const [creandoBackup, setCreandoBackup] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [backupSeleccionado, setBackupSeleccionado] = useState<number | null>(null)
  const [restaurando, setRestaurando] = useState(false)

  const [adminInfo, setAdminInfo] = useState<{ id: number; nombre: string; apellidoPaterno: string; apellidoMaterno?: string } | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
    cargarBackups()
  }, [])

// En DashboardAdmin.tsx, modifica este useEffect:

useEffect(() => {
  const cargarInfoAdmin = async () => {
    const sesion = getSesion()
    if (sesion && sesion.rol === 'admin') {
      // CORREGIDO: usar los nombres correctos de columnas
      const { data: adminData, error } = await supabase
        .from('administradores')
        .select('id, nombre, apellidopaterno, apellidomaterno')  // 👈 minúsculas
        .eq('clave_empleado', sesion.clave_empleado)
        .single()
      
      if (error) {
        console.error('Error al cargar admin:', error)
        // Fallback: usar datos de la sesión
        const nombrePartes = sesion.nombre.split(' ')
        setAdminInfo({
          id: sesion.id,
          nombre: nombrePartes[0] || '',
          apellidoPaterno: nombrePartes[1] || '',
          apellidoMaterno: nombrePartes[2] || ''
        })
      } else if (adminData) {
        setAdminInfo({
          id: adminData.id,
          nombre: adminData.nombre,
          apellidoPaterno: adminData.apellidopaterno,  // 👈 minúscula
          apellidoMaterno: adminData.apellidomaterno   // 👈 minúscula
        })
      }
    }
  }
  
  cargarInfoAdmin()
}, [])

  // Función para obtener iniciales
  const getInitials = () => {
    if (!adminInfo) return 'AD'
    
    const primeraLetra = adminInfo.nombre ? adminInfo.nombre.charAt(0).toUpperCase() : ''
    const segundaLetra = adminInfo.apellidoPaterno ? adminInfo.apellidoPaterno.charAt(0).toUpperCase() : ''
    
    return `${primeraLetra}${segundaLetra}`
  }

  // Función para obtener nombre completo
  const getNombreCompleto = () => {
    if (!adminInfo) return 'Administrador'
    
    const nombreCompleto = `${adminInfo.nombre} ${adminInfo.apellidoPaterno}`
    return nombreCompleto.trim()
  }

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([
        cargarEstadisticas(),
        cargarAlumnos(),
        cargarDocentes()
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

const cargarBackups = async () => {
  try {
    const sesion = getSesion()
    if (!sesion || sesion.rol !== 'admin') {
      console.error('No hay sesión de admin')
      return
    }
    
    console.log('Cargando backups con admin_id:', sesion.id)
    
    const { data, error } = await supabase
      .rpc('obtener_backups', {
        p_admin_id: sesion.id,  // Usar ID de la sesión
        p_limite: 50
      })
    
    if (error) {
      console.error('Error en RPC obtener_backups:', error)
      return
    }
    
    console.log('Backups cargados:', data)
    setBackups(data || [])
  } catch (error) {
    console.error('Error al cargar backups:', error)
  }
}

  const crearBackup = async () => {
    if (!adminInfo) {
      alert('No se pudo identificar al administrador')
      return
    }

    setCreandoBackup(true)
    try {
      const { data, error } = await supabase
        .rpc('realizar_backup_completo', {
          p_admin_id: adminInfo.id,
          p_tipo_backup: 'manual'
        })
      
      if (error) throw error
      
      if (data && data.success) {
        alert(`Backup creado exitosamente! ID: ${data.backup_id}`)
        await cargarBackups()
      } else {
      }
    } catch (error: any) {
      console.error('Error al crear backup:', error)
      alert(`Error al crear backup: ${error.message}`)
    } finally {
      setCreandoBackup(false)
    }
  }

  const restaurarBackup = async () => {
    if (!adminInfo || !backupSeleccionado) {
      alert('Seleccione un backup para restaurar')
      return
    }

    if (!confirm('⚠️ ADVERTENCIA: Esta acción sobrescribirá TODOS los datos actuales con la versión del backup seleccionado. ¿Está ABSOLUTAMENTE SEGURO de continuar?')) {
      return
    }

    setRestaurando(true)
    try {
      const { data, error } = await supabase
        .rpc('restaurar_backup', {
          p_admin_id: adminInfo.id,
          p_backup_id: backupSeleccionado,
          p_tabla_objetivo: null
        })
      
      if (error) throw error
      
      if (data && data.success) {
        alert('Restauración completada exitosamente. Los datos han sido restaurados.')
        setShowRestoreModal(false)
        setBackupSeleccionado(null)
        // Recargar datos del dashboard
        await cargarDatos()
      } else {
        alert(`Error: ${data?.message || 'No se pudo restaurar el backup'}`)
      }
    } catch (error: any) {
      console.error('Error al restaurar backup:', error)
      alert(`Error al restaurar backup: ${error.message}`)
    } finally {
      setRestaurando(false)
    }
  }

  const cargarEstadisticas = async () => {
    // Total alumnos
    const { count: totalAlumnos } = await supabase
      .from('Alumnos')
      .select('id', { count: 'exact', head: true })

    // Total docentes
    const { count: totalDocentes } = await supabase
      .from('Docentes')
      .select('id', { count: 'exact', head: true })

    // Total grupos
    const { count: totalGrupos } = await supabase
      .from('grupos')
      .select('id', { count: 'exact', head: true })

    // Total materiales
    const { count: totalMateriales } = await supabase
      .from('materiales')
      .select('id', { count: 'exact', head: true })

    // Total examenes
    const { count: totalExamenes } = await supabase
      .from('examenes')
      .select('id', { count: 'exact', head: true })

    // Total preguntas
    const { count: totalPreguntas } = await supabase
      .from('banco_preguntas')
      .select('id', { count: 'exact', head: true })

    // Total intentos
    const { count: totalIntentos } = await supabase
      .from('intentos_examen')
      .select('id', { count: 'exact', head: true })

    setEstadisticas({
      total_alumnos: totalAlumnos || 0,
      total_docentes: totalDocentes || 0,
      total_grupos: totalGrupos || 0,
      total_materiales: totalMateriales || 0,
      total_examenes: totalExamenes || 0,
      total_preguntas: totalPreguntas || 0,
      total_intentos: totalIntentos || 0
    })
  }

  const cargarAlumnos = async () => {
    const { data, error } = await supabase
      .from('Alumnos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAlumnos(data)
    }
  }

  const cargarDocentes = async () => {
    const { data, error } = await supabase
      .from('Docentes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDocentes(data)
    }
  }

  const crearUsuario = async () => {
    if (!formData.nombre || !formData.apellidoPaterno || !formData.email) {
      alert('Por favor complete los campos requeridos')
      return
    }

    const table = modalType === 'alumno' ? 'Alumnos' : 'Docentes'
    const idField = modalType === 'alumno' ? 'matricula' : 'clave'
    const idValue = modalType === 'alumno' ? formData.matricula : formData.clave
    
    // La contraseña es la misma que la matrícula o clave
    const contrasena = idValue

    const nuevoUsuario = {
      nombre: formData.nombre,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      email: formData.email,
      [idField]: idValue,
      contrasena: contrasena,
      rol: modalType === 'alumno' ? 'alumno' : 'docente'
    }

    const { error } = await supabase
      .from(table)
      .insert([nuevoUsuario])

    if (error) {
      console.error('Error al crear usuario:', error)
      alert(`Error al crear ${modalType}: ${error.message}`)
    } else {
      alert(`${modalType === 'alumno' ? 'Alumno' : 'Docente'} creado exitosamente. Contraseña: ${contrasena}`)
      setShowModal(false)
      setFormData({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        email: '',
        matricula: '',
        clave: ''
      })
      if (modalType === 'alumno') {
        cargarAlumnos()
      } else {
        cargarDocentes()
      }
      cargarEstadisticas()
    }
  }

  const eliminarUsuario = async (id: number, tipo: 'alumno' | 'docente') => {
    if (!confirm(`¿Está seguro de eliminar este ${tipo}?`)) return

    const table = tipo === 'alumno' ? 'Alumnos' : 'Docentes'
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error al eliminar usuario:', error)
      alert(`Error al eliminar: ${error.message}`)
    } else {
      alert(`${tipo === 'alumno' ? 'Alumno' : 'Docente'} eliminado exitosamente`)
      if (tipo === 'alumno') {
        cargarAlumnos()
      } else {
        cargarDocentes()
      }
      cargarEstadisticas()
    }
  }

  const generarReporte = async () => {
    setGenerandoReporte(true)
    try {
      let datos: any[] = []
      let nombreArchivo = ''
      let columnas: string[] = []

      switch (reporteFiltros.tipo_reporte) {
        case 'materiales':
          let queryMateriales = supabase
            .from('materiales')
            .select(`
              *,
              Docentes (nombre, apellidoPaterno),
              grupos (nombre)
            `)
          
          if (reporteFiltros.fecha_inicio) {
            queryMateriales = queryMateriales.gte('created_at', reporteFiltros.fecha_inicio)
          }
          if (reporteFiltros.fecha_fin) {
            queryMateriales = queryMateriales.lte('created_at', reporteFiltros.fecha_fin)
          }

          const { data: materiales } = await queryMateriales
          datos = materiales || []
          columnas = ['ID', 'Título', 'Tipo', 'Grupo', 'Docente', 'Descargas', 'Fecha Creación']
          nombreArchivo = `reporte_materiales_${new Date().toISOString().split('T')[0]}`
          break

        case 'examenes':
          let queryExamenes = supabase
            .from('examenes')
            .select(`
              *,
              Docentes (nombre, apellidoPaterno),
              grupos (nombre)
            `)
          
          if (reporteFiltros.fecha_inicio) {
            queryExamenes = queryExamenes.gte('created_at', reporteFiltros.fecha_inicio)
          }
          if (reporteFiltros.fecha_fin) {
            queryExamenes = queryExamenes.lte('created_at', reporteFiltros.fecha_fin)
          }

          const { data: examenes } = await queryExamenes
          datos = examenes || []
          columnas = ['ID', 'Título', 'Grupo', 'Docente', 'Tiempo Límite', 'Intentos Permitidos', 'Fecha Creación']
          nombreArchivo = `reporte_examenes_${new Date().toISOString().split('T')[0]}`
          break

        case 'usuarios':
          const { data: alumnosData } = await supabase
            .from('Alumnos')
            .select('*')
          const { data: docentesData } = await supabase
            .from('Docentes')
            .select('*')
          
          datos = [
            ...(alumnosData || []).map(a => ({ ...a, rol: 'Alumno' })),
            ...(docentesData || []).map(d => ({ ...d, rol: 'Docente' }))
          ]
          columnas = ['ID', 'Nombre', 'Apellido Paterno', 'Apellido Materno', 'Email', 'Rol', 'Fecha Registro']
          nombreArchivo = `reporte_usuarios_${new Date().toISOString().split('T')[0]}`
          break

        case 'actividad':
          let queryIntentos = supabase
            .from('intentos_examen')
            .select(`
              *,
              Alumnos (nombre, apellidoPaterno, email),
              examenes (titulo)
            `)
          
          if (reporteFiltros.fecha_inicio) {
            queryIntentos = queryIntentos.gte('fecha_inicio', reporteFiltros.fecha_inicio)
          }
          if (reporteFiltros.fecha_fin) {
            queryIntentos = queryIntentos.lte('fecha_inicio', reporteFiltros.fecha_fin)
          }

          const { data: intentos } = await queryIntentos
          datos = intentos || []
          columnas = ['ID', 'Alumno', 'Examen', 'Calificación', 'Fecha Inicio', 'Fecha Entrega', 'Estado']
          nombreArchivo = `reporte_actividad_${new Date().toISOString().split('T')[0]}`
          break
      }

      // Generar Excel
      const wsData = [columnas]
      datos.forEach(item => {
        const row = columnas.map(col => {
          switch (col) {
            case 'ID': return item.id
            case 'Título': return item.titulo
            case 'Tipo': return item.tipo
            case 'Grupo': return item.grupos?.nombre || 'N/A'
            case 'Docente': return item.Docentes ? `${item.Docentes.nombre} ${item.Docentes.apellidoPaterno}` : 'N/A'
            case 'Descargas': return item.descargas || 0
            case 'Nombre': return item.nombre
            case 'Apellido Paterno': return item.apellidoPaterno
            case 'Apellido Materno': return item.apellidoMaterno || ''
            case 'Email': return item.email
            case 'Rol': return item.rol
            case 'Tiempo Límite': return `${item.tiempo_limite || 0} min`
            case 'Intentos Permitidos': return item.intentos_permitidos
            case 'Alumno': return item.Alumnos ? `${item.Alumnos.nombre} ${item.Alumnos.apellidoPaterno}` : 'N/A'
            case 'Examen': return item.examenes?.titulo || 'N/A'
            case 'Calificación': return item.calificacion || 'Pendiente'
            case 'Fecha Inicio': return new Date(item.fecha_inicio).toLocaleString()
            case 'Fecha Entrega': return item.fecha_entrega ? new Date(item.fecha_entrega).toLocaleString() : 'No entregado'
            case 'Estado': return item.estado
            default: return ''
          }
        })
        wsData.push(row)
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
      XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)

      setShowReporteModal(false)
      alert('Reporte generado exitosamente')
    } catch (error) {
      console.error('Error al generar reporte:', error)
      alert('Error al generar el reporte')
    } finally {
      setGenerandoReporte(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">Cargando panel de administración...</div>
      </div>
    )
  }

  return (
    <div className="dashboard admin-dashboard">
      {/* SIDEBAR */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sb-top">
          <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
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
            <span className="sb-logo-name">Admin<span>UTN</span></span>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">{getInitials()}</div>
          <div className="sb-info">
            <div className="sb-uname">{getNombreCompleto()}</div>
            <div className="sb-uid">Administrador</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>
          
          <div className={`nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => setActiveTab('inicio')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Dashboard</span>
          </div>

          <div className={`nav-item ${activeTab === 'alumnos' ? 'active' : ''}`} onClick={() => setActiveTab('alumnos')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <span className="nav-label">Alumnos</span>
          </div>

          <div className={`nav-item ${activeTab === 'docentes' ? 'active' : ''}`} onClick={() => setActiveTab('docentes')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span className="nav-label">Docentes</span>
          </div>

          <p className="sb-section">Seguridad</p>
          
          <div className={`nav-item ${activeTab === 'respaldos' ? 'active' : ''}`} onClick={() => setActiveTab('respaldos')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M19 11H5M5 11L9 15M5 11L9 7"/>
              <path d="M5 5h14v14H5z"/>
            </svg>
            <span className="nav-label">Respaldo de Datos</span>
          </div>

          <p className="sb-section">Reportes</p>
          
          <div className={`nav-item ${activeTab === 'reportes' ? 'active' : ''}`} onClick={() => setActiveTab('reportes')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M21 12v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3"/>
              <path d="M12 2v10m0 0l-3-3m3 3l3-3"/>
              <path d="M3 2h18"/>
            </svg>
            <span className="nav-label">Reportes</span>
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="main">
        <header className="topbar">
          <h1 className="topbar-title">Panel de Administración</h1>
        </header>

        <div className="content">
          {activeTab === 'inicio' && (
            <>
              {/* Tarjetas de estadísticas */}
              <div className="stats-grid">
                <div className="stat-card-admin">
                  <div className="stat-icon">👨‍🎓</div>
                  <div>
                    <p className="stat-value">{estadisticas.total_alumnos}</p>
                    <p className="stat-label">Alumnos</p>
                  </div>
                </div>
                <div className="stat-card-admin">
                  <div className="stat-icon">👨‍🏫</div>
                  <div>
                    <p className="stat-value">{estadisticas.total_docentes}</p>
                    <p className="stat-label">Docentes</p>
                  </div>
                </div>

                <div className="stat-card-admin">
                  <div className="stat-icon">📄</div>
                  <div>
                    <p className="stat-value">{estadisticas.total_materiales}</p>
                    <p className="stat-label">Materiales</p>
                  </div>
                </div>
                <div className="stat-card-admin">
                  <div className="stat-icon">📝</div>
                  <div>
                    <p className="stat-value">{estadisticas.total_examenes}</p>
                    <p className="stat-label">Exámenes</p>
                  </div>
                </div>
                <div className="stat-card-admin">
                  <div className="stat-icon">❓</div>
                  <div>
                    <p className="stat-value">{estadisticas.total_preguntas}</p>
                    <p className="stat-label">Preguntas</p>
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="quick-actions">
                <h3>Acciones Rápidas</h3>
                <div className="actions-grid">
                  <button className="action-btn" onClick={() => {
                    setModalType('alumno')
                    setShowModal(true)
                  }}>
                    <span className="action-icon">➕</span>
                    Registrar Alumno
                  </button>
                  <button className="action-btn" onClick={() => {
                    setModalType('docente')
                    setShowModal(true)
                  }}>
                    <span className="action-icon">➕</span>
                    Registrar Docente
                  </button>
                  <button className="action-btn" onClick={() => {
                    setActiveTab('reportes')
                    setShowReporteModal(true)
                  }}>
                    <span className="action-icon">📊</span>
                    Generar Reporte
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'alumnos' && (
            <div className="usuarios-section">
              <div className="section-header">
                <h2>Gestión de Alumnos</h2>
                <button className="btn-primary" onClick={() => {
                  setModalType('alumno')
                  setShowModal(true)
                }}>
                  + Nuevo Alumno
                </button>
              </div>
              
              <div className="usuarios-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellidos</th>
                      <th>Matrícula</th>
                      <th>Email</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map(alumno => (
                      <tr key={alumno.id}>
                        <td>{alumno.nombre}</td>
                        <td>{alumno.apellidoPaterno} {alumno.apellidoMaterno}</td>
                        <td>{alumno.matricula}</td>
                        <td>{alumno.email}</td>
                        <td>
                          <button 
                            className="btn-danger-small"
                            onClick={() => eliminarUsuario(alumno.id, 'alumno')}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'docentes' && (
            <div className="usuarios-section">
              <div className="section-header">
                <h2>Gestión de Docentes</h2>
                <button className="btn-primary" onClick={() => {
                  setModalType('docente')
                  setShowModal(true)
                }}>
                  + Nuevo Docente
                </button>
              </div>
              
              <div className="usuarios-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellidos</th>
                      <th>Clave</th>
                      <th>Email</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docentes.map(docente => (
                      <tr key={docente.id}>
                        <td>{docente.nombre}</td>
                        <td>{docente.apellidoPaterno} {docente.apellidoMaterno}</td>
                        <td>{docente.clave}</td>
                        <td>{docente.email}</td>
                        <td>
                          <button 
                            className="btn-danger-small"
                            onClick={() => eliminarUsuario(docente.id, 'docente')}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'respaldos' && (
            <div className="respaldos-section">
              <div className="section-header">
                <h2>Respaldo de Datos</h2>
                <button 
                  className="btn-primary" 
                  onClick={crearBackup}
                  disabled={creandoBackup}
                >
                  {creandoBackup ? 'Creando Backup...' : '💾 Crear Backup Manual'}
                </button>
              </div>

              <div className="backups-list">
                <h3>Historial de Respaldos</h3>
                {backups.length === 0 ? (
                  <div className="no-backups">
                    <p>No hay respaldos registrados aún.</p>
                    <p>Presione el botón "Crear Backup Manual" para generar su primer respaldo.</p>
                  </div>
                ) : (
                  <div className="backups-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Registros</th>
                          <th>Estado</th>
                          <th>Administrador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map(backup => (
                          <tr key={backup.id} className={backup.estado === 'fallido' ? 'backup-failed' : ''}>
                            <td>{new Date(backup.fecha).toLocaleString()}</td>
                            <td>
                              <span className={`backup-tipo ${backup.tipo}`}>
                                {backup.tipo === 'manual' ? 'Manual' : 'Automático'}
                              </span>
                            </td>
                            <td>{backup.registros?.toLocaleString() || 0}</td>
                            <td>
                              <span className={`backup-estado ${backup.estado}`}>
                                {backup.estado === 'completado' ? '✓ Completado' : 
                                 backup.estado === 'en_proceso' ? '⏳ En proceso' : '✗ Fallido'}
                              </span>
                            </td>
                            <td>{backup.admin_nombre || 'Sistema'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reportes' && (
            <div className="reportes-section">
              <h2>Generador de Reportes</h2>
              <p className="reportes-desc">
                Genere reportes detallados sobre materiales, exámenes, usuarios y actividad del sistema.
              </p>
              
              <div className="reportes-grid">
                <div className="reporte-card" onClick={() => {
                  setReporteFiltros({ ...reporteFiltros, tipo_reporte: 'materiales' })
                  setShowReporteModal(true)
                }}>
                  <div className="reporte-icon">📄</div>
                  <h3>Materiales Subidos</h3>
                  <p>Reporte de todos los materiales educativos subidos por los docentes</p>
                </div>
                
                <div className="reporte-card" onClick={() => {
                  setReporteFiltros({ ...reporteFiltros, tipo_reporte: 'examenes' })
                  setShowReporteModal(true)
                }}>
                  <div className="reporte-icon">📝</div>
                  <h3>Exámenes Creados</h3>
                  <p>Reporte de todos los exámenes creados por los docentes</p>
                </div>
                
                <div className="reporte-card" onClick={() => {
                  setReporteFiltros({ ...reporteFiltros, tipo_reporte: 'usuarios' })
                  setShowReporteModal(true)
                }}>
                  <div className="reporte-icon">👥</div>
                  <h3>Usuarios del Sistema</h3>
                  <p>Reporte de todos los alumnos y docentes registrados</p>
                </div>
                
                <div className="reporte-card" onClick={() => {
                  setReporteFiltros({ ...reporteFiltros, tipo_reporte: 'actividad' })
                  setShowReporteModal(true)
                }}>
                  <div className="reporte-icon">📊</div>
                  <h3>Actividad de Exámenes</h3>
                  <p>Reporte de intentos y calificaciones de los alumnos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal para crear usuario */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Registrar {modalType === 'alumno' ? 'Alumno' : 'Docente'}</h3>
            
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            
            <div className="form-group">
              <label>Apellido Paterno *</label>
              <input
                type="text"
                value={formData.apellidoPaterno}
                onChange={e => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                placeholder="Apellido Paterno"
              />
            </div>
            
            <div className="form-group">
              <label>Apellido Materno</label>
              <input
                type="text"
                value={formData.apellidoMaterno}
                onChange={e => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                placeholder="Apellido Materno"
              />
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            
            {modalType === 'alumno' ? (
              <div className="form-group">
                <label>Matrícula *</label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="Matrícula"
                />
                <small>La contraseña será la misma que la matrícula</small>
              </div>
            ) : (
              <div className="form-group">
                <label>Clave *</label>
                <input
                  type="text"
                  value={formData.clave}
                  onChange={e => setFormData({ ...formData, clave: e.target.value })}
                  placeholder="Clave"
                />
                <small>La contraseña será la misma que la clave</small>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={crearUsuario}>
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para generar reporte */}
      {showReporteModal && (
        <div className="modal-overlay" onClick={() => setShowReporteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Generar Reporte</h3>
            
            <div className="form-group">
              <label>Tipo de Reporte</label>
              <select
                value={reporteFiltros.tipo_reporte}
                onChange={e => setReporteFiltros({ 
                  ...reporteFiltros, 
                  tipo_reporte: e.target.value as any 
                })}
              >
                <option value="materiales">Materiales Subidos</option>
                <option value="examenes">Exámenes Creados</option>
                <option value="usuarios">Usuarios del Sistema</option>
                <option value="actividad">Actividad de Exámenes</option>
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Fecha Inicio</label>
                <input
                  type="date"
                  value={reporteFiltros.fecha_inicio}
                  onChange={e => setReporteFiltros({ 
                    ...reporteFiltros, 
                    fecha_inicio: e.target.value 
                  })}
                />
              </div>
              
              <div className="form-group">
                <label>Fecha Fin</label>
                <input
                  type="date"
                  value={reporteFiltros.fecha_fin}
                  onChange={e => setReporteFiltros({ 
                    ...reporteFiltros, 
                    fecha_fin: e.target.value 
                  })}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowReporteModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={generarReporte} disabled={generandoReporte}>
                {generandoReporte ? 'Generando...' : 'Generar Reporte (Excel)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para restaurar backup */}
      {showRestoreModal && (
        <div className="modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Restaurar Backup</h3>
            
            <div className="restore-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <p><strong>Esta acción es irreversible y sobrescribirá todos los datos actuales.</strong></p>
                <p>Al restaurar el backup #{backupSeleccionado}, se perderán todos los cambios realizados después de la fecha del backup.</p>
                <p>Se recomienda crear un backup manual antes de continuar.</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Confirmación</label>
              <input
                type="text"
                placeholder='Escriba "CONFIRMAR" para continuar'
                onChange={(e) => {
                  if (e.target.value !== 'CONFIRMAR') {
                    // Deshabilitar el botón si no escribe CONFIRMAR
                  }
                }}
                id="confirmacion-restore"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => {
                setShowRestoreModal(false)
                setBackupSeleccionado(null)
              }}>
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                onClick={() => {
                  const confirmInput = document.getElementById('confirmacion-restore') as HTMLInputElement
                  if (confirmInput && confirmInput.value === 'CONFIRMAR') {
                    restaurarBackup()
                  } else {
                    alert('Debe escribir "CONFIRMAR" para proceder con la restauración')
                  }
                }}
                disabled={restaurando}
              >
                {restaurando ? 'Restaurando...' : 'Confirmar Restauración'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}