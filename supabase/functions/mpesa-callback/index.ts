import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { creditTopup, failTopup, serviceClient } from '../_shared/mpesa.ts'

// Webhook called by Safaricom after the customer enters their M-Pesa PIN.
// Trusted because it only credits top-up requests this app created itself
// (matched by CheckoutRequestID) and each is credited exactly once.
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface StkCallback {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: { Item?: Array<{ Name: string; Value?: string | number }> }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ResultCode: 0, ResultDesc: 'Accepted' })

  try {
    const payload = (await req.json().catch(() => ({}))) as StkCallback
    const cb = payload.Body?.stkCallback
    if (!cb?.CheckoutRequestID) return json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const admin = serviceClient()
    const { data: row } = await admin
      .from('mpesa_topups')
      .select('id, status')
      .eq('checkout_request_id', cb.CheckoutRequestID)
      .maybeSingle()

    if (!row) {
      console.error('Callback for unknown checkout id')
      return json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (cb.ResultCode === 0) {
      const items = cb.CallbackMetadata?.Item ?? []
      const receipt = String(items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value ?? '')
      const amount = Number(items.find((i) => i.Name === 'Amount')?.Value ?? 0)
      if (amount > 0) {
        const { data: expected } = await admin
          .from('mpesa_topups')
          .select('amount')
          .eq('id', row.id)
          .single()
        if (expected && Math.abs(Number(expected.amount) - amount) > 1) {
          console.error(`Amount mismatch for top-up ${row.id}: expected ${expected.amount}, got ${amount}`)
        }
      }
      await creditTopup(admin, row.id, receipt || null)
      console.log(`Top-up ${row.id} paid (receipt ${receipt})`)
    } else {
      const status = cb.ResultCode === 1032 ? 'cancelled' : 'failed'
      await failTopup(admin, row.id, status)
      console.log(`Top-up ${row.id} ${status}: ${cb.ResultDesc ?? ''}`)
    }

    return json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (e) {
    console.error('mpesa-callback error:', e)
    // Always accept so Safaricom does not retry indefinitely.
    return json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
})
