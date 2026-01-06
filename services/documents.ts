
export interface DocReference {
  id: string;
  title: string;
  url: string;
  description: string;
}

export const REFERENCE_DOCS: DocReference[] = [
  {
    id: "doc1",
    title: "IMNCI Chart Booklet (Integrated Management of Neonatal and Childhood Illness)",
    url: "https://nhm.gov.in/images/pdf/programmes/child-health/guidelines/imnci_chart_booklet.pdf",
    description: "Primary clinical standard for pediatric triage and treatment in India."
  },
  {
    id: "doc2",
    title: "AAP (American Academy of Pediatrics) Safe Sleep and SIDS Guidelines",
    url: "https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/Sleep-Related-Infant-Deaths-Updated-2022",
    description: "Latest global standards for infant sleep safety."
  },
  {
    id: "doc3",
    title: "WHO (World Health Organization) Infant and Young Child Feeding Fact Sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding",
    description: "International standards for nutrition and breastfeeding."
  }
];

export const DOC_TITLES_FOR_SEARCH = REFERENCE_DOCS.map(d => `- ${d.title}: ${d.url}`).join('\n');
