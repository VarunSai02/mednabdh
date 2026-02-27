require('dotenv').config()

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nabdh'
const useSsl = (process.env.DB_SSL === 'true') || /sslmode=require/.test(connectionString) || process.env.NODE_ENV === 'production'

const connection = useSsl
  ? { connectionString, ssl: { rejectUnauthorized: (process.env.DB_SSL_REJECT !== 'false') } }
  : connectionString

module.exports = {
  development: {
    client: 'pg',
    connection,
    pool: { min: 2, max: Number(process.env.DB_POOL_MAX || 10) },
    migrations: { directory: './server/migrations' },
    seeds: { directory: './server/seeds' }
  }
}
