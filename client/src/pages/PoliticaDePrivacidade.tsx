import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PoliticaDePrivacidade() {
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
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground">
            Última atualização: Setembro de 2024
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
            <p className="mb-4">
              A O Reino 360 coleta informações que você nos fornece diretamente, como:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Nome, email e informações de contato</li>
              <li>Respostas aos diagnósticos e questionários</li>
              <li>Informações de pagamento (processadas por terceiros seguros)</li>
              <li>Dados de uso e navegação em nossa plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Como Usamos suas Informações</h2>
            <p className="mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Personalizar sua experiência de aprendizado</li>
              <li>Processar pagamentos e gerenciar sua conta</li>
              <li>Enviar comunicações importantes sobre os serviços</li>
              <li>Realizar análises para melhorar nossa plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
            <p className="mb-4">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Com provedores de serviços que nos auxiliam na operação da plataforma</li>
              <li>Quando exigido por lei ou processo legal</li>
              <li>Para proteger nossos direitos e segurança</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Segurança dos Dados</h2>
            <p className="mb-4">
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos</h2>
            <p className="mb-4">
              Você tem o direito de:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Acessar suas informações pessoais</li>
              <li>Solicitar correção de dados incorretos</li>
              <li>Solicitar exclusão de suas informações</li>
              <li>Optar por não receber comunicações de marketing</li>
              <li>Portabilidade de seus dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
            <p className="mb-4">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso de nossa plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="mb-4">
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, ou conforme exigido por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Alterações na Política</h2>
            <p className="mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas através de nossa plataforma ou por email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contato</h2>
            <p className="mb-4">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato conosco através dos canais oficiais da O Reino 360.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}