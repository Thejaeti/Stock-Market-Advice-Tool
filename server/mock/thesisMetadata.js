// AI Infrastructure Investment Thesis — Tier Definitions

export const THESIS_TIERS = {
  1: {
    name: 'Semiconductor & Compute Hardware',
    priority: 'Core',
    rationale:
      'GPUs, ASICs, and advanced packaging are the foundational bottleneck for AI scaling. Every AI workload begins with silicon. These ETFs provide direct exposure to the companies designing and manufacturing AI accelerators.',
    tickers: ['SMH', 'SOXX', 'SOXQ', 'PSI', 'CHPX'],
  },
  2: {
    name: 'Power & Energy Infrastructure',
    priority: 'High',
    rationale:
      'AI data centers are power-hungry — a single large GPU cluster can draw 100+ MW. The buildout of nuclear, renewable, and grid infrastructure is the second-order bottleneck. These ETFs capture the energy supply chain that AI scaling depends on.',
    tickers: ['IPWR', 'NLR', 'TNUK', 'ICLN'],
  },
  3: {
    name: 'Data Center & Digital Infrastructure',
    priority: 'Medium-High',
    rationale:
      'Physical data center REITs, cooling systems, and networking hardware form the connective tissue of AI infrastructure. Less direct than silicon but essential for deployment at scale.',
    tickers: ['DTCR', 'IDGT'],
  },
  4: {
    name: 'Broad Tech & Market Indices',
    priority: 'Medium',
    rationale:
      'Broad tech and market ETFs provide diversified AI exposure through mega-cap holdings (NVDA, MSFT, GOOGL, AMZN) while diluting the thesis with SaaS, ad-tech, and non-AI businesses. Useful as a base layer but not a concentrated bet.',
    tickers: ['QQQM', 'QQQ', 'VOO', 'SPY', 'VTI', 'VGT', 'FTEC'],
  },
  5: {
    name: 'Healthcare & Biotech',
    priority: 'Low',
    rationale:
      'AI is transforming drug discovery, genomics, and diagnostics — but these ETFs carry significant biotech pipeline risk and regulatory uncertainty. A speculative satellite allocation for long-duration AI-in-healthcare conviction.',
    tickers: ['XLV', 'VHT', 'IBB', 'XBI', 'BBH', 'ARKG'],
  },
  avoid: {
    name: 'Avoid — Structural Headwinds',
    priority: 'Avoid',
    rationale:
      'These ETFs are either over-concentrated in SaaS companies facing AI disruption (IGV, CLOU) or use leveraged structures that introduce decay and path-dependency risk (SOXL). The thesis actively recommends against holding these.',
    tickers: ['IGV', 'CLOU', 'SOXL'],
  },
};

export const THESIS_SUMMARY =
  'This thesis prioritizes the physical infrastructure layer of AI — silicon, power, and data centers — over the software and application layer. The core conviction is that compute hardware and energy supply are the binding constraints on AI scaling, and companies solving those bottlenecks will capture disproportionate value. Allocations are tiered from concentrated hardware bets (Tier 1) through broad diversification (Tier 4) to speculative healthcare plays (Tier 5).';
