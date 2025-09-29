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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { session_id, reason, step_where_abandoned } = await req.json()
    
    // Busca a sessão
    const { data: sessionData } = await supabase
      .from('quiz_sessions')
      .select('id, created_at')
      .eq('session_id', session_id)
      .single()
    
    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Calcula tempo gasto
    const sessionStart = new Date(sessionData.created_at)
    const now = new Date()
    const timeSpentMinutes = (now.getTime() - sessionStart.getTime()) / 1000 / 60
    
    // Registra o abandono
    const { error } = await supabase
      .from('quiz_abandonments')
      .insert({
        session_id: sessionData.id,
        reason,
        step_where_abandoned,
        time_spent_minutes: timeSpentMinutes
      })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return new Response(
      JSON.stringify({ success: true }),
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