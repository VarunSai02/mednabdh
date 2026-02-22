import React, { useContext } from 'react'
import { VisitContext } from '../App'

export default function Summary(){
  const { visit } = useContext(VisitContext)

  const onExportJSON = ()=>{
    const blob = new Blob([JSON.stringify({transcript: visit.transcript, soap: visit.soap}, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'visit-summary.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page summary-page card">
      <h2>ملخص الزيارة</h2>
      <div className="summary-block">
        <h4>ملخص الطبيب</h4>
        <pre>{visit.summary || 'لم يتم إنشاء ملخص بعد'}</pre>
      </div>

      <div className="summary-block">
        <h4>SOAP (مهيكل)</h4>
        <pre>{JSON.stringify(visit.soap, null, 2)}</pre>
      </div>

      <div className="actions">
        <button className="btn" onClick={onExportJSON}>تصدير JSON</button>
      </div>
    </div>
  )
}
