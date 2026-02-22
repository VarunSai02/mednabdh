require('dotenv').config()

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nabdh',
    migrations: { directory: './server/migrations' },
    seeds: { directory: './server/seeds' }
  }
}
