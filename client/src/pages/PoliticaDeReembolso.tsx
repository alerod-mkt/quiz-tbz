import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PoliticaDeReembolso() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-200 mb-6"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Link>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Política de Reembolso
          </h1>
          <p className="text-muted-foreground">
            Última atualização: Setembro de 2024
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Garantia de Satisfação</h2>
            <p className="mb-4">
              A O Reino 360 oferece uma garantia de 7 dias para todos os seus produtos digitais. Se você não estiver completamente satisfeito com sua compra, pode solicitar reembolso integral dentro deste prazo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Condições para Reembolso</h2>
            <p className="mb-4">
              Para ser elegível ao reembolso, as seguintes condições devem ser atendidas:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Solicitação deve ser feita dentro de 7 dias corridos após a compra</li>
              <li>O acesso ao conteúdo deve ter sido menor que 30% do material total</li>
              <li>Não deve ter concluído questionários ou diagnósticos principais</li>
              <li>Deve apresentar motivo válido para insatisfação</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Como Solicitar Reembolso</h2>
            <p className="mb-4">
              Para solicitar reembolso, siga estes passos:
            </p>
            <ol className="list-decimal pl-6 mb-4">
              <li>Entre em contato através dos canais oficiais da O Reino 360</li>
              <li>Informe seu nome completo e email usado na compra</li>
              <li>Forneça o motivo da solicitação de reembolso</li>
              <li>Aguarde análise em até 2 dias úteis</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Processamento do Reembolso</h2>
            <p className="mb-4">
              Após aprovação da solicitação:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>O reembolso será processado em até 5 dias úteis</li>
              <li>O valor será estornado na mesma forma de pagamento utilizada</li>
              <li>Para cartão de crédito: pode levar de 1 a 2 faturas para aparecer</li>
              <li>Para PIX/transferência: processamento em até 3 dias úteis</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Situações que NÃO Garantem Reembolso</h2>
            <p className="mb-4">
              O reembolso não será concedido nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Solicitações feitas após o prazo de 7 dias</li>
              <li>Uso extensivo do conteúdo (mais de 30%)</li>
              <li>Conclusão de diagnósticos ou questionários principais</li>
              <li>Motivos não relacionados à qualidade do produto</li>
              <li>Problemas técnicos solucionáveis pelo suporte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cancelamento de Acesso</h2>
            <p className="mb-4">
              Após a aprovação do reembolso, o acesso aos conteúdos será imediatamente cancelado. Não será possível recuperar o acesso mesmo com nova compra por 30 dias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Produtos em Promoção</h2>
            <p className="mb-4">
              Produtos adquiridos durante promoções especiais ou com desconto superior a 50% estão sujeitos às mesmas condições de reembolso, porém o prazo é reduzido para 3 dias corridos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contato para Reembolso</h2>
            <p className="mb-4">
              Para solicitar reembolso ou esclarecer dúvidas sobre esta política, entre em contato através dos canais oficiais da O Reino 360. Nossa equipe de suporte estará disponível para auxiliá-lo durante todo o processo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}