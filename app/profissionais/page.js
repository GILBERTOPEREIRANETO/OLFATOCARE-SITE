export const metadata = {
  title: "Credenciamento de profissionais | Olfato Care",
  description: "Conheça o credenciamento de otorrinolaringologistas parceiros Olfato Care."
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
        <div className="portal-container narrow">
          <p className="eyebrow">Credenciamento de parceiros</p>
          <h1>Olfato Care para otorrinolaringologistas.</h1>
          <p>
            Estamos estruturando uma rede de profissionais parceiros para ampliar o acesso
            à avaliação e ao acompanhamento das alterações do olfato em diferentes cidades.
          </p>

          <div className="professional-card">
            <h2>Quem pode ter interesse?</h2>
            <p>Otorrinolaringologistas e clínicas que desejem incorporar uma jornada estruturada de avaliação, mensuração e acompanhamento da função olfatória.</p>

            <h2>O que estamos desenvolvendo?</h2>
            <p>Padronização da jornada Olfato Care, ferramentas digitais, acompanhamento de resultados e integração com profissionais locais.</p>

            <div className="coming-soon-box">
              <strong>Cadastro de interesse</strong>
              <span>O formulário de credenciamento será disponibilizado em breve.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
