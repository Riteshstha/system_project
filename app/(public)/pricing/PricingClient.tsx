'use client';

import { useState } from 'react';

export default function PricingClient() {
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [selectedHosting, setSelectedHosting] = useState<string | null>(null);
  const [selectedDNS, setSelectedDNS] = useState<string | null>(null);

  const designPackages = [
    { id: 'basic', name: 'Basic website', price: 'NPR 15,000–30,000' },
    { id: 'pro', name: 'Professional website', price: 'NPR 35,000–75,000' },
    { id: 'advanced', name: 'Advanced web application', price: 'NPR 80,000–250,000+' },
  ];

  const hostingPackages = [
    { id: 'starter', name: 'Starter Hosting', price: 'NPR 500/mo' },
    { id: 'business', name: 'Business Hosting', price: 'NPR 1,000/mo' },
    { id: 'business-plus', name: 'Business Plus', price: 'NPR 2,500/mo' },
  ];

  const dnsServices = [
    { id: 'setup', name: 'DNS Setup', price: 'NPR 500–1,000' },
    { id: 'hosting', name: 'Basic DNS Hosting', price: 'NPR 500–1,000/yr' },
  ];

  return (
    <div className="space-y-12">
      {/* 1. Website Design */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-ink">1. Website Design and Development</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {designPackages.map((pkg) => {
            const isSelected = selectedDesign === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedDesign(pkg.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent bg-accent-soft/20'
                    : 'border-line hover:border-line bg-surface'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                <div className="text-xl font-bold text-accent">{pkg.price}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Website Hosting */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-ink">2. Website Hosting</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {hostingPackages.map((pkg) => {
            const isSelected = selectedHosting === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedHosting(isSelected ? null : pkg.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent bg-accent-soft/20'
                    : 'border-line hover:border-line bg-surface'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                <div className="text-xl font-bold text-accent">{pkg.price}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DNS Service */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-ink">3. DNS Service</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {dnsServices.map((pkg) => {
            const isSelected = selectedDNS === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedDNS(isSelected ? null : pkg.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent bg-accent-soft/20'
                    : 'border-line hover:border-line bg-surface'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                <div className="text-xl font-bold text-accent">{pkg.price}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pt-8 border-t border-line">
        <a
          href="/contact"
          className="inline-block bg-ink text-white font-bold text-lg px-12 py-4 rounded-xl hover:bg-ink transition"
        >
          Request for Quote
        </a>
      </section>
    </div>
  );
}
