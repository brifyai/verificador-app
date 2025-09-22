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
    <>
      {children}
    </>
  );
}