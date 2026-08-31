export const metadata = {
  title: "Área do paciente | Olfato Care",
  description: "Acesse suas avaliações e resultados Olfato Care."
};

export default function Paciente() {
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
          <p className="eyebrow">Área do paciente</p>
          <h1>Avaliações e resultados em um só lugar.</h1>
          <p>Escolha abaixo o módulo que deseja acessar.</p>

          <div className="portal-grid">
            <article className="portal-card">
              <span className="portal-number">01</span>
              <h2>SNOT-22</h2>
              <p>Acompanhe seus sintomas e sua evolução ao longo do tempo.</p>
              <a className="portal-button" href="https://snot-22.olfatocare.com.br">
                Acessar SNOT-22
              </a>
            </article>

<article className="portal-card">
  <span className="portal-number">02</span>
  <h2>Meu Teste de Olfato</h2>
  <p>Consulte seus testes olfatórios, resultados anteriores e evolução.</p>
  <a
    href="https://teste.olfatocare.com.br"
    className="portal-button"
  >
    Acessar Teste de Olfato
  </a>
</article>
          </div>
        </div>
      </section>
    </main>
  );
}
