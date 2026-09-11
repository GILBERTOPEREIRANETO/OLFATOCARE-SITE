import { CalendarDays, FileText, MapPin, Phone, ArrowRight, MessageCircle } from 'lucide-react'

const RESULT_URL = 'https://laudos.institutodosonojundiai.com.br/paciente'
const PHONE_DISPLAY = '(11) 4522-1700'
const PHONE_WA = '551145221700'
const ADDRESS = 'Rua Major Gustavo Adolfo Storch, 125, Sala 101, Vila Virgínia, Jundiaí - SP, 13209-080'

function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <img
      className={footer ? 'official-logo official-logo-footer' : 'official-logo'}
      src="/logo-isj-moss.png"
      alt="Instituto do Sono Jundiaí"
    />
  )
}

export default function Home() {
  const whatsapp = `https://wa.me/${PHONE_WA}?text=${encodeURIComponent('Olá! Gostaria de agendar um exame no Instituto do Sono Jundiaí.')}`
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

  return (
    <main>
      <section className="hero-shell">
        <div className="topbar">
          <Logo />
          <div className="tagline">Sono hoje.<br/>Mais vida amanhã.</div>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">INSTITUTO DO SONO JUNDIAÍ</p>
            <h1>Seu sono<br/>em boas mãos</h1>
            <p className="lead">Diagnóstico preciso e acompanhamento especializado para uma vida mais saudável.</p>

            <div className="cta-grid">
              <a className="cta cta-primary" href={whatsapp} target="_blank" rel="noreferrer">
                <CalendarDays size={30} strokeWidth={1.8}/>
                <span>
                  <strong>Agendar meu exame</strong>
                  <small>Fale com nossa equipe pelo WhatsApp.</small>
                </span>
                <ArrowRight size={28} />
              </a>

              <a className="cta cta-secondary" href={RESULT_URL}>
                <FileText size={30} strokeWidth={1.8}/>
                <span>
                  <strong>Acessar meu resultado</strong>
                  <small>Consulte seu laudo de forma segura e rápida.</small>
                </span>
                <ArrowRight size={28} />
              </a>
            </div>
          </div>

          <div className="hero-photo" role="img" aria-label="Pessoa dormindo tranquilamente">
            <div className="soft-overlay" />
          </div>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-line" />
        <p>Dormir bem é viver melhor.</p>
        <div className="quote-line" />
      </section>

      <section className="contact-strip">
        <a className="contact-card" href={whatsapp} target="_blank" rel="noreferrer">
          <div className="contact-icon"><Phone size={28}/></div>
          <div>
            <h2>Agendamentos</h2>
            <strong>{PHONE_DISPLAY}</strong>
            <p>Atendimento pelo telefone ou WhatsApp.</p>
          </div>
          <MessageCircle size={24}/>
        </a>

        <a className="contact-card" href={maps} target="_blank" rel="noreferrer">
          <div className="contact-icon"><MapPin size={28}/></div>
          <div>
            <h2>Endereço</h2>
            <strong>Rua Major Gustavo Adolfo Storch, 125</strong>
            <p>Sala 101 • Vila Virgínia • Jundiaí/SP • CEP 13209-080</p>
          </div>
        </a>

        <a className="contact-card" href={RESULT_URL}>
          <div className="contact-icon"><FileText size={28}/></div>
          <div>
            <h2>Resultado do exame</h2>
            <strong>Acesso online</strong>
            <p>Use o código entregue no protocolo para consultar seu laudo.</p>
          </div>
        </a>
      </section>

      <footer className="footer">
        <div className="footer-logo"><Logo footer /></div>
        <div className="footer-copy">Qualidade de sono para uma vida melhor.</div>
        <div className="footer-meta">© 2026 Instituto do Sono Jundiaí.<br/>Todos os direitos reservados.</div>
      </footer>
    </main>
  )
}
