import React, { useContext } from 'react'
import { VisitContext } from '../App'

export default function AuditLog(){
  const { visit } = useContext(VisitContext)

  return (
    <div className="page audit-page card">
      <h2>سجل التدقيق و AI</h2>
      <div className="audit-list">
        {visit.audit.length? visit.audit.slice().reverse().map((a,i)=> (
          <div key={i} className="audit-item">
            <div className="ts">{new Date(a.ts).toLocaleString('ar-EG')}</div>
            <div className="action">{a.action}</div>
            <pre className="text">{a.text || a.field || ''}</pre>
          </div>
        )) : <div>لا سجلات حتى الآن</div>}
      </div>
    </div>
  )
}
