import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Verifica autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { date_filter, custom_date } = await req.json()
    
    let query = supabase
      .from('visit_fingerprints')
      .select('id, original_ip, country_code, city, country_name, user_agent, created_at')
      .order('created_at', { ascending: false })
    
    // Aplica filtros de data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    switch (date_filter) {
      case 'today':
        query = query.gte('created_at', today.toISOString())
        break
      case 'yesterday':
        query = query
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString())
        break
      case 'custom':
        if (custom_date) {
          const customDate = new Date(custom_date)
          const nextDay = new Date(customDate)
          nextDay.setDate(nextDay.getDate() + 1)
          query = query
            .gte('created_at', customDate.toISOString())
            .lt('created_at', nextDay.toISOString())
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

    // Mapeia o resultado para manter a compatibilidade com o frontend
    const mappedData = data?.map(visit => ({
        ...visit,
        ip_address: visit.original_ip
    })) || [];
    
    return new Response(
      JSON.stringify({ visits: mappedData }),
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