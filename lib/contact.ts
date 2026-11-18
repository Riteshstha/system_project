/**
 * Contact information configuration.
 * Single source of truth for all contact details across the site.
 * Update this file to change contact info everywhere.
 */

export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface ContactConfig {
  team: TeamMember[];
  company: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    workingHours: string;
    timezone: string;
  };
  social?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    facebook?: string;
  };
}

export const contactConfig: ContactConfig = {
  team: [
    {
      name: 'Pratyush Khadka',
      role: 'Founder & Lead Developer',
      phone: '+977 9841 234 567',
      email: 'pratyush@acmewebstudio.com',
    },
    {
      name: 'Samar Koirala',
      role: 'Project Manager',
      phone: '+977 9812 345 678',
      email: 'samar@acmewebstudio.com',
    },
  ],
  company: {
    email: 'hello@acmewebstudio.com',
    phone: '+977 1 4000000',
    address: 'Durbar Marg',
    city: 'Kathmandu',
    country: 'Nepal',
    workingHours: 'Sun–Fri, 10:00 AM – 6:00 PM (NPT)',
    timezone: 'Asia/Kathmandu (UTC+5:45)',
  },
  social: {
    linkedin: 'https://linkedin.com/company/acmewebstudio',
    twitter: 'https://twitter.com/acmewebstudio',
    github: 'https://github.com/acmewebstudio',
  },
};

// Helper to get mailto: link
export function getMailto(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  const query = params.toString() ? `?${params.toString()}` : '';
  return `mailto:${email}${query}`;
}

// Helper to get tel: link
export function getTel(phone: string): string {
  // Strip non-digits except + for tel: links
  const clean = phone.replace(/[^\d+]/g, '');
  return `tel:${clean}`;
}

// WhatsApp link (optional)
export function getWhatsApp(phone: string, message?: string): string {
  const clean = phone.replace(/[^\d]/g, '');
  const params = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${params}`;
}