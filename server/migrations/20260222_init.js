exports.up = async function(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary()
    t.string('email').notNullable().unique()
    t.string('password_hash').notNullable()
    t.string('name')
    t.string('role').defaultTo('doctor')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('visits', (t) => {
    t.increments('id').primary()
    t.string('patient_name')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('transcripts', (t) => {
    t.increments('id').primary()
    t.integer('visit_id').references('id').inTable('visits').onDelete('CASCADE')
    t.bigInteger('ts').notNullable()
    t.text('text')
  })

  await knex.schema.createTable('soap_notes', (t) => {
    t.increments('id').primary()
    t.integer('visit_id').references('id').inTable('visits').onDelete('CASCADE')
    t.text('s')
    t.text('o')
    t.text('a')
    t.text('p')
    t.timestamp('saved_at').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('audit', (t) => {
    t.increments('id').primary()
    t.integer('visit_id').references('id').inTable('visits').onDelete('CASCADE')
    t.bigInteger('ts').notNullable()
    t.string('action')
    t.string('user')
    t.text('detail')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit')
  await knex.schema.dropTableIfExists('soap_notes')
  await knex.schema.dropTableIfExists('transcripts')
  await knex.schema.dropTableIfExists('visits')
  await knex.schema.dropTableIfExists('users')
}
