import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OndaVerificada - Acceso al Sistema',
  description: 'Acceso al sistema de verificación de anuncios publicitarios en radios',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <h1 className="text-3xl font-bold text-white">OndaVerificada</h1>
      </div>
      {children}
    </section>
  );
}