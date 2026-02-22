import React, { useContext, useState, useEffect } from 'react'
import { VisitContext } from '../App'

function FakeTranscript({running, onAdd}){
  useEffect(()=>{
    if(!running) return
    const lines = [
      'الطبيب: كيف حالك اليوم؟',
      'المريض: أعاني من ألم في الصدر منذ ساعتين',
      'الطبيب: هل هناك ضيق في التنفس؟'
    ]
    let i=0
    const t = setInterval(()=>{
      if(i>=lines.length){ clearInterval(t); return }
      onAdd(lines[i])
      i++
    }, 1200)
    return ()=>clearInterval(t)
  },[running])
  return null
}

export default function Recorder(){
  const { visit, setVisit } = useContext(VisitContext)
  const [running, setRunning] = useState(false)

  const addLine = (line)=>{
    setVisit(v=>({
      ...v,
      transcript: v.transcript ? v.transcript + '\n' + line : line,
      audit: [...v.audit, {ts: Date.now(), action: 'transcript_line', text: line}]
    }))
  }

  return (
    <div className="page recorder-page">
      <div className="recorder-grid card">
        <div className="left-panel">
          <div className="controls">
            <button className="btn" onClick={()=>setRunning(!running)}>{running? 'إيقاف' : 'بدء'}</button>
            <div className="timer">00:0{running? '5' : '0'}</div>
            <div className="lang">العربية</div>
          </div>
        </div>

        <div className="center-panel">
          <h3>النص الحي</h3>
          <pre className="transcript">{visit.transcript || 'لا توجد نصوص بعد'}</pre>
          <FakeTranscript running={running} onAdd={addLine} />
        </div>

        <div className="right-panel">
          <h4>تنبيهات السلامة</h4>
          <div className="alerts">
            {/* For demo: simple rule highlight */}
            {visit.transcript.includes('ألم في الصدر') && <div className="alert amber">تنبيه: ألم في الصدر — راجع حالة المريض</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
