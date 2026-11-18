import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Failed — Acme Web Studio',
};

export default function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-ink">Payment Not Completed</h1>
        <p className="mt-3 text-muted">
          Your payment could not be processed. Your order has been saved and our team will reach out to help you complete it.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/pricing"
            className="inline-block bg-accent text-white font-semibold px-6 py-3 rounded-lg hover:bg-accent/90"
          >
            Try Again
          </Link>
          <Link
            href="/contact"
            className="inline-block border border-line text-ink font-semibold px-6 py-3 rounded-lg hover:bg-canvas"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}