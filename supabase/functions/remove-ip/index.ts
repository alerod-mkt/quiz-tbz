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
    // Verifica se um cabeçalho de autorização foi enviado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized: Missing Authorization header', { status: 401, headers: corsHeaders })
    }

    // Cria um cliente Supabase com a chave de serviço para ter permissões de administrador
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usa a chave de serviço para ignorar RLS
    )
    
    const { ip_address } = await req.json()
    
    if (!ip_address) {
      return new Response(
        JSON.stringify({ error: "IP address is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Remove APENAS o cooldown do IP (não as métricas históricas)
    const { error: cooldownError } = await supabase
      .from('visit_cooldowns')
      .delete()
      .eq('ip_address', ip_address)
    
    if (cooldownError) {
      throw new Error(`Error removing cooldown: ${cooldownError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cooldown removido para o IP ${ip_address}. Você pode visitar novamente.`,
        ip_address: ip_address
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: unknown) {
    console.error("Error in remove-ip function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})