export const metadata = {
  title: "Agendar avaliação | Olfato Care",
  description: "Escolha a cidade e encontre uma clínica credenciada Olfato Care."
};

const cities = [
  {
    city: "Jundiaí",
    clinics: [
      {
        name: "OTO.COM",
        address: "Rua Anchieta, 620",
        phone: "(11) 4522-1700",
        phoneHref: "tel:+551145221700"
      }
    ]
  }
];

export default function Agendar() {
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
          <p className="eyebrow">Agendar uma avaliação</p>
          <h1>Onde você quer ser atendido?</h1>
          <p>Escolha a cidade para visualizar as clínicas credenciadas com o sistema Olfato Care.</p>

          <div className="city-list">
            {cities.map((item) => (
              <details className="city-card" key={item.city} open>
                <summary>
                  <span>{item.city}</span>
                  <small>Ver clínicas credenciadas</small>
                </summary>

                <div className="clinic-list">
                  {item.clinics.map((clinic) => (
                    <article className="clinic-card" key={clinic.name}>
                      <div>
                        <span className="clinic-label">Clínica credenciada</span>
                        <h2>{clinic.name}</h2>
                        <p><strong>Endereço:</strong> {clinic.address}</p>
                        <p><strong>Telefone:</strong> {clinic.phone}</p>
                      </div>
                      <a className="portal-button" href={clinic.phoneHref}>Ligar para a clínica</a>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="partner-box">
            <p className="eyebrow">Para otorrinolaringologistas</p>
            <h2>Quer levar o Olfato Care para sua cidade?</h2>
            <p>Estamos estruturando o credenciamento de profissionais e parceiros em diferentes regiões do Brasil.</p>
            <a className="portal-button secondary-portal" href="/profissionais">
              Conhecer o credenciamento
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
