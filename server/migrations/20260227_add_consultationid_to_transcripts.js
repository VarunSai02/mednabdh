exports.up = async function(knex) {
  const has = await knex.schema.hasColumn('transcripts', 'consultation_id')
  if(!has){
    await knex.schema.alterTable('transcripts', (t)=>{
      t.uuid('consultation_id').nullable()
    })
  }
}

exports.down = async function(knex){
  const has = await knex.schema.hasColumn('transcripts', 'consultation_id')
  if(has){
    await knex.schema.alterTable('transcripts', (t)=>{
      t.dropColumn('consultation_id')
    })
  }
}
