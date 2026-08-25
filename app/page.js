const conditions = [
  { title: "Anosmia", text: "Ausência do olfato.", icon: "∅" },
  { title: "Hiposmia", text: "Redução da capacidade de sentir cheiros.", icon: "↓" },
  { title: "Parosmia", text: "Percepção distorcida dos odores.", icon: "≈" },
  { title: "Fantosmia", text: "Percepção de odores que não estão presentes.", icon: "◌" },
];

const steps = [
  ["01", "Avaliação médica especializada", "Investigamos início, evolução, sintomas associados, doenças prévias, medicamentos e tratamentos já realizados."],
  ["02", "Teste objetivo do olfato", "A função olfatória é avaliada por teste padronizado para mensurar a alteração e criar uma referência objetiva para o acompanhamento."],
  ["03", "Investigação complementar", "Quando necessário, solicitamos exames complementares para investigar possíveis causas e compreender melhor as vias nasais e olfatórias."],
  ["04", "Tratamento individualizado", "A partir dos achados, definimos estratégias terapêuticas individualizadas, que podem incluir treinamento olfatório e outras modalidades quando indicadas."],
  ["05", "Acompanhamento da evolução", "Monitoramos sintomas, adesão e evolução ao longo do tratamento com instrumentos estruturados."],
  ["06", "Reavaliação objetiva", "Quando indicado, repetimos avaliações para comparar resultados e orientar os próximos passos."],
];

