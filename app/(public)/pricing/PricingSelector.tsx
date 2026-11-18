'use client';

import { useState } from 'react';

export default function PricingSelector({ children }: { children: React.ReactNode }) {
  // This component simply wraps the pricing cards to enable selection interactivity.
  // We use event delegation or direct props to manage state.
  return <div className="pricing-container">{children}</div>;
}
