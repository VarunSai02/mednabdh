const knexConfig = require('../knexfile')
const knex = require('knex')(knexConfig.development)

// For Azure Managed Identity scenario we expect the app to receive a full
// `DATABASE_URL` (with user/password) from Key Vault or environment.
// When using a private endpoint or CA-verified server, set DB_SSL=true
// and provide proper CA bundle via NODE_EXTRA_CA_CERTS if needed.

module.exports = knex
