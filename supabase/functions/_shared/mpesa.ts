import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface TopupRow {
  id: string
  user_id: string
  phone: string
  amount: number
  status: string
  mpesa_receipt: string | null
}

const CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY') ?? ''
const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET') ?? ''
const SHORTCODE = Deno.env.get('MPESA_SHORTCODE') ?? ''
const PASSKEY = Deno.env.get('MPESA_PASSKEY') ?? ''
export const ENV = (Deno.env.get('MPESA_ENV') ?? 'production').toLowerCase()
const TRANSACTION_TYPE = Deno.env.get('MPESA_TRANSACTION_TYPE') ?? 'CustomerPayBillOnline'

export function mpesaConfigured(): boolean {
  return Boolean(CONSUMER_KEY && CONSUMER_SECRET && SHORTCODE && PASSKEY)
}

export function mpesaBaseUrl(): string {
  return ENV === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke'
    : 'https://api.safaricom.co.ke'
}

/** M-Pesa expects a Nairobi-time timestamp: YYYYMMDDHHMMSS */
export function mpesaTimestamp(): string {
  const nairobi = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    nairobi.getUTCFullYear() +
    pad(nairobi.getUTCMonth() + 1) +
    pad(nairobi.getUTCDate()) +
    pad(nairobi.getUTCHours()) +
    pad(nairobi.getUTCMinutes()) +
    pad(nairobi.getUTCSeconds())
  )
}

let cachedToken: { token: string; expiresAt: number } | null = null

export function invalidateAccessToken() {
  cachedToken = null
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw Object.assign(new Error('M-Pesa credentials are missing'), { status: 503 })
  }
  const basic = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)
  const url = `${mpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${basic}` },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`M-Pesa oauth failed [${res.status}] env=${ENV}: ${body.slice(0, 200)}`)
    throw Object.assign(new Error(`M-Pesa auth failed [${res.status}]: ${body}`), { status: 502 })
  }
  const data = await res.json()
  if (!data.access_token) {
    console.error('M-Pesa oauth returned no access_token')
    throw Object.assign(new Error('M-Pesa auth returned no access token'), { status: 502 })
  }
  const ttl = Number.isFinite(Number(data.expires_in)) ? Number(data.expires_in) : 3599
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (ttl - 60) * 1000 }
  return cachedToken.token
}

/** Normalizes 07.., +2547.., 2547.. to 2547XXXXXXXX / 2541XXXXXXXX */
export function normalizePhone(input: string): string | null {
  let digits = (input ?? '').replace(/\D/g, '')
  if (digits.startsWith('254')) {
    // ok
  } else if (digits.startsWith('0')) {
    digits = `254${digits.slice(1)}`
  } else if (digits.length === 9) {
    digits = `254${digits}`
  } else {
    return null
  }
  return /^254(7|1)\d{8}$/.test(digits) ? digits : null
}

export function stkPassword(timestamp: string): string {
  return btoa(`${SHORTCODE}${PASSKEY}${timestamp}`)
}

export interface StkResult {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage?: string
}

export async function initiateStkPush(phone: string, amount: number): Promise<StkResult> {
  let token = await getAccessToken()
  const ts = mpesaTimestamp()
  const send = async (bearer: string) =>
    fetch(`${mpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: stkPassword(ts),
        Timestamp: ts,
        TransactionType: TRANSACTION_TYPE,
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
        AccountReference: 'Primegram',
        TransactionDesc: 'Wallet topup',
      }),
    })

  let res = await send(token)
  let body = await res.json().catch(() => ({}))

  // 404.001.03 (Invalid Access Token) can mean the cached token went stale or was
  // minted under different credentials — retry once with a brand-new token.
  if (res.status === 404 || body?.errorCode === '404.001.03') {
    console.error('M-Pesa STK rejected token, retrying with a fresh one')
    invalidateAccessToken()
    token = await getAccessToken()
    res = await send(token)
    body = await res.json().catch(() => ({}))
  }

  if (!res.ok || body.ResponseCode !== '0') {
    const raw = JSON.stringify(body)
    console.error(`M-Pesa STK failed [${res.status}] env=${ENV}: ${raw.slice(0, 300)}`)
    if (body?.errorCode === '404.001.03' || /Invalid Access Token/i.test(raw)) {
      throw Object.assign(
        new Error(
          'Safaricom rejected the payment session (Invalid Access Token). This usually means the Daraja keys saved in the app are sandbox/test keys while the app calls the live M-Pesa endpoint, or the Lipa na M-Pesa Online API is not yet go-live on your Daraja app. Send the keys from a go-live Daraja app, or ask me to switch the app to sandbox test mode.'
        ),
        { status: 502 }
      )
    }
    throw Object.assign(new Error(`M-Pesa STK push failed [${res.status}]: ${raw}`), { status: 502 })
  }
  return body as StkResult
}

export interface QueryResult {
  ResponseCode: string
  ResultCode?: string
  ResultDesc?: string
}

export async function queryStkStatus(checkoutRequestId: string): Promise<QueryResult> {
  const token = await getAccessToken()
  const ts = mpesaTimestamp()
  const res = await fetch(`${mpesaBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: SHORTCODE,
      Password: stkPassword(ts),
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  })
  const body = await res.json().catch(() => ({}))
  return body as QueryResult
}

/**
 * Atomically marks a pending top-up as paid and credits the wallet exactly once.
 * Returns true when this call performed the credit.
 */
export async function creditTopup(
  admin: ReturnType<typeof createClient>,
  topupId: string,
  receipt: string | null
): Promise<boolean> {
  const { data: updated, error } = await admin
    .from('mpesa_topups')
    .update({ status: 'paid', mpesa_receipt: receipt, paid_at: new Date().toISOString() })
    .eq('id', topupId)
    .eq('status', 'pending')
    .select('user_id, amount, phone')
    .single()
  if (error || !updated) {
    if (error && error.code !== 'PGRST116') console.error('creditTopup update failed:', error)
    return false
  }
  const { error: txError } = await admin.from('wallet_transactions').insert({
    user_id: updated.user_id,
    type: 'topup',
    amount: updated.amount,
    counterparty: 'M-Pesa',
    note: receipt ? `M-Pesa top-up ${receipt}` : 'M-Pesa top-up',
  })
  if (txError) {
    console.error('Failed to record wallet credit:', txError)
    // Revert so the payment can be retried instead of being lost.
    await admin.from('mpesa_topups').update({ status: 'pending', mpesa_receipt: null, paid_at: null }).eq('id', topupId)
    return false
  }
  return true
}

export function failTopup(admin: ReturnType<typeof createClient>, topupId: string, status: string) {
  return admin
    .from('mpesa_topups')
    .update({ status })
    .eq('id', topupId)
    .eq('status', 'pending')
}

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
}
