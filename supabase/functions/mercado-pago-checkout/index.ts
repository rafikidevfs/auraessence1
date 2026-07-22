import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { total, realId, customerEmail, paymentMethod, cardToken, installments, paymentMethodId, issuerId } = await req.json()

    if (!total || !realId || !customerEmail) {
      throw new Error("Dados obrigatórios ausentes (total, realId, customerEmail).")
    }

    let mpPayload: Record<string, unknown>

    if (paymentMethod === "Cartão de crédito") {
      if (!cardToken) throw new Error("Token do cartão não informado. Tokenize o cartão no frontend antes de enviar.")

      mpPayload = {
        transaction_amount: Number(total),
        token: cardToken,
        description: `Pedido ${realId} - AuraEssence`,
        installments: installments ?? 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId,
        payer: { email: customerEmail },
        external_reference: realId,
        notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      }
    } else {
      mpPayload = {
        transaction_amount: Number(total),
        description: `Pedido ${realId} - AuraEssence`,
        payment_method_id: "pix",
        payer: { email: customerEmail },
        external_reference: realId,
        notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      }
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(mpPayload),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Erro Mercado Pago:", mpData)
      throw new Error(mpData.message || "Pagamento recusado pelo Mercado Pago.")
    }

    if (paymentMethod === "Cartão de crédito") {
      return new Response(JSON.stringify({
        success: mpData.status === "approved",
        status: mpData.status,
        statusDetail: mpData.status_detail,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const txData = mpData.point_of_interaction?.transaction_data
    if (!txData) throw new Error("Mercado Pago não retornou o QR Code do PIX.")

    return new Response(JSON.stringify({
      pixPayload: txData.qr_code,
      pixQrCode: `data:image/png;base64,${txData.qr_code_base64}`,
      paymentId: mpData.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})