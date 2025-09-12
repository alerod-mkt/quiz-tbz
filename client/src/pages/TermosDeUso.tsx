import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermosDeUso() {
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
            Termos de Uso
          </h1>
          <p className="text-muted-foreground">
            Última atualização: Setembro de 2024
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar e usar os serviços da O Reino 360, você concorda em cumprir e estar vinculado aos seguintes termos e condições. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descrição dos Serviços</h2>
            <p className="mb-4">
              A O Reino 360 oferece conteúdos, diagnósticos e materiais educacionais relacionados a relacionamentos familiares e conjugais. Nossos serviços incluem:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Diagnósticos online sobre dinâmica familiar</li>
              <li>Conteúdos educacionais em vídeo</li>
              <li>Materiais de apoio e orientação</li>
              <li>Acesso a plataformas de aprendizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Uso Aceitável</h2>
            <p className="mb-4">
              Você concorda em usar nossos serviços apenas para fins legais e de acordo com estes Termos. É proibido:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Compartilhar credenciais de acesso com terceiros</li>
              <li>Reproduzir, distribuir ou revender nosso conteúdo sem autorização</li>
              <li>Usar os serviços para fins ilegais ou não autorizados</li>
              <li>Tentar acessar áreas restritas de nossa plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Propriedade Intelectual</h2>
            <p className="mb-4">
              Todo o conteúdo disponibilizado pela O Reino 360, incluindo mas não se limitando a textos, vídeos, áudios, imagens e logos, é de propriedade exclusiva da empresa e está protegido por leis de direitos autorais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Limitação de Responsabilidade</h2>
            <p className="mb-4">
              Os conteúdos oferecidos pela O Reino 360 têm caráter educacional e não substituem acompanhamento psicológico, terapêutico ou médico profissional. Em casos de situações graves, recomendamos buscar ajuda especializada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Modificações dos Termos</h2>
            <p className="mb-4">
              A O Reino 360 reserva-se o direito de modificar estes termos a qualquer momento. As alterações serão comunicadas através de nossa plataforma e entrarão em vigor imediatamente após sua publicação.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contato</h2>
            <p className="mb-4">
              Para questões relacionadas aos Termos de Uso, entre em contato conosco através dos canais oficiais da O Reino 360.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}