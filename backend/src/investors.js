export const INVESTORS_BY_FIELD = {
  ai: [
    {
      name: "Y Combinator (AI Track)",
      link: "https://www.ycombinator.com",
      contact: "Apply online at ycombinator.com/apply",
      focus: "Prominent accelerator for AI startups, providing $500k in funding and massive GPU credits."
    },
    {
      name: "Sequoia Capital (Arc / AI)",
      link: "https://www.sequoiacap.com",
      contact: "partner-team@sequoiacap.com",
      focus: "Elite global VC funding AI, foundational models, and deeptech."
    },
    {
      name: "Lightspeed Venture Partners",
      link: "https://lsvp.com",
      contact: "info@lsvp.com",
      focus: "Active early-stage investors in enterprise AI and infrastructure."
    },
    {
      name: "Signal Directory by NFX",
      link: "https://signal.nfx.com",
      contact: "signal@nfx.com",
      focus: "A massive directory of over 10,000 venture capitalists and angel investors filtered by sector."
    }
  ],
  medical: [
    {
      name: "StartUp Health",
      link: "https://www.startuphealth.com",
      contact: "network@startuphealth.com",
      focus: "Global community of health transformers, investing in and accelerating digital health/medical startups."
    },
    {
      name: "F-Prime Capital",
      link: "https://fprimecapital.com",
      contact: "medtech-leads@fprimecapital.com",
      focus: "Venture capital firm focused on healthcare, biotech, and digital medicine."
    },
    {
      name: "Orbimed",
      link: "https://www.orbimed.com",
      contact: "+1 (212) 739-6400 / healthcare-deals@orbimed.com",
      focus: "Leading healthcare investment firm covering pharmaceuticals, medical devices, and diagnostics."
    },
    {
      name: "Rock Health",
      link: "https://rockhealth.com",
      contact: "investment@rockhealth.com",
      focus: "Seed fund and advisory firm dedicated to digital health."
    }
  ],
  fintech: [
    {
      name: "Ribbit Capital",
      link: "https://www.ribbitcap.com",
      contact: "pitch@ribbitcap.com",
      focus: "Pure-play fintech VC investing in payment systems, neo-banking, and decentralized finance."
    },
    {
      name: "QED Investors",
      link: "https://qedinvestors.com",
      contact: "fintech-team@qedinvestors.com",
      focus: "Premier fintech venture capital firm with extensive operator experience."
    },
    {
      name: "Valar Ventures",
      link: "https://www.valar.com",
      contact: "+1 (212) 203-8888 / pitches@valar.com",
      focus: "Early-stage venture fund backed by Peter Thiel, focused on fintech outside Silicon Valley."
    }
  ],
  saas: [
    {
      name: "Bessemer Venture Partners",
      link: "https://www.bvp.com",
      contact: "saas-ventures@bvp.com",
      focus: "Pioneers in cloud and SaaS investing. Famous for writing the 'SaaS Laws'."
    },
    {
      name: "Battery Ventures",
      link: "https://www.battery.com",
      contact: "+1 (617) 948-3600 / saas-deals@battery.com",
      focus: "Tech-focused venture capital investing in B2B software and cloud infrastructure."
    },
    {
      name: "Emergence Capital",
      link: "https://www.emcap.com",
      contact: "leads@emcap.com",
      focus: "Pure enterprise cloud and B2B SaaS venture firm."
    }
  ],
  edtech: [
    {
      name: "Reach Capital",
      link: "https://www.reachcapital.com",
      contact: "hello@reachcapital.com",
      focus: "Venture firm investing in early childhood, K-12, higher-ed, and workforce learning."
    },
    {
      name: "Owl Ventures",
      link: "https://owlvc.com",
      contact: "+1 (650) 391-9250 / info@owlvc.com",
      focus: "The largest venture capital fund in the world focused on education technology."
    },
    {
      name: "Learn Capital",
      link: "https://learncapital.com",
      contact: "partner-pitch@learncapital.com",
      focus: "Seed and early-stage VC investing in educational tools and future of work."
    }
  ],
  ecommerce: [
    {
      name: "Forerunner Ventures",
      link: "https://forerunnerventures.com",
      contact: "pitches@forerunnerventures.com",
      focus: "Early-stage venture firm that defined modern commerce, retail tech, and brand investing."
    },
    {
      name: "Lerer Hippeau",
      link: "https://www.lererhippeau.com",
      contact: "pitch@lererhippeau.com",
      focus: "Seed-stage fund in NYC investing in consumer tech, e-commerce platforms, and direct-to-consumer."
    },
    {
      name: "Tiger Global",
      link: "https://www.tigerglobal.com",
      contact: "commerce-team@tigerglobal.com",
      focus: "Large-scale growth investor in internet, retail, and e-commerce infrastructure."
    }
  ],
  cleantech: [
    {
      name: "Breakthrough Energy Ventures",
      link: "https://www.breakthroughenergy.org",
      contact: "apply@breakthroughenergy.org",
      focus: "Bill Gates-backed coalition investing in technologies that can reduce greenhouse gases at scale."
    },
    {
      name: "Congruent Ventures",
      link: "https://congruentvc.com",
      contact: "pitches@congruentvc.com",
      focus: "Early-stage venture capital firm partnering with founders in climate and energy."
    },
    {
      name: "Energy Impact Partners",
      link: "https://www.energyimpactpartners.com",
      contact: "+1 (212) 899-9700 / info@energyimpactpartners.com",
      focus: "Global investment platform leading the transition to a sustainable energy future."
    }
  ],
  other: [
    {
      name: "Techstars Accelerator",
      link: "https://www.techstars.com",
      contact: "apply@techstars.com",
      focus: "Mentorship-driven accelerator program providing $120k funding and global network."
    },
    {
      name: "AngelList Venture",
      link: "https://www.angellist.com",
      contact: "syndicates@angellist.com",
      focus: "Platform to raise money from syndicates of angel investors."
    },
    {
      name: "Signal Directory by NFX",
      link: "https://signal.nfx.com",
      contact: "signal@nfx.com",
      focus: "A massive directory of over 10,000 venture capitalists and angel investors filtered by sector."
    }
  ]
};

export function getInvestorsForField(field) {
  const key = (field || "other").toLowerCase();
  return INVESTORS_BY_FIELD[key] || INVESTORS_BY_FIELD.other;
}