const pillars = [
  ["Avaliar", "Entender a história, o contexto clínico e as possíveis causas."],
  ["Medir", "Mensurar a função olfatória e acompanhar a evolução objetivamente."],
  ["Tratar", "Definir estratégias individualizadas e baseadas na melhor evidência disponível."],
  ["Acompanhar", "Registrar a evolução e ajustar a estratégia ao longo do cuidado."],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav">
          <a href="#top" className="brand" aria-label="Olfato Care">
            <img src="/olfato-care-logo-white.png" alt="Olfato Care" />
          </a>

          <div className="program-label">
            Programa especializado<br />em saúde olfatória
          </div>

          <nav className="menu">
            <a href="#alteracoes">Alterações do olfato</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#acompanhamento">Acompanhamento</a>
            <a href="#sobre">Sobre</a>
          </nav>

          <a className="patient-area desktop-patient" href="https://snot-22.olfatocare.com.br">
            <span className="patient-icon">◯</span>
            <span><strong>Área do paciente</strong><small>Acesse seu acompanhamento</small></span>
          </a>

          <div className="mobile-actions">
            <a className="mobile-patient" href="https://snot-22.olfatocare.com.br">
              Área do paciente
            </a>

            <details className="mobile-menu">
              <summary aria-label="Abrir menu">
                <span></span><span></span><span></span>
              </summary>
              <nav>
                <a href="#alteracoes">Alterações do olfato</a>
                <a href="#como-funciona">Como funciona</a>
                <a href="#acompanhamento">Acompanhamento</a>
                <a href="#sobre">Sobre</a>
                <a href="#contato">Agendar avaliação</a>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="kicker">Seu olfato mudou?</p>
            <h1>
              Nós ajudamos a entender por quê
              <span>— e o que pode ser feito.</span>
            </h1>
            <div className="short-line" />
            <p className="hero-text">
              Programa especializado em saúde olfatória com avaliação médica,
              teste objetivo do olfato, investigação complementar e tratamento individualizado.
            </p>

            <div className="pillars-inline">
              {pillars.map(([title]) => (
                <div key={title}>
                  <span className="pillar-icon">{title === "Avaliar" ? "✚" : title === "Medir" ? "✓" : title === "Tratar" ? "✦" : "↗"}</span>
                  <strong>{title}</strong>
                </div>
              ))}
            </div>

            <div className="hero-actions">
              <a className="button primary" href="#contato">Agende sua avaliação</a>
              <a className="button secondary" href="#como-funciona">Como funciona o programa</a>
            </div>
          </div>

          <div className="hero-photo">
            <img src="/hero-olfato-care.jpg" alt="Pessoa percebendo o aroma de uma flor" />
          </div>
        </div>
      </section>

      <section className="section alterations" id="alteracoes">
        <div className="container">
          <div className="section-title centered">
            <p className="eyebrow">Alterações do olfato</p>
            <h2>Quando o olfato muda, a qualidade de vida também muda.</h2>
            <p>
              As alterações do olfato podem impactar alimentação, percepção de sabores,
              segurança, memória, prazer e bem-estar.
            </p>
          </div>

          <div className="condition-grid">
            {conditions.map((item) => (
              <article className="condition-card" key={item.title}>
                <div className="condition-symbol">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="statement">
            Por isso, o primeiro passo não é simplesmente começar um tratamento:
            <strong> é compreender o problema.</strong>
          </p>
        </div>
      </section>

      <section className="section soft" id="como-funciona">
        <div className="container">
          <div className="section-title centered">
            <p className="eyebrow">Como funciona o Olfato Care</p>
            <h2>Avaliar. Medir. Tratar. Acompanhar.</h2>
            <p>Uma jornada estruturada, do diagnóstico ao acompanhamento da evolução.</p>
          </div>

          <div className="steps-grid mobile-steps">
            {steps.map(([n, title, text]) => (
              <article className="step-card" key={n}>
                <span className="step-number">{n}</span>
                <div className="step-mark" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      
      <section className="section" id="acompanhamento">
        <div className="container evolution-single">
          <div className="section-title evolution-title">
            <p className="eyebrow">Evolução que se mede</p>
            <h2>Sua evolução é acompanhada com dados.</h2>
            <p>
              A percepção do paciente é importante, mas não precisa ser a única referência.
              Durante o acompanhamento, combinamos instrumentos estruturados e avaliações
              objetivas para observar a evolução ao longo do cuidado.
            </p>
          </div>

          <div className="evolution-tools">
            <article>
              <span className="tool-icon">01</span>
              <div>
                <h3>Teste olfatório</h3>
                <p>Mensuração objetiva da função olfatória e reavaliação quando indicada.</p>
              </div>
            </article>

            <article>
              <span className="tool-icon">02</span>
              <div>
                <h3>SNOT-22</h3>
                <p>Acompanhamento do impacto dos sintomas nasossinusais e da qualidade de vida.</p>
              </div>
            </article>

            <article>
              <span className="tool-icon">03</span>
              <div>
                <h3>Histórico de evolução</h3>
                <p>Comparação dos resultados registrados ao longo do tratamento.</p>
              </div>
            </article>
          </div>

          <p className="evolution-note">
            Cada evolução é individual. Os dados ajudam a orientar decisões clínicas e os próximos passos.
          </p>
        </div>
      </section>


      <section className="section" id="sobre">
        <div className="container about-grid">
          <div className="about-panel">
            <img src="/olfato-care-logo-white.png" alt="Olfato Care" />
            <p>Avaliar. Medir. Tratar. Acompanhar.</p>
          </div>
          <div>
            <p className="eyebrow">Ciência e cuidado estruturado</p>
            <h2>Medicina, ciência e acompanhamento individualizado.</h2>
            <p className="body-text">
              O Olfato Care foi desenvolvido para oferecer uma abordagem estruturada às
              alterações do olfato, integrando avaliação médica, mensuração objetiva da função olfatória,
              investigação complementar, tratamento individualizado e acompanhamento da evolução.
            </p>
          </div>
        </div>
      </section>

      <section className="cta" id="contato">
        <div className="container cta-grid">
          <div>
            <p className="eyebrow light-eyebrow">Seu olfato mudou?</p>
            <h2>O primeiro passo é descobrir o que está acontecendo.</h2>
            <p>A indicação e o tratamento são definidos individualmente após avaliação médica.</p>
          </div>
          <a className="button white-button" href="#">Agendar uma avaliação</a>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <img src="/olfato-care-logo-white.png" alt="Olfato Care" />
          <p>Avaliar. Medir. Tratar. Acompanhar.</p>
          <a href="https://snot-22.olfatocare.com.br">Área do paciente</a>
        </div>
      </footer>
    </main>
  );
}
