"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export default function ParceirosPage() {
  const [form, setForm] = useState({
    clinic_name: "",
    contact_name: "",
    city: "",
    state: "SP",
    email: "",
    phone: "",
    has_ent_doctor: "",
    notes: "",
    contact_consent: false
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    if (!form.contact_consent) {
      setMessage("É necessário autorizar o contato do Olfato Care para enviar seu interesse.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("partner_clinic_leads").insert({
      clinic_name: form.clinic_name.trim(),
      contact_name: form.contact_name.trim(),
      city: form.city.trim(),
      state: form.state,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      has_ent_doctor:
        form.has_ent_doctor === "yes" ? true :
        form.has_ent_doctor === "no" ? false : null,
      notes: form.notes.trim() || null,
      contact_consent: true,
      status: "new"
    });

    setLoading(false);

    if (error) {
      console.error("Erro ao registrar interesse:", error);
      setMessage("Não foi possível enviar seu cadastro agora. Tente novamente em alguns instantes.");
      return;
    }

    setDone(true);
  }

  return (
    <main className="portal-page">
      <header className="simple-header">
        <a href="/" className="simple-brand">
          <img src="/olfato-care-logo-white.png" alt="Olfato Care" />
        </a>
        <a href="/profissionais" className="back-link">Voltar</a>
      </header>

      <section className="portal-hero partner-lead-page">
        <div className="portal-container narrow">
          <p className="eyebrow">REDE OLFATO CARE</p>
          <h1>Seja uma clínica parceira.</h1>
          <p>
            Cadastre o interesse da sua clínica em fazer parte da futura rede Olfato Care.
            Nossa equipe entrará em contato quando iniciarmos a expansão para sua região.
          </p>

          <section className="partner-lead-card">
            {done ? (
              <div className="partner-lead-success">
                <span className="success-mark">✓</span>
                <h2>Interesse registrado.</h2>
                <p>
                  Obrigado. Seus dados foram recebidos e entraremos em contato quando houver
                  oportunidade de parceria na sua região.
                </p>
                <a className="portal-button" href="/profissionais">Voltar para profissionais</a>
              </div>
            ) : (
              <form onSubmit={submit} className="partner-lead-form">
                <div className="partner-form-grid">
                  <label>
                    <span>Clínica / instituição</span>
                    <input value={form.clinic_name} onChange={(e) => update("clinic_name", e.target.value)} required />
                  </label>

                  <label>
                    <span>Nome do responsável</span>
                    <input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} required />
                  </label>

                  <label>
                    <span>Cidade</span>
                    <input value={form.city} onChange={(e) => update("city", e.target.value)} required />
                  </label>

                  <label>
                    <span>UF</span>
                    <select value={form.state} onChange={(e) => update("state", e.target.value)} required>
                      {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </label>

                  <label>
                    <span>E-mail</span>
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                  </label>

                  <label>
                    <span>WhatsApp</span>
                    <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
                  </label>

                  <label className="partner-form-wide">
                    <span>Possui otorrinolaringologista na equipe?</span>
                    <select value={form.has_ent_doctor} onChange={(e) => update("has_ent_doctor", e.target.value)} required>
                      <option value="">Selecione...</option>
                      <option value="yes">Sim</option>
                      <option value="no">Não</option>
                    </select>
                  </label>

                  <label className="partner-form-wide">
                    <span>Mensagem / observações <small>(opcional)</small></span>
                    <textarea rows="4" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                  </label>
                </div>

                <label className="partner-consent">
                  <input
                    type="checkbox"
                    checked={form.contact_consent}
                    onChange={(e) => update("contact_consent", e.target.checked)}
                    required
                  />
                  <span>Autorizo o Olfato Care a entrar em contato comigo sobre o programa de clínicas parceiras.</span>
                </label>

                {message && <div className="partner-form-error">{message}</div>}

                <button className="portal-button partner-submit" disabled={loading}>
                  {loading ? "Enviando..." : "Cadastrar interesse"}
                </button>
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
