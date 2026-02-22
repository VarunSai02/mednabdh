import React, { useContext, useMemo } from 'react'
import { VisitContext } from '../App'

function riskColor(score){
  if(score>0.7) return 'red'
  if(score>0.3) return 'amber'
  return 'green'
}

export default function InsuranceAssistant(){
  const { visit } = useContext(VisitContext)

  const checklist = useMemo(()=>{
    const missing = []
    if(!visit.soap.S) missing.push('وصف الأعراض')
    if(!visit.soap.A) missing.push('Assessment')
    return missing
  },[visit.soap])

  const draft = useMemo(()=>{
    return `ملخص الطلب الطبي:\n${visit.soap.A || '—'}\nالخطة: ${visit.soap.P || '—'}`
  },[visit.soap])

  const risk = useMemo(()=>{
    // naive rejection risk: more missing items -> higher risk
    const score = Math.min(1, checklist.length * 0.6)
    return { score, color: riskColor(score) }
  },[checklist])

  const safeVisit = visit || { soap: {}, audit: [] }

  return (
    <div className="page insurance-page">
      <div className="page-content">
        <div className="insurance-grid">
          <div className="ins-card">
            <div className="ins-card-header">قائمة الأهلية <span className="badge badge-amber">{safeVisit.soap && safeVisit.soap.A ? '٨/٩' : '٤/٩'}</span></div>
            <div className="checklist">
              {checklist.length ? checklist.map((it,idx)=> (
                <div key={idx} className="check-item"><span className={`check-dot ${idx%2? 'amber':'green'}`}></span>{it}</div>
              )) : <div className="check-item"><span className="check-dot green"></span>جميع العناصر مكتملة</div>}
            </div>
          </div>

          <div className="ins-card">
            <div className="ins-card-header">مؤشر رفض المطالبة</div>
            <div className="rejection-meter">
              <div className="meter-label"><span>تقدير المخاطر</span><span style={{color: risk.color==='red'? 'var(--red)': risk.color==='amber'? 'var(--amber)': 'var(--green)', fontWeight:700}}>{Math.round(risk.score*100)}%</span></div>
              <div className="meter-bar"><div className={`meter-fill ${risk.score>0.6? 'high' : risk.score>0.3? 'med':'low'}`} style={{width: `${Math.round(risk.score*100)}%`}}/></div>
            </div>
          </div>

          <div className="ins-card" style={{gridColumn: 'span 2'}}>
            <div className="ins-card-header">نص المطالبة — مسودة AI <span className="ai-tag">✦ AI</span></div>
            <div className="claim-text">{draft}</div>
            <div className="ins-actions">
              <button className="btn-sm primary">قبول المسودة</button>
              <button className="btn-sm ghost">تعديل</button>
              <button className="btn-sm ghost">تصدير PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
