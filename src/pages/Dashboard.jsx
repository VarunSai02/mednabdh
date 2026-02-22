import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard(){
  const nav = useNavigate()

  return (
    <div className="page dashboard-page">
      <div className="card">
        <h2>لوحة الطبيب</h2>
        <div className="dashboard-actions">
          <button className="btn primary" onClick={()=>nav('/recorder')}>ابدأ زيارة جديدة</button>
          <div className="metric">الوقت الموفر هذا الأسبوع: <strong>+32%</strong></div>
        </div>
      </div>

      <div className="card">
        <h3>الزيارات اليوم</h3>
        <ul className="visit-list">
          <li>09:00 - Ahmed Ali</li>
          <li>09:30 - Fatima Hassan</li>
        </ul>
      </div>
    </div>
  )
}
