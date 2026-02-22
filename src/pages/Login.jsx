import React, { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('doctor@example.com')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!consent) return alert('الرجاء قبول موافقة الاستخدام')
    onLogin({ email })
  }

  return (
    <div className="page login-page">
      <form className="card form-card" onSubmit={submit} dir="rtl">
        <h2>تسجيل الدخول</h2>
        <label>البريد الإلكتروني</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />

        <label>كلمة المرور</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />

        <div className="consent">
          <input id="consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <label htmlFor="consent">أوافق: يتم استخدام الذكاء الاصطناعي لمساعدة التوثيق. المسؤولية النهائية للطبيب.</label>
          <a className="link" href="#">سياسة الخصوصية</a>
        </div>

        <button className="btn primary" type="submit">تسجيل الدخول</button>
      </form>
    </div>
  )
}
