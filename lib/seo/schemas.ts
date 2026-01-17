export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Stem",
    url: "https://scribeandstem.com",
    logo: "https://scribeandstem.com/logo.png",
    description: "Stem is a wedding planning workspace that keeps budgets, guests, vendors, and timelines organized in one place.",
    email: "hello@scribeandstem.com",
    sameAs: [
      "https://twitter.com/scribeandstem",
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Stem",
    url: "https://scribeandstem.com",
    description: "Wedding planning workspace",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://scribeandstem.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Stem",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: "Stem is a wedding planning workspace for budgets, vendors, guests, RSVPs, timelines, and seating.",
    url: "https://scribeandstem.com",
    author: {
      "@type": "Organization",
      name: "Stem",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "127",
    },
  };
}

export function generateFAQSchema() {
  const faqs = [
    {
      question: "What is Stem?",
      answer: "Stem is a wedding planning workspace that brings budgets, guests, vendors, RSVPs, timelines, and seating into one place.",
    },
    {
      question: "Is Stem free to use?",
      answer: "Yes, Stem offers a free plan with essential planning tools. Paid plans unlock expanded limits and premium features.",
    },
    {
      question: "What can Stem help me with?",
      answer: "Stem can help with wedding budgets, timelines, vendor selection, guest management, seating charts, RSVPs, and day-of coordination.",
    },
    {
      question: "How is Stem different from other wedding planning apps?",
      answer: "Stem focuses on an elegant, organized workspace that connects your planning data across budgets, vendors, guests, and timelines.",
    },
    {
      question: "Does Stem sell my data to vendors?",
      answer: "No. Stem never sells your data to vendors or advertisers. Your wedding planning information stays private.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateAllSchemas() {
  return [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    generateSoftwareApplicationSchema(),
    generateFAQSchema(),
  ];
}
