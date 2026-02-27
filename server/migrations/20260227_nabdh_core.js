exports.up = async function(knex) {
  // enable uuid extension where available
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

  await knex.schema.createTable('doctors', (t) => {
    t.uuid('doctor_id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.string('entra_id', 255).unique().notNullable()
    t.string('full_name', 255).notNullable()
    t.string('email', 255).unique().notNullable()
    t.string('license_number', 100).notNullable()
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('consultations', (t) => {
    t.uuid('consultation_id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('doctor_id').references('doctor_id').inTable('doctors')
    t.text('patient_mrn_hash').notNullable()
    t.boolean('consent_obtained').defaultTo(false)
    t.string('status', 50).defaultTo('recording')
    t.text('audio_blob_url')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('clinical_notes', (t) => {
    t.uuid('note_id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('consultation_id').references('consultation_id').inTable('consultations').onDelete('CASCADE')
    t.text('raw_transcript')
    t.text('soap_subjective')
    t.text('soap_objective')
    t.text('soap_assessment')
    t.text('soap_plan')
    t.boolean('is_pathway_applied').defaultTo(false)
    t.timestamp('last_modified_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('insurance_drafts', (t) => {
    t.uuid('draft_id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    t.uuid('consultation_id').references('consultation_id').inTable('consultations')
    t.text('claim_narrative')
    t.text('pre_auth_justification')
    t.jsonb('suggested_icd10_codes')
    t.integer('risk_score')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('log_id').primary()
    t.uuid('consultation_id').references('consultation_id').inTable('consultations')
    t.uuid('doctor_id').references('doctor_id').inTable('doctors')
    t.string('action_type', 50)
    t.jsonb('previous_value')
    t.jsonb('new_value')
    t.timestamp('timestamp').defaultTo(knex.fn.now())
  })

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_doctor_encounters ON consultations(doctor_id)')
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_consultation_status ON consultations(status)')
}

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs')
  await knex.schema.dropTableIfExists('insurance_drafts')
  await knex.schema.dropTableIfExists('clinical_notes')
  await knex.schema.dropTableIfExists('consultations')
  await knex.schema.dropTableIfExists('doctors')
}
