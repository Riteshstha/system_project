import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Successful — Acme Web Studio',
};

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-ink">Payment Successful</h1>
        <p className="mt-3 text-muted">
          Thank you! Your advance payment has been received. Our team will review your order and begin the design process shortly.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/pricing"
            className="inline-block bg-accent text-white font-semibold px-6 py-3 rounded-lg hover:bg-accent/90"
          >
            Back to Pricing
          </Link>
          <p className="text-sm text-subtle">
            You will receive an email confirmation at the address you provided.
          </p>
        </div>
      </div>
    </main>
  );
}