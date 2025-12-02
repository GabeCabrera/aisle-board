export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aisle",
    url: "https://aisleboard.com",
    logo: "https://aisleboard.com/logo.png",
    description: "Aisle is an AI wedding planner that helps couples plan their perfect wedding through natural conversation.",
    email: "hello@aisleboard.com",
    sameAs: [
      "https://twitter.com/aisleboard",
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aisle",
    url: "https://aisleboard.com",
    description: "AI Wedding Planner",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://aisleboard.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aisle",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: "Aisle is an AI wedding planner that helps couples plan their perfect wedding. Get personalized advice on budgets, venues, timelines, vendors, and more.",
    url: "https://aisleboard.com",
    author: {
      "@type": "Organization",
      name: "Aisle",
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
      question: "What is Aisle?",
      answer: "Aisle is an AI wedding planner that helps couples plan their perfect wedding through natural conversation. Instead of overwhelming forms and checklists, you simply chat with Aisle about what you need help with.",
    },
    {
      question: "Is Aisle free to use?",
      answer: "Yes, Aisle offers a free plan that includes basic planning tools and limited AI messages. Premium plans are available for unlimited AI access and additional features.",
    },
    {
      question: "What can Aisle help me with?",
      answer: "Aisle can help with wedding budgets, timelines, vendor selection, guest management, seating charts, day-of coordination, and general wedding planning advice. Just ask about whatever you need help with.",
    },
    {
      question: "How is Aisle different from other wedding planning apps?",
      answer: "Aisle uses conversational AI to provide personalized guidance instead of generic checklists. It feels like talking to a knowledgeable friend who happens to know everything about weddings.",
    },
    {
      question: "Does Aisle sell my data to vendors?",
      answer: "No. Aisle never sells your data to vendors or advertisers. Your wedding planning information stays private.",
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
