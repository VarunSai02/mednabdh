import React, { useContext, useState } from 'react'
import { VisitContext } from '../App'

function Tab({label, value, onChange}){
  return (
    <div className="soap-tab">
      <h4>{label}</h4>
      <textarea value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}

export default function SOAPBuilder(){
  const { visit, setVisit } = useContext(VisitContext)
  const [active, setActive] = useState('S')

  const updateField = (field, text)=>{
    setVisit(v=>({ ...v, soap: { ...v.soap, [field]: text }, audit: [...v.audit, {ts: Date.now(), action: 'edit_soap', field, text}] }))
  }

  return (
    <div className="page soap-page">
      <div className="soap-layout card">
        <div className="soap-left">
          <div className="soap-tabs">
            {['S','O','A','P'].map(t=> (
              <button key={t} className={t===active? 'tab active':'tab'} onClick={()=>setActive(t)}>{t}</button>
            ))}
          </div>

          <div className="soap-editor">
            <Tab label={active} value={visit.soap[active]} onChange={(v)=>updateField(active, v)} />
          </div>
        </div>

        <div className="soap-right">
          <h4>لماذا اقترح الذكاء الاصطناعي هذا؟</h4>
          <div className="explain">اقتراح مبني على النص التالي: <pre className="small">{visit.transcript || '—'}</pre></div>
          <h5>ملاحظات السلامة</h5>
          <div className="safety">
            {visit.transcript.includes('ألم في الصدر') ? <div className="alert red">علامة حمراء: ألم صدر</div> : <div>لا توجد علامات حرجة</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
