import './globals.css';

export const metadata = {
  title: 'ISJ Laudos',
  description: 'Workflow de laudos do Instituto do Sono Jundiaí',
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
