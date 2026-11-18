import { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password — Acme Web Studio',
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink">
            Acme<span className="text-accent">.</span>Web
          </h1>
          <p className="mt-2 text-muted">Reset your password</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}