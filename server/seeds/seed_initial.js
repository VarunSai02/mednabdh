const bcrypt = require('bcryptjs')

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('audit').del().catch(()=>{})
  await knex('soap_notes').del().catch(()=>{})
  await knex('transcripts').del().catch(()=>{})
  await knex('visits').del().catch(()=>{})
  await knex('users').del().catch(()=>{})

  const passwordHash = await bcrypt.hash('password', 10)
  const userRes = await knex('users').insert({ email: 'dr.mohammed@nmc.ae', password_hash: passwordHash, name: 'د. محمد العامري', role: 'doctor' }).returning('id')
  const userId = Array.isArray(userRes) ? (userRes[0].id ?? userRes[0]) : userRes

  const visitRes = await knex('visits').insert({ patient_name: 'فاطمة خالد الزعابي' }).returning('id')
  const visitId = Array.isArray(visitRes) ? (visitRes[0].id ?? visitRes[0]) : visitRes

  await knex('transcripts').insert([
    { visit_id: visitId, ts: Date.now() - 3600_000, text: 'الطبيب: صباح الخير، تفضلي.' },
    { visit_id: visitId, ts: Date.now() - 3590_000, text: 'المريضة: عندي صداع ودوخة منذ يومين.' }
  ])

  await knex('soap_notes').insert({ visit_id: visitId, s: 'مريضة تبلغ من العمر ٣٨ عاماً، تراجع بشكوى صداع ودوخة منذ يومين...', o: 'ضغط الدم: ١٦٢/١٠٢ ملم زئبق...', a: '١. ارتفاع ضغط الدم الأولي — I10...', p: 'العلاج الدوائي: • أملوديبين ٥ ملغ مرة يومياً...' })

  const now = Date.now()
  await knex('audit').insert([
    { visit_id: visitId, ts: now - 3600_000, action: 'open_record', user: 'د. محمد العامري', detail: 'فتح ملف المريضة' },
    { visit_id: visitId, ts: now - 3500_000, action: 'ai_asr_start', user: 'ASR Engine v2.1', detail: 'بدء التحويل الصوتي إلى نص — العربية' },
    { visit_id: visitId, ts: now - 1800_000, action: 'safety_alert', user: 'Safety Engine', detail: 'تنبيه: ضغط دم مرتفع ١٦٢/١٠٢ — مستوى خطر عالٍ' },
    { visit_id: visitId, ts: now - 1200_000, action: 'soap_generated', user: 'SOAP Generator', detail: 'إنشاء ملاحظة SOAP أولية من المحادثة المسجلة' },
    { visit_id: visitId, ts: now - 900_000, action: 'edit', user: 'د. محمد العامري', detail: 'تعديل قسم التقييم (A) — إضافة: اشتباه ارتفاع ثانوي' },
    { visit_id: visitId, ts: now - 600_000, action: 'insurance_code', user: 'Insurance Engine', detail: 'توليد ترميز ICD-10: I10, Z82.49, E66.9 — ثقة ٩٤٪' },
    { visit_id: visitId, ts: now - 300_000, action: 'close_session', user: 'Audit Service', detail: 'ختم الجلسة — تشفير SHA-256 — نسخ احتياطي UAE' }
  ])

  // Also seed NABDH core tables: doctors, consultations, clinical_notes, insurance_drafts, audit_logs
  const [docRes] = await knex('doctors').insert({ entra_id: 'seed-ent-1', full_name: 'د. محمد العامري', email: 'dr.mohammed@nmc.ae', license_number: 'LIC-0001' }).returning('doctor_id')
  const doctorId = Array.isArray(docRes) ? (docRes[0].doctor_id ?? docRes[0]) : docRes

  const [consultRes] = await knex('consultations').insert({ doctor_id: doctorId, patient_mrn_hash: 'hash-demo-1', consent_obtained: true }).returning('consultation_id')
  const consultationId = Array.isArray(consultRes) ? (consultRes[0].consultation_id ?? consultRes[0]) : consultRes

  await knex('clinical_notes').insert({ consultation_id: consultationId, raw_transcript: 'الطبيب: صباح الخير ...', soap_subjective: 'مريضة تبلغ من العمر ٣٨ عاماً...', soap_objective: 'ضغط الدم: ١٦٢/١٠٢...', soap_assessment: 'I10', soap_plan: 'أملوديبين ٥ملغ' })

  await knex('insurance_drafts').insert({ consultation_id: consultationId, claim_narrative: 'تراجع المريضة...', pre_auth_justification: 'ارتفاع ضغط الدم متوافق مع...', suggested_icd10_codes: JSON.stringify(['I10']), risk_score: 18 })

  await knex('audit_logs').insert([
    { consultation_id: consultationId, doctor_id: doctorId, action_type: 'open_record', previous_value: null, new_value: JSON.stringify({ note: 'opened' }), timestamp: now - 3600_000 },
    { consultation_id: consultationId, doctor_id: doctorId, action_type: 'soap_generated', previous_value: null, new_value: JSON.stringify({ note: 'generated' }), timestamp: now - 1200_000 }
  ])
}
