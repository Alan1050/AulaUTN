// pages/Docente/GrupoPage.tsx (nuevo archivo)
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import GestionRecursos from '../../components/docente/GestionRecursos'
import BancoPreguntas from '../../components/docente/BancoPreguntas'
import GestionExamenes from '../../components/docente/GestionExamenes'

export default function GrupoPage() {
  const location = useLocation()
  const { grupoId, grupoNombre, materia } = location.state || {}
  const [activeTab, setActiveTab] = useState('recursos')

  const tabs = [
    { id: 'recursos', label: '📚 Recursos', component: GestionRecursos },
    { id: 'preguntas', label: '📝 Banco de Preguntas', component: BancoPreguntas },
    { id: 'examenes', label: '📋 Exámenes', component: GestionExamenes },
    { id: 'alumnos', label: '👥 Alumnos', component: null }
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="grupo-page">
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {ActiveComponent && (
          <ActiveComponent 
            grupoId={grupoId} 
            grupoNombre={grupoNombre}
            materia={materia}
          />
        )}
      </div>
    </div>
  )
}