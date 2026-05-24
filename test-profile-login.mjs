import { URLSearchParams } from 'url'

const base = 'http://localhost:3000'
const csrfRes = await fetch(`${base}/api/auth/csrf`, { headers: { Accept: 'application/json' } })
const csrfData = await csrfRes.json()
const csrfCookie = csrfRes.headers.get('set-cookie') || ''
console.log('csrf', csrfData)
console.log('csrf cookie', csrfCookie)

function parseCookieHeader(setCookieValue) {
  if (!setCookieValue) return ''
  return setCookieValue
    .split(/,\s*(?=[^=]+=)/)
    .map(cookie => cookie.split(';')[0])
    .join('; ')
}

const csrfCookieHeader = parseCookieHeader(csrfCookie)
const params = new URLSearchParams()
params.append('csrfToken', csrfData.csrfToken)
params.append('callbackUrl', '/dashboard')
params.append('email', 'medecin@hexa.local')
params.append('password', 'Medecin@123456')
params.append('json', 'true')

const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    Cookie: csrfCookieHeader,
  },
  body: params.toString(),
  redirect: 'manual',
})
console.log('login status', loginRes.status, loginRes.statusText)
console.log('login location', loginRes.headers.get('location'))
const loginSetCookie = loginRes.headers.get('set-cookie') || ''
console.log('login set-cookie', loginSetCookie)
const loginCookieHeader = parseCookieHeader(loginSetCookie)
const cookieHeader = [csrfCookieHeader, loginCookieHeader]
  .filter(Boolean)
  .join('; ')
if (!cookieHeader) process.exit(1)

const sessionRes = await fetch(`${base}/api/auth/session`, {
  headers: { cookie: cookieHeader, Accept: 'application/json' },
  redirect: 'manual',
})
console.log('session status', sessionRes.status, sessionRes.statusText)
const sessionBody = await sessionRes.text()
console.log('session body', sessionBody)

const profileRes = await fetch(`${base}/dashboard/profile`, {
  headers: { cookie: cookieHeader },
  redirect: 'manual',
})
console.log('profile location', profileRes.headers.get('location'))
console.log('profile status', profileRes.status, profileRes.statusText)
const profileText = await profileRes.text()
console.log('profile length', profileText.length)
if (profileText.length < 1000) console.log(profileText)
