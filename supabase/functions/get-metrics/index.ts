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
    const { date_filter, custom_date } = await req.json();

    // Usar a chave de serviço para ter permissões de administrador e ignorar RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase.from('quiz_events').select('id, event_type');
    let abandonmentQuery = supabase.from('quiz_abandonments').select('*');
    let salesQuery = supabase.from('sales').select('id, product_value'); // Adicionado product_value

    // Aplica filtros de data
    if (date_filter && date_filter !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (date_filter === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (date_filter === 'yesterday') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (date_filter === 'custom' && custom_date) {
        startDate = new Date(custom_date);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      }

      if (startDate && endDate) {
        query = query.gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString());
        abandonmentQuery = abandonmentQuery.gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString());
        salesQuery = salesQuery.gte('purchase_date', startDate.toISOString()).lt('purchase_date', endDate.toISOString()); 
      }
    }

    const { data: events } = await query;
    const { data: abandonments } = await abandonmentQuery;
    const { data: sales } = await salesQuery; 

    const getCount = (type: string) => events?.filter(e => e.event_type === type).length || 0;

    const visitCount = getCount('visit');
    const quizStartCount = getCount('quiz_start');
    const leadCount = getCount('lead_submit');
    const quizCompleteCount = getCount('quiz_complete');
    const checkoutStartCount = getCount('checkout_start');
    const totalSalesCount = sales?.length || 0; 
    const totalSalesValue = sales?.reduce((sum, sale) => sum + (sale.product_value || 0), 0) || 0; // Calcula o valor total

    const visitToQuizStart = visitCount > 0 ? Math.round((quizStartCount / visitCount) * 100) : 0;
    const quizStartToLead = quizStartCount > 0 ? Math.round((leadCount / quizStartCount) * 100) : 0;
    const leadToQuizComplete = leadCount > 0 ? Math.round((quizCompleteCount / leadCount) * 100) : 0;
    const quizCompleteToCheckout = quizCompleteCount > 0 ? Math.round((checkoutStartCount / quizCompleteCount) * 100) : 0;
    const salesConversionFromLeads = leadCount > 0 ? Math.round((totalSalesCount / leadCount) * 100) : 0; 

    const abandonmentByStep: { [key: string]: { abandoned_count: number } } = {};
    if (abandonments) {
      abandonments.forEach((abandonment: any) => {
        const step = abandonment.step_where_abandoned;
        if (!abandonmentByStep[step]) {
          abandonmentByStep[step] = { abandoned_count: 0 };
        }
        abandonmentByStep[step].abandoned_count += 1;
      });
    }

    const metrics = {
      total_visits: visitCount,
      total_quiz_starts: quizStartCount,
      total_leads: leadCount,
      total_quiz_complete: quizCompleteCount,
      total_checkout_starts: checkoutStartCount,
      total_sales: totalSalesCount, 
      total_sales_value: totalSalesValue, // Adicionado o valor total de vendas
      conversion_rates: {
        visit_to_quiz_start: visitToQuizStart,
        quiz_start_to_lead: quizStartToLead,
        lead_to_quiz_complete: leadToQuizComplete,
        quiz_complete_to_checkout: quizCompleteToCheckout,
        sales_conversion_from_leads: salesConversionFromLeads, 
      },
      abandonment_by_step: abandonmentByStep,
      funnel_data: [
        { step: 'Visitas', count: visitCount, percentage: 100 },
        { step: 'Quiz Iniciado', count: quizStartCount, percentage: visitToQuizStart },
        { step: 'Leads Gerados', count: leadCount, percentage: quizStartToLead },
        { step: 'Quiz Completo', count: quizCompleteCount, percentage: leadToQuizComplete },
        { step: 'Checkout Iniciado', count: checkoutStartCount, percentage: quizCompleteToCheckout },
      ],
      total_abandonments: abandonments?.length || 0,
      abandonment_rate: quizStartCount > 0 ? Math.round(((abandonments?.length || 0) / quizStartCount) * 100) : 0,
    };
    
    return new Response(
      JSON.stringify(metrics),
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