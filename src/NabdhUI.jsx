import React, { useState, useEffect, useRef } from 'react'

export default function NabdhUI(){
  const [screen, setScreen] = useState('login') // 'app'
  const [activeSub, setActiveSub] = useState('dashboard')
  const [recRunning, setRecRunning] = useState(true)
  const [seconds, setSeconds] = useState(222)
  const [soapTab, setSoapTab] = useState('s')

  // Visit / backend state
  const [visitId, setVisitId] = useState(null)
  const [visitData, setVisitData] = useState(null)
  const asrIntervalRef = useRef(null)

  useEffect(()=>{
    const t = setInterval(()=>{
      if(recRunning) setSeconds(s=>s+1)
    },1000)
    return ()=>clearInterval(t)
  },[recRunning])

  // Fetch visit data when visitId changes
  useEffect(()=>{
    if(!visitId) return
    fetch(`/api/visits/${visitId}`).then(r=>r.json()).then(d=>setVisitData(d)).catch(()=>{})
  },[visitId])

  const goToApp = async ()=>{
    // create a new visit on the server and store id (or use seeded 1 if present)
    try{
      const res = await fetch('/api/visits', { method: 'POST', headers:{'content-type':'application/json'} })
      const data = await res.json()
      setVisitId(data.id)
      setScreen('app')
    }catch(e){
      // fallback to seeded visit '1'
      setVisitId('1')
      setScreen('app')
    }
  }

  const showSub = (name)=> setActiveSub(name)
  const switchSoap = (tab)=> setSoapTab(tab)
  const toggleRec = ()=> setRecRunning(r=>!r)

  const formatTimer = ()=>{
    const m = String(Math.floor(seconds / 60)).padStart(2,'0')
    const s = String(seconds % 60).padStart(2,'0')
    return `00:${m}:${s}`
  }

  // SOAP controlled state (so we can POST it)
  const [soap, setSoap] = useState({ S: 'مريضة تبلغ من العمر ٣٨ عاماً، تراجع بشكوى صداع ودوخة منذ يومين...', O:'ضغط الدم: ١٦٢/١٠٢ ملم زئبق...', A:'١. ارتفاع ضغط الدم الأولي — I10...', P:'العلاج الدوائي: • أملوديبين ٥ ملغ مرة يومياً...' })

  // start/stop simulated ASR when recording starts/stops or visitId changes
  useEffect(()=>{
    if(recRunning && visitId){
      startSimulatedAsr()
    }else{
      stopSimulatedAsr()
    }
    return ()=> stopSimulatedAsr()
  },[recRunning, visitId])

  const startSimulatedAsr = ()=>{
    if(!visitId) return
    if(asrIntervalRef.current) return
    asrIntervalRef.current = setInterval(async ()=>{
      const line = `ASR line at ${new Date().toLocaleTimeString()}`
      try{
        await fetch(`/api/visits/${visitId}/transcript`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ line }) })
        const r = await fetch(`/api/visits/${visitId}`)
        if(r.ok) setVisitData(await r.json())
      }catch(e){ console.error('ASR post failed', e) }
    },1500)
  }

  const stopSimulatedAsr = ()=>{
    if(asrIntervalRef.current){ clearInterval(asrIntervalRef.current); asrIntervalRef.current = null }
  }

  const saveSoapAndGotoInsurance = async ()=>{
    if(!visitId) return alert('No visit id')
    await fetch(`/api/visits/${visitId}/soap`, { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(soap) })
    // refetch visit
    const res = await fetch(`/api/visits/${visitId}`)
    const d = await res.json()
    setVisitData(d)
    setActiveSub('insurance')
  }

  if(screen === 'login'){
    return (
      <div id="screen-login" className="screen active">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-mark"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg></div>
            <div className="logo-text"><div className="ar">نبض</div><div className="en">NABDH · AI Clinical Layer</div></div>
          </div>
          <div className="login-title">تسجيل الدخول</div>
          <div className="login-sub">بوابة الطبيب · Doctor Portal V1</div>
          <div className="field"><label>البريد الإلكتروني</label><input type="email" placeholder="doctor@hospital.ae" defaultValue="dr.mohammed@nmc.ae" /></div>
          <div className="field"><label>كلمة المرور</label><input type="password" defaultValue="••••••••" /></div>
          <div className="consent-box"><input type="checkbox" id="consent" defaultChecked/><span>يساعد الذكاء الاصطناعي في توثيق الملاحظات السريرية. <strong>تبقى المسؤولية الطبية النهائية على عاتق الطبيب.</strong> أوافق على شروط الخدمة وسياسة الخصوصية.</span></div>
          <button className="btn-primary" onClick={goToApp}>تسجيل الدخول →</button>
          <div className="data-note"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> البيانات محفوظة في الإمارات العربية المتحدة · UAE Data Residency</div>
        </div>
      </div>
    )
  }

  return (
    <div id="screen-app" className="screen active" style={{display:'flex'}}>
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark"><svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg></div>
          <div className="ar" style={{fontSize:18,fontWeight:700,color:'var(--green)'}}>نبض</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">الرئيسية</div>
          <div className={`nav-item ${activeSub==='dashboard'?'active':''}`} onClick={()=>showSub('dashboard')}> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> لوحة التحكم</div>
          <div className={`nav-item ${activeSub==='recorder'?'active':''}`} onClick={()=>showSub('recorder')}> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.53 9.112 8 9.9V22h2v-2.07c4.47-.78 8-4.93 8-9.93h-2c0 4.08-3.06 7.44-7 7.93z"/></svg> التسجيل السريري</div>
          <div className={`nav-item ${activeSub==='soap'?'active':''}`} onClick={()=>showSub('soap')}> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg> منشئ SOAP</div>
          <div className="nav-section">الأدوات</div>
          <div className={`nav-item ${activeSub==='insurance'?'active':''}`} onClick={()=>showSub('insurance')}> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> مساعد التأمين</div>
          <div className={`nav-item ${activeSub==='audit'?'active':''}`} onClick={()=>showSub('audit')}> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg> سجل المراجعة</div>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">م</div>
          <div className="user-info"><div className="name">د. محمد العامري</div><div className="role">طب الباطنة · NMC Hospital</div></div>
        </div>
      </div>

      <div className="main-area">
        {/* Dashboard */}
        <div id="sub-dashboard" className={`sub-screen ${activeSub==='dashboard'?'active':''}`} style={{display: activeSub==='dashboard' ? 'flex' : 'none', flexDirection:'column',height:'100%'}}>
          <div className="topbar">
            <div className="topbar-title">الصفحة الرئيسية — الخميس ١٢ فبراير ٢٠٢٦</div>
            <div className="topbar-actions"><span className="badge badge-green"><span style={{width:6,height:6,borderRadius:6,background:'var(--green)',display:'inline-block'}}></span> النظام يعمل</span></div>
          </div>
          <div className="page-content">
            <div className="stat-row">
              <div className="stat-card"><div className="stat-label">الزيارات اليوم</div><div className="stat-val">٨</div><div className="stat-sub">٢ في الانتظار</div></div>
              <div className="stat-card"><div className="stat-label">الوقت المُوفَّر هذا الأسبوع</div><div className="stat-val">٣.٢h</div><div className="stat-sub">+١٨٪ عن الأسبوع الماضي</div></div>
              <div className="stat-card"><div className="stat-label">مطالبات التأمين</div><div className="stat-val">٥</div><div className="stat-sub">١ تحتاج مراجعة</div></div>
            </div>
            <div className="cta-row">
              <button className="btn-big" onClick={()=>showSub('recorder')}><svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.53 9.1 8 9.9V22h2v-2.07c4.47-.78 8-4.93 8-9.93h-2c0 4.08-3.06 7.44-7 7.93z"/></svg> بدء زيارة جديدة</button>
              <button className="btn-ghost"> <svg viewBox="0 0 24 24" style={{width:18,height:18,fill:'var(--green)'}}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> ملاحظة سريعة</button>
            </div>
            <div className="section-title">زيارات اليوم</div>
            <div className="visit-list">
              <div className="visit-row"><div className="visit-info"><div className="vname">أحمد سالم المنصوري</div><div className="vtime">٩:٠٠ ص — ألم في الصدر، متابعة</div></div><div className="visit-status"><span className="badge badge-green">مكتمل</span><span style={{fontSize:12,color:'var(--text-muted)'}}>←</span></div></div>
              <div className="visit-row" onClick={()=>showSub('recorder')}><div className="visit-info"><div className="vname">فاطمة خالد الزعابي</div><div className="vtime">١٠:٣٠ ص — ارتفاع ضغط الدم، زيارة أولى</div></div><div className="visit-status"><span className="badge badge-amber">جارٍ</span><span style={{fontSize:12,color:'var(--text-muted)'}}>←</span></div></div>
              <div className="visit-row"><div className="visit-info"><div className="vname">يوسف إبراهيم الحمادي</div><div className="vtime">١١:٤٥ ص — سكري النوع الثاني، مراجعة</div></div><div className="visit-status"><span className="badge badge-red">انتظار</span><span style={{fontSize:12,color:'var(--text-muted)'}}>←</span></div></div>
            </div>
          </div>
        </div>

        {/* Recorder */}
        <div id="sub-recorder" className={`sub-screen ${activeSub==='recorder'?'active':''}`} style={{display: activeSub==='recorder' ? 'flex' : 'none', flexDirection:'column',height:'100%'}}>
          <div className="topbar"><div className="topbar-title">التسجيل السريري</div><div className="topbar-actions"><span className="live-indicator"><span className="live-dot"></span> تسجيل مباشر</span><span className="autosave"><span className="autosave-dot"></span>حفظ تلقائي</span></div></div>
          <div className="page-content" style={{flex:1,overflow:'hidden'}}>
            <div className="recorder-grid" style={{height:'100%'}}>
              <div className="rec-panel">
                <div className="rec-panel-header">التحكم</div>
                <div className="rec-controls">
                  <div className="lang-badge">العربية 🇦🇪</div>
                  <button className={`rec-btn ${recRunning? 'recording':'start'}`} id="recBtn" onClick={toggleRec}><svg viewBox="0 0 24 24" id="recIcon">{recRunning ? <rect x="6" y="6" width="12" height="12" rx="2"/> : <path d="M8 5v14l11-7z"/>}</svg></button>
                  <div className="timer" id="recTimer">{formatTimer()}</div>
                  <div className="waveform">{Array.from({length:7}).map((_,i)=><div key={i} className="wave-bar" />)}</div>
                  <div className="rec-secondary" style={{width:'100%'}}><button className="rec-btn-sm">إيقاف مؤقت</button><button className="rec-btn-sm" onClick={()=>showSub('soap')}>إنهاء ← SOAP</button></div>
                  <div style={{marginTop:12,width:'100%',background:'var(--green-bg)',borderRadius:'var(--radius)',padding:12,border:'1px solid var(--green-dim)'}}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--green)',marginBottom:4}}>المريضة</div>
                    <div style={{fontSize:13,color:'var(--text)'}}>فاطمة خالد الزعابي</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>ارتفاع ضغط الدم — زيارة أولى</div>
                  </div>
                </div>
              </div>

              <div className="rec-panel">
                <div className="rec-panel-header"><span>النص المباشر</span><span className="live-indicator"><span className="live-dot"></span>مباشر</span></div>
                <div className="rec-panel-body">
                  <div className="transcript-line"><div className="speaker-label doctor">الطبيب</div><div className="transcript-text doctor">صباح الخير، تفضلي. ما هي شكواك الرئيسية اليوم؟</div></div>
                  <div className="transcript-line"><div className="speaker-label patient">المريضة</div><div className="transcript-text patient">صباح النور دكتور. عندي صداع من البارحة، وحسيت بدوخة كذلك. ما نمت كويس.</div></div>
                  <div className="transcript-line"><div className="speaker-label doctor">الطبيب</div><div className="transcript-text doctor">من كم يوم عندك هذه الأعراض؟ وهل قست ضغطك في البيت؟</div></div>
                  <div className="transcript-line"><div className="speaker-label patient">المريضة</div><div className="transcript-text patient">من يومين تقريباً. قست الضغط البارحة، كان ١٦٠ على ١٠٠. ما آخذ أي دواء حالياً.</div></div>
                </div>
              </div>

              <div className="rec-panel">
                <div className="rec-panel-header"><span>تنبيهات الأمان</span><span className="badge badge-amber">٢ تنبيه</span></div>
                <div className="rec-panel-body">
                  <div className="alert-item danger"><div className="alert-icon">🚨</div><div><div className="alert-title">ضغط دم مرتفع حرج</div><div className="alert-body">قياس ١٦٠/١٠٠ — يستدعي تقييماً فورياً لأضرار الأعضاء المستهدفة</div></div></div>
                  <div className="alert-item warn"><div className="alert-icon">⚠️</div><div><div className="alert-title">معلومات مفقودة</div><div className="alert-body">لم يُذكر: نمط الصداع، مدة الدوخة، قياس الضغط الثنائي</div></div></div>
                  <div className="alert-item info"><div className="alert-icon">💡</div><div><div className="alert-title">اقتراح التأمين</div><div className="alert-body">يُرجى توثيق ICD-10: I10 لارتفاع ضغط الدم الأساسي لدعم المطالبة</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SOAP */}
        <div id="sub-soap" className={`sub-screen ${activeSub==='soap'?'active':''}`} style={{display: activeSub==='soap' ? 'flex' : 'none', flexDirection:'column',height:'100%'}}>
          <div className="topbar"><div className="topbar-title">منشئ SOAP — فاطمة خالد الزعابي</div><div className="topbar-actions"><span className="ai-tag">✦ مُولَّد بالذكاء الاصطناعي</span><button className="btn-sm primary" onClick={()=>showSub('insurance')}>متابعة ← التأمين</button></div></div>
          <div className="page-content">
            <div className="soap-tabs">
              <button className={`soap-tab ${soapTab==='s'?'active':''}`} onClick={()=>switchSoap('s')}><span className="tab-key">S</span>شكوى المريض</button>
              <button className={`soap-tab ${soapTab==='o'?'active':''}`} onClick={()=>switchSoap('o')}><span className="tab-key">O</span>الفحص الموضوعي</button>
              <button className={`soap-tab ${soapTab==='a'?'active':''}`} onClick={()=>switchSoap('a')}><span className="tab-key">A</span>التقييم</button>
              <button className={`soap-tab ${soapTab==='p'?'active':''}`} onClick={()=>switchSoap('p')}><span className="tab-key">P</span>خطة العلاج</button>
            </div>
            <div className="soap-layout">
              <div className="soap-main">
                <div id="soap-s" className={`soap-tab-content ${soapTab==='s'?'active':''}`}>
                  <div className="soap-section-panel">
                    <div className="soap-section-header"><span className="title">الشكوى الرئيسية والتاريخ المرضي</span><span className="ai-tag">✦ AI</span></div>
                    <textarea className="soap-textarea" rows="6" value={soap.S} onChange={e=>setSoap(s=>({ ...s, S: e.target.value }))} />
                  </div>
                </div>
                <div id="soap-o" className={`soap-tab-content ${soapTab==='o'?'active':''}`}>
                  <div className="soap-section-panel">
                    <div className="soap-section-header"><span className="title">العلامات الحيوية والفحص السريري</span><span className="ai-tag">✦ AI</span></div>
                    <textarea className="soap-textarea" rows="6" value={soap.O} onChange={e=>setSoap(s=>({ ...s, O: e.target.value }))} />
                  </div>
                </div>
                <div id="soap-a" className={`soap-tab-content ${soapTab==='a'?'active':''}`}>
                  <div className="soap-section-panel">
                    <div className="soap-section-header"><span className="title">التشخيص والتقييم</span><span className="ai-tag">✦ AI</span></div>
                    <textarea className="soap-textarea" rows="6" value={soap.A} onChange={e=>setSoap(s=>({ ...s, A: e.target.value }))} />
                  </div>
                </div>
                <div id="soap-p" className={`soap-tab-content ${soapTab==='p'?'active':''}`}>
                  <div className="soap-section-panel">
                    <div className="soap-section-header"><span className="title">خطة العلاج والمتابعة</span><span className="ai-tag">✦ AI</span></div>
                    <textarea className="soap-textarea" rows="8" value={soap.P} onChange={e=>setSoap(s=>({ ...s, P: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="soap-aside">
                <div className="aside-card"><div className="aside-card-header">سبب الاقتراح ✦ AI</div><div className="aside-card-body" style={{fontSize:12}}>استُخرج هذا التقييم من <strong style={{color:'var(--green)'}}>المحادثة المسجلة</strong> وقياسات الضغط الموثقة.</div></div>
                <div className="aside-card"><div className="aside-card-header">علامات التأمين</div><div className="aside-card-body"><span className="insurance-tag">I10</span><span className="insurance-tag">Z82.49</span></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance */}
        <div id="sub-insurance" className={`sub-screen ${activeSub==='insurance'?'active':''}`} style={{display: activeSub==='insurance' ? 'flex' : 'none', flexDirection:'column',height:'100%'}}>
          <div className="topbar"><div className="topbar-title">مساعد التأمين</div><div className="topbar-actions"><span className="badge badge-amber">⚠ ١ عنصر مفقود</span><button className="btn-sm primary">إرسال المطالبة ←</button></div></div>
          <div className="page-content"><div className="insurance-grid"><div className="ins-card"><div className="ins-card-header">قائمة الأهلية <span className="badge badge-amber">٨/٩</span></div><div className="checklist"><div className="check-item"><span className="check-dot green"></span>تشخيص ICD-10 موثق (I10)</div></div></div><div className="ins-card"><div className="ins-card-header">مؤشر رفض المطالبة</div><div className="rejection-meter"><div className="meter-label"><span>منخفض</span><span style={{color:'var(--green)',fontWeight:700}}>١٨٪</span></div><div className="meter-bar"><div className="meter-fill low" style={{width:'18%'}}/></div></div></div><div className="ins-card" style={{gridColumn:'span 2'}}><div className="ins-card-header">نص المطالبة — مسودة AI <span className="ai-tag">✦ AI</span></div><div className="claim-text">تراجع المريضة فاطمة خالد الزعابي ...</div><div className="ins-actions"><button className="btn-sm primary">قبول المسودة</button><button className="btn-sm ghost">تعديل</button><button className="btn-sm ghost">تصدير PDF</button></div></div></div></div>
        </div>

        {/* Audit */}
        <div id="sub-audit" className={`sub-screen ${activeSub==='audit'?'active':''}`} style={{display: activeSub==='audit' ? 'flex' : 'none', flexDirection:'column',height:'100%'}}>
          <div className="topbar"><div className="topbar-title">سجل المراجعة والذكاء الاصطناعي</div><div className="topbar-actions"><button className="btn-sm ghost">تصدير للجهات التنظيمية</button><span className="badge badge-green">مشفر · UAE</span></div></div>
          <div className="page-content">
            <div className="audit-topbar"><div><div style={{fontSize:13,color:'var(--text-muted)'}}>١٢ فبراير ٢٠٢٦ — فاطمة خالد الزعابي — د. محمد العامري</div></div><div style={{display:'flex',gap:8}}><span className="badge badge-green">✓ AI مُفصَح عنه</span><span className="badge badge-green">✓ سجل كامل</span></div></div>
            <table className="audit-table"><thead><tr><th>التوقيت</th><th>الإجراء</th><th>المستخدم/النظام</th><th>التفاصيل</th><th>النوع</th></tr></thead><tbody>
              <tr><td><span className="mono">09:32:14</span></td><td><span className="action-pill view">عرض</span></td><td>د. محمد العامري</td><td>فتح ملف المريضة</td><td>إجراء مستخدم</td></tr>
              <tr><td><span className="mono">09:33:01</span></td><td><span className="action-pill ai">ذكاء اصطناعي</span></td><td>ASR Engine v2.1</td><td>بدء التحويل الصوتي إلى نص — العربية</td><td>خدمة تلقائية</td></tr>
            </tbody></table>
            <div style={{marginTop:16,padding:14,background:'var(--green-bg)',border:'1px solid var(--green-dim)',borderRadius:'var(--radius)',display:'flex',alignItems:'center',gap:10}}><span style={{color:'var(--green)',fontSize:16}}>🔒</span><span style={{fontSize:12,color:'var(--green)'}}>جميع الإجراءات مختومة بتوقيت التنفيذ ومحفوظة بتشفير AES-256 في منطقة الإمارات العربية المتحدة. لا يمكن حذف السجلات أو تعديلها.</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
