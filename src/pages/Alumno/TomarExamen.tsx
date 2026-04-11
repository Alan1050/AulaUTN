// pages/Alumno/TomarExamen.tsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  obtenerExamenParaTomar,
  iniciarIntentoExamen,
  guardarRespuesta,
  finalizarExamen
} from '../../lib/alumnoQueries'

interface RespuestaTemp {
  preguntaId: number
  respuesta: string
}

export default function TomarExamen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { examenId, examenTitulo, materiaNombre } = location.state || {}
  
  const [examen, setExamen] = useState<any>(null)
  const [preguntas, setPreguntas] = useState<any[]>([])
  const [respuestas, setRespuestas] = useState<RespuestaTemp[]>([])
  const [intentoId, setIntentoId] = useState<number | null>(null)
  const [tiempoRestante, setTiempoRestante] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (examenId) {
      cargarExamen()
    }
  }, [examenId])

  const cargarExamen = async () => {
    const data = await obtenerExamenParaTomar(examenId)
    if (data) {
      setExamen(data.examen)
      setPreguntas(data.preguntas)
      setTiempoRestante(data.examen.tiempo_limite * 60)
      
      // Iniciar intento
      const nuevoIntentoId = await iniciarIntentoExamen(examenId)
      setIntentoId(nuevoIntentoId)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (tiempoRestante > 0 && !loading) {
      const timer = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleEnviarExamen()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [tiempoRestante, loading])

  const handleRespuestaChange = (preguntaId: number, respuesta: string) => {
    setRespuestas(prev => {
      const existe = prev.find(r => r.preguntaId === preguntaId)
      if (existe) {
        return prev.map(r => r.preguntaId === preguntaId ? { ...r, respuesta } : r)
      }
      return [...prev, { preguntaId, respuesta }]
    })
  }

  const calcularCalificacion = () => {
    let totalPuntos = 0
    let puntosObtenidos = 0

    preguntas.forEach(pregunta => {
      const respuesta = respuestas.find(r => r.preguntaId === pregunta.id)
      totalPuntos += pregunta.puntos

      if (respuesta) {
        let esCorrecta = false
        if (pregunta.tipo === 'opcion_multiple') {
          esCorrecta = respuesta.respuesta === pregunta.respuesta_correcta
        } else if (pregunta.tipo === 'verdadero_falso') {
          esCorrecta = respuesta.respuesta === pregunta.respuesta_correcta
        } else if (pregunta.tipo === 'abierta') {
          // Para preguntas abiertas, el docente calificará después
          esCorrecta = false
        }

        if (esCorrecta) {
          puntosObtenidos += pregunta.puntos
        }
      }
    })

    return (puntosObtenidos / totalPuntos) * 100
  }

  const handleEnviarExamen = async () => {
    if (!intentoId) return
    
    setEnviando(true)
    
    // Guardar todas las respuestas
    for (const pregunta of preguntas) {
      const respuesta = respuestas.find(r => r.preguntaId === pregunta.id)
      if (respuesta) {
        let esCorrecta = false
        if (pregunta.tipo !== 'abierta') {
          esCorrecta = respuesta.respuesta === pregunta.respuesta_correcta
        }
        const puntosObtenidos = esCorrecta ? pregunta.puntos : 0
        
        await guardarRespuesta(
          intentoId,
          pregunta.id,
          respuesta.respuesta,
          esCorrecta,
          puntosObtenidos
        )
      }
    }
    
    // Calcular y guardar calificación final
    const calificacion = calcularCalificacion()
    await finalizarExamen(intentoId, calificacion)
    
    // Redirigir a resultados
    navigate(`/Alumno/resultados/${intentoId}`, {
      state: { 
        calificacion,
        examenTitulo,
        materiaNombre 
      }
    })
  }

  const formatTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="loading">Cargando examen...</div>
  }

  return (
    <div className="tomar-examen">
      <div className="examen-header">
        <div>
          <h1>{examenTitulo}</h1>
          <p className="materia">{materiaNombre}</p>
        </div>
        <div className="timer">
          ⏱️ Tiempo restante: {formatTiempo(tiempoRestante)}
        </div>
      </div>

      <div className="preguntas-container">
        {preguntas.map((pregunta, idx) => (
          <div key={pregunta.id} className="pregunta-item">
            <div className="pregunta-header">
              <span className="pregunta-numero">Pregunta {idx + 1}</span>
              <span className="pregunta-puntos">{pregunta.puntos} pts</span>
            </div>
            <p className="pregunta-texto">{pregunta.pregunta}</p>
            
            {pregunta.tipo === 'opcion_multiple' && pregunta.opciones && (
              <div className="opciones">
                {pregunta.opciones.map((opcion: string, optIdx: number) => (
                  <label key={optIdx} className="opcion-radio">
                    <input
                      type="radio"
                      name={`pregunta_${pregunta.id}`}
                      value={opcion}
                      onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                    />
                    <span>{String.fromCharCode(65 + optIdx)}. {opcion}</span>
                  </label>
                ))}
              </div>
            )}
            
            {pregunta.tipo === 'verdadero_falso' && (
              <div className="opciones">
                <label className="opcion-radio">
                  <input
                    type="radio"
                    name={`pregunta_${pregunta.id}`}
                    value="true"
                    onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                  />
                  <span>Verdadero</span>
                </label>
                <label className="opcion-radio">
                  <input
                    type="radio"
                    name={`pregunta_${pregunta.id}`}
                    value="false"
                    onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                  />
                  <span>Falso</span>
                </label>
              </div>
            )}
            
            {pregunta.tipo === 'abierta' && (
              <textarea
                className="respuesta-abierta"
                rows={4}
                placeholder="Escribe tu respuesta aquí..."
                onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="examen-actions">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Cancelar
        </button>
        <button 
          onClick={handleEnviarExamen} 
          disabled={enviando}
          className="btn-primary"
        >
          {enviando ? 'Enviando...' : 'Enviar Examen'}
        </button>
      </div>
    </div>
  )
}