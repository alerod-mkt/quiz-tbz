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
    // Usar a chave de serviço para ter permissões de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // A ordem é importante para evitar problemas com chaves estrangeiras
    await supabaseAdmin.from('quiz_abandonments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('quiz_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('quiz_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('quiz_visits').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return new Response(
      JSON.stringify({ success: true, message: 'Todas as métricas foram limpas com sucesso.' }),
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