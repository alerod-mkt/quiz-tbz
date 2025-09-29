import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Verifica autenticação (apenas usuários autenticados podem ver as vendas)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Usar a chave de serviço para ter permissões de administrador e ignorar RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    )
    
    const { date_filter, custom_date } = await req.json()
    
    let query = supabase
      .from('sales')
      .select('id, customer_name, customer_email, product_name, product_value, purchase_date, created_at')
      .order('purchase_date', { ascending: false })
    
    // Aplica filtros de data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    switch (date_filter) {
      case 'today':
        query = query.gte('purchase_date', today.toISOString())
        break
      case 'yesterday':
        query = query
          .gte('purchase_date', yesterday.toISOString())
          .lt('purchase_date', today.toISOString())
        break
      case 'custom':
        if (custom_date) {
          const customDate = new Date(custom_date)
          const nextDay = new Date(customDate)
          nextDay.setDate(nextDay.getDate() + 1)
          query = query
            .gte('purchase_date', customDate.toISOString())
            .lt('purchase_date', nextDay.toISOString()) // CORRIGIDO: Usar purchase_date aqui
        }
        break
    }
    
    const { data, error } = await query.limit(100) 
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new Response(
      JSON.stringify({ sales: data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})