import { Metadata } from 'next';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Terms of Service — Acme Web Studio',
  description: 'Acme Web Studio terms of service and conditions.',
};

export default function TermsPage() {
  return (
    <div className="page-container max-w-3xl py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Terms of Service</h1>
      <Card className="mt-8 space-y-8" padding="lg">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">1. Acceptance of Terms</h2>
          <p className="mt-3 leading-relaxed text-muted">
            By placing an order or using our services, you agree to be bound by these Terms of Service. If you do
            not agree to these terms, please do not use our services.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">2. Services</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Acme Web Studio provides website design, hosting, and DNS management services. All services are subject
            to availability and may require additional configuration or third-party integrations.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">3. Orders and Payments</h2>
          <p className="mt-3 leading-relaxed text-muted">
            When you submit an order, our sales team will contact you to discuss pricing and finalize the project
            scope. Payment terms will be confirmed before work begins. A 50% advance payment is required for
            website design projects.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">4. Intellectual Property</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Upon full payment, all custom design work and code created specifically for your project will be
            transferred to you. Third-party components, libraries, and assets remain subject to their respective
            licenses.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">5. Confidentiality</h2>
          <p className="mt-3 leading-relaxed text-muted">
            We respect your privacy and will not share your personal information with third parties except as
            required to provide our services or as mandated by law.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">6. Limitation of Liability</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Acme Web Studio shall not be liable for any indirect, incidental, or consequential damages arising from
            the use of our services. Our total liability shall not exceed the amount paid by you for the specific
            service giving rise to the claim.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">7. Changes to Terms</h2>
          <p className="mt-3 leading-relaxed text-muted">
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon
            posting to this page. Your continued use of our services after such changes constitutes your
            acceptance of the new terms.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">8. Contact</h2>
          <p className="mt-3 leading-relaxed text-muted">
            If you have any questions about these Terms of Service, please contact us at
            <a href="mailto:admin@acmewebstudio.com" className="ml-1 text-accent hover:underline">
              admin@acmewebstudio.com
            </a>
            .
          </p>
        </section>
        <p className="border-t border-line pt-6 text-sm text-subtle">Last updated: October 31, 2026</p>
      </Card>
    </div>
  );
}
