import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  mpesaConfigured,
  normalizePhone,
  initiateStkPush,
  serviceClient,
  ENV,
} from '../_shared/mpesa.ts'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!mpesaConfigured()) return json({ error: 'M-Pesa is not configured' }, 503)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await anon.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401)
    const userId = claimsData.claims.sub as string

    const body = await req.json().catch(() => null)
    const phoneRaw = typeof body?.phone === 'string' ? body.phone : ''
    const amount = Number(body?.amount)
    const phone = normalizePhone(phoneRaw)
    if (!phone) return json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678' }, 400)
    if (!Number.isFinite(amount) || amount < 10 || amount > 150000) {
      return json({ error: 'Amount must be between 10 and 150,000 KES' }, 400)
    }

    const stk = await initiateStkPush(phone, amount)

    const admin = serviceClient()
    const { data: row, error: insertError } = await admin
      .from('mpesa_topups')
      .insert({
        user_id: userId,
        phone,
        amount: Math.round(amount),
        checkout_request_id: stk.CheckoutRequestID,
        merchant_request_id: stk.MerchantRequestID,
        status: 'pending',
      })
      .select('id')
      .single()
    if (insertError || !row) {
      console.error('Failed to record top-up request:', insertError)
      return json({ error: 'Could not start the payment. Try again.' }, 502)
    }

    return json({ topupId: row.id, mode: ENV, message: stk.CustomerMessage ?? 'Check your phone to complete the payment' })
  } catch (e) {
    console.error('mpesa-topup error:', e)
    const message = e instanceof Error ? e.message : 'Payment failed'
    return json({ error: message.slice(0, 300) }, (e as { status?: number }).status ?? 500)
  }
})
