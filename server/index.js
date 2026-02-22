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

app.get('/api/health', (req, res)=> res.json({ok:true}))

const port = process.env.PORT || 4000
app.listen(port, ()=> console.log('Mock server running on', port))
