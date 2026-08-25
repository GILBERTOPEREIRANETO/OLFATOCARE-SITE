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

          <a className="patient-area" href="https://snot-22.olfatocare.com.br">
            <span className="patient-icon">◯</span>
            <span><strong>Área do paciente</strong><small>Acesse seu acompanhamento</small></span>
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="kicker">Seu olfato mudou?</p>
            <h1>
              Nós ajudamos a entender por quê —
              <span> e o que pode ser feito.</span>
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

          <div className="steps-grid">
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
        <div className="container tracking-grid">
          <div className="tracking-copy">
            <p className="eyebrow">Evolução que se mede</p>
            <h2>Não queremos apenas saber se você “acha que melhorou”.</h2>
            <p>
              A percepção do paciente é essencial, mas pode ser combinada com
              instrumentos estruturados de acompanhamento e avaliações objetivas da função olfatória.
            </p>

            <div className="tracking-items">
              <div><b>Teste olfatório</b><span>Avaliação objetiva da função olfatória.</span></div>
              <div><b>SNOT-22</b><span>Acompanhamento do impacto dos sintomas nasossinusais e na qualidade de vida.</span></div>
              <div><b>Histórico de evolução</b><span>Resultados registrados ao longo do tempo para facilitar comparações.</span></div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <strong>Exemplo de evolução</strong>
              <span>90 dias</span>
            </div>
            <svg viewBox="0 0 620 300" role="img" aria-label="Exemplo ilustrativo de evolução">
              {[65,120,175,230].map((y) => (
                <line key={y} x1="54" y1={y} x2="584" y2={y} stroke="#e7edf4" />
              ))}
              <polyline points="70,86 230,128 395,178 555,220" fill="none" stroke="#0d57ad" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {[
                [70,86,"78","Início"],
                [230,128,"62","30 dias"],
                [395,178,"41","60 dias"],
                [555,220,"24","90 dias"]
              ].map(([x,y,val,label]) => (
                <g key={label}>
                  <circle cx={x} cy={y} r="7" fill="#0d57ad" />
                  <text x={x} y={y-14} textAnchor="middle" fontWeight="700" fill="#12304d">{val}</text>
                  <text x={x} y="272" textAnchor="middle" fontSize="12" fill="#6e7f91">{label}</text>
                </g>
              ))}
            </svg>
            <small>* Exemplo ilustrativo. A evolução varia de pessoa para pessoa.</small>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container pillar-cards">
          {pillars.map(([title, text]) => (
            <article key={title}>
              <span className="blue-dot" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="sobre">
        <div className="container about-grid">
          <div className="about-panel">
            <img src="/olfato-care-logo-white.png" alt="Olfato Care" />
            <p>Avaliar. Medir. Tratar. Acompanhar.</p>
          </div>
          <div>
            <p className="eyebrow">Quem está por trás do Olfato Care</p>
            <h2>Medicina, ciência e acompanhamento individualizado.</h2>
            <p className="body-text">
              O Olfato Care foi desenvolvido para oferecer uma abordagem estruturada às
              alterações do olfato, integrando avaliação médica, mensuração objetiva,
              investigação complementar, tratamento e acompanhamento da evolução.
            </p>
            <p className="doctor"><strong>Dr. Gilberto Luiz Pereira da Silva Neto</strong><br/>Médico otorrinolaringologista</p>
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
