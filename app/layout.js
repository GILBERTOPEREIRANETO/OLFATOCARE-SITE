import "./globals.css";

export const metadata = {
  title: "Olfato Care | Saúde Olfatória",
  description:
    "Avaliação médica especializada, teste objetivo do olfato, investigação complementar, tratamento individualizado e acompanhamento da evolução."
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
