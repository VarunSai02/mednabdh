require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

const db = require('./db')
const { login, requireAuth } = require('./auth')

app.post('/api/visits', async (req, res) => {
  try{
    const [row] = await db('visits').insert({ patient_name: req.body.patient_name || null }).returning('*')
    // create consultation record for compatibility with NABDH core
    try{
      const [consult] = await db('consultations').insert({ doctor_id: null, patient_mrn_hash: req.body.patient_mrn_hash || null, consent_obtained: false }).returning('*')
      // try to insert into new audit_logs as well
      await db('audit_logs').insert({ consultation_id: consult.consultation_id, doctor_id: null, action_type: 'create_consultation', previous_value: null, new_value: JSON.stringify({ visit_row: row }), timestamp: Date.now() })
    }catch(e){
      // ignore if NABDH tables are not present yet
      console.warn('consultation compat create failed:', e.message)
    }
    await db('audit').insert({ visit_id: row.id, ts: Date.now(), action: 'create_visit', user: 'system', detail: 'visit created' })
    res.json(row)
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

// Auth
app.post('/api/auth/login', login)

// Get a visit by id with transcripts, soap and audit
app.get('/api/visits/:id', async (req, res) => {
  try{
    const id = req.params.id
    const visit = await db('visits').where('id', id).first()
    if(!visit) return res.status(404).send('not found')
    const transcript = await db('transcripts').where('visit_id', id).orderBy('ts','asc')
    const soap = await db('soap_notes').where('visit_id', id).orderBy('saved_at','desc').first()
    const audit = await db('audit').where('visit_id', id).orderBy('ts','asc')
    res.json({ id: visit.id, patient_name: visit.patient_name, transcript, soap, audit })
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.post('/api/visits/:id/transcript', requireAuth, async (req, res) => {
  try{
    const id = req.params.id
    const { line } = req.body
    await db('transcripts').insert({ visit_id: id, ts: Date.now(), text: line })
    await db('audit').insert({ visit_id: id, ts: Date.now(), action: 'append_transcript', user: 'ASR', detail: line })
    res.json({ ok: true })
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.post('/api/visits/:id/soap', requireAuth, async (req, res) => {
  try{
    const id = req.params.id
    const payload = req.body
    // upsert soap_notes: delete existing then insert
    await db('soap_notes').where('visit_id', id).del()
    await db('soap_notes').insert({ visit_id: id, s: payload.S, o: payload.O, a: payload.A, p: payload.P })
    await db('audit').insert({ visit_id: id, ts: Date.now(), action: 'save_soap', user: 'clinician', detail: 'SOAP saved' })
    res.json({ ok: true })
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.get('/api/visits/:id/audit', async (req, res) => {
  try{
    const id = req.params.id
    const audit = await db('audit').where('visit_id', id).orderBy('ts','asc')
    res.json(audit)
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

// Consultation-centric endpoints (NABDH core)
app.post('/api/consultations', requireAuth, async (req, res)=>{
  try{
    const { patient_mrn_hash, doctor_id } = req.body
    const [c] = await db('consultations').insert({ patient_mrn_hash, doctor_id: doctor_id || null, consent_obtained: !!req.body.consent_obtained }).returning('*')
    // record audit log if table exists
    try{ await db('audit_logs').insert({ consultation_id: c.consultation_id, doctor_id: doctor_id || null, action_type: 'create_consultation', previous_value: null, new_value: JSON.stringify({}), timestamp: Date.now() }) }catch(e){}
    res.json(c)
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.get('/api/consultations/:id', requireAuth, async (req, res)=>{
  try{
    const id = req.params.id
    const consult = await db('consultations').where('consultation_id', id).first()
    if(!consult) return res.status(404).send('not found')
    const transcripts = await db('transcripts').where('consultation_id', id).orderBy('ts','asc')
    const note = await db('clinical_notes').where('consultation_id', id).orderBy('last_modified_at','desc').first()
    const draft = await db('insurance_drafts').where('consultation_id', id).first()
    const audit = await db('audit_logs').where('consultation_id', id).orderBy('timestamp','asc')
    res.json({ consultation: consult, transcripts, note, draft, audit })
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.post('/api/consultations/:id/transcript', requireAuth, async (req, res)=>{
  try{
    const id = req.params.id
    const { line } = req.body
    await db('transcripts').insert({ consultation_id: id, ts: Date.now(), text: line })
    try{ await db('audit_logs').insert({ consultation_id: id, doctor_id: req.user?.sub || null, action_type: 'append_transcript', previous_value: null, new_value: JSON.stringify({ text: line }), timestamp: Date.now() }) }catch(e){}
    res.json({ ok: true })
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.post('/api/consultations/:id/clinical_note', requireAuth, async (req,res)=>{
  try{
    const id = req.params.id
    const { S,O,A,P } = req.body
    await db('clinical_notes').where('consultation_id', id).del()
    await db('clinical_notes').insert({ consultation_id: id, raw_transcript: null, soap_subjective: S, soap_objective: O, soap_assessment: A, soap_plan: P, last_modified_at: Date.now() })
    try{ await db('audit_logs').insert({ consultation_id: id, doctor_id: req.user?.sub || null, action_type: 'save_clinical_note', previous_value: null, new_value: JSON.stringify({S,O,A,P}), timestamp: Date.now() }) }catch(e){}
    res.json({ ok: true })
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.get('/api/consultations/:id/audit', requireAuth, async (req,res)=>{
  try{
    const id = req.params.id
    const audit = await db('audit_logs').where('consultation_id', id).orderBy('timestamp','asc')
    res.json(audit)
  }catch(e){ console.error(e); res.status(500).json({ error: 'db error' }) }
})

app.get('/api/health', (req, res)=> res.json({ok:true}))

const port = process.env.PORT || 4000
app.listen(port, ()=> console.log('Mock server running on', port))
