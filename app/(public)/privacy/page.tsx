import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Privacy Policy — Acme Web Studio',
  description: 'Acme Web Studio privacy policy.',
};

export default function PrivacyPage() {
  return (
    <div className="page-container max-w-3xl py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
      <Card className="mt-8 space-y-8" padding="lg">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">1. Information We Collect</h2>
          <p className="mt-3 leading-relaxed text-muted">
            We collect information you provide directly, such as your name, email address, phone number, and
            company information when you submit an order or contact us.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">2. How We Use Your Information</h2>
          <p className="mt-3 leading-relaxed text-muted">
            We use your information to process your orders, communicate with you about your projects, and improve
            our services. We never sell or share your personal information.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">3. Data Security</h2>
          <p className="mt-3 leading-relaxed text-muted">
            We implement appropriate security measures to protect your personal information against unauthorized
            access, alteration, disclosure, or destruction.
          </p>
        </section>
        <p className="border-t border-line pt-6 text-sm text-subtle">Last updated: October 31, 2026</p>
      </Card>
    </div>
  );
}
