import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  creditTopup,
  failTopup,
  mpesaConfigured,
  queryStkStatus,
  serviceClient,
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
    const topupId = typeof body?.topupId === 'string' ? body.topupId : ''
    if (!topupId) return json({ error: 'topupId required' }, 400)

    const admin = serviceClient()
    const { data: row, error } = await admin
      .from('mpesa_topups')
      .select('id, status, amount, mpesa_receipt, checkout_request_id')
      .eq('id', topupId)
      .eq('user_id', userId)
      .single()
    if (error || !row) return json({ error: 'Top-up not found' }, 404)

    if (row.status !== 'pending' || !mpesaConfigured()) {
      return json({ status: row.status, receipt: row.mpesa_receipt, amount: row.amount })
    }

    // Reconcile with Safaricom in case the webhook never arrives.
    const q = await queryStkStatus(row.checkout_request_id)
    const resultCode = q.ResultCode ?? (q.ResponseCode === '0' ? '0' : undefined)
    if (resultCode === '0') {
      const credited = await creditTopup(admin, row.id, null)
      console.log(`Top-up ${row.id} reconciled via query, credited: ${credited}`)
      return json({ status: 'paid', receipt: row.mpesa_receipt, amount: row.amount })
    }
    if (resultCode === '1032') {
      await failTopup(admin, row.id, 'cancelled')
      return json({ status: 'cancelled', amount: row.amount })
    }
    if (resultCode === '1037') {
      await failTopup(admin, row.id, 'failed')
      return json({ status: 'failed', amount: row.amount })
    }

    return json({ status: row.status, amount: row.amount })
  } catch (e) {
    console.error('mpesa-topup-status error:', e)
    const message = e instanceof Error ? e.message : 'Status check failed'
    return json({ error: message.slice(0, 300) }, (e as { status?: number }).status ?? 500)
  }
})
