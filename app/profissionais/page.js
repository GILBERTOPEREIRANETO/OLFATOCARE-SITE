export const metadata = {
  title: "Profissionais | Olfato Care",
  description: "Acesse o painel profissional ou conheça o credenciamento de parceiros Olfato Care."
};

export default function Profissionais() {
  return (
    <main className="portal-page">
      <header className="simple-header">
        <a href="/" className="simple-brand">
          <img src="/olfato-care-logo-white.png" alt="Olfato Care" />
        </a>
        <a href="/" className="back-link">Voltar ao site</a>
      </header>

      <section className="portal-hero">
        <div className="portal-container">
          <p className="eyebrow">Área profissional</p>
          <h1>Olfato Care para profissionais.</h1>
          <p>
            Uma estrutura especializada para avaliação e acompanhamento das alterações do olfato,
            conectando pacientes, profissionais e unidades credenciadas.
          </p>

          <div className="portal-grid professional-options">
            <article className="portal-card professional-option-card">
              <span className="portal-number">01</span>
              <h2>Painel profissional</h2>
              <p>
                Localize pacientes, consulte o histórico de testes e libere novas avaliações olfatórias.
              </p>
              <a
                className="portal-button"
                href="https://olfatocare-teste.vercel.app/equipe"
              >
                Acessar painel profissional
              </a>
            </article>

            <article className="portal-card professional-option-card">
              <span className="portal-number">02</span>
              <h2>Seja um profissional parceiro</h2>
              <p>
                Faça parte da rede Olfato Care e ofereça avaliação e acompanhamento especializado em sua região.
              </p>
              <div className="professional-interest">
                <strong>Credenciamento em preparação</strong>
                <span>Em breve disponibilizaremos o cadastro de interesse para novos parceiros.</span>
              </div>
            </article>
          </div>

          <div className="professional-note">
            <strong>O painel profissional é de uso restrito.</strong>
            <span>O acesso depende de cadastro e permissão previamente liberados pela equipe Olfato Care.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
