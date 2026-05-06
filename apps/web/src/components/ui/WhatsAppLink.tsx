import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { formatPhoneForWhatsApp } from '@/lib/phone';

interface WhatsAppLinkProps {
  phone: string | null | undefined;
  name?: string;
}

/**
 * Renders a WhatsApp icon link and a tel: link for a given phone number.
 * When phone is absent, renders a greyed-out disabled state.
 */
export function WhatsAppLink({ phone, name }: WhatsAppLinkProps) {
  const waNumber = formatPhoneForWhatsApp(phone);

  const label = name || phone;

  if (!waNumber || !phone) {
    return (
      <div className="flex items-center gap-2">
        {label && <span className="text-body-md">{label}</span>}
        <span
          className="inline-flex items-center gap-1 text-on-surface-variant/40 cursor-not-allowed"
          title="אין מספר טלפון"
          aria-disabled="true"
        >
          <MessageCircle className="h-4 w-4" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-body-md">{label}</span>}
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-success hover:text-success/80 transition-colors"
        title={`WhatsApp ${phone}`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        title={`חייג ${phone}`}
        dir="ltr"
      >
        <Phone className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
