const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

async function login(req, res){
  const { email, password } = req.body
  if(!email || !password) return res.status(400).json({ error: 'email and password required' })
  const user = await db('users').where({ email }).first()
  if(!user) return res.status(401).json({ error: 'invalid credentials' })
  const ok = await bcrypt.compare(password, user.password_hash)
  if(!ok) return res.status(401).json({ error: 'invalid credentials' })
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
  res.json({ token })
}

function requireAuth(req, res, next){
  const h = req.headers.authorization
  if(!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = h.slice(7)
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  }catch(e){
    return res.status(401).json({ error: 'invalid token' })
  }
}

module.exports = { login, requireAuth }
