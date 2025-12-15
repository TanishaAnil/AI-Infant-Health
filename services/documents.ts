// ============================================================================
// KNOWLEDGE BASE REFERENCES
// ============================================================================
// Since the documents are too large to paste, we provide the Titles and URLs.
// The AI will use its internal training data associated with these official sources
// to answer questions accurately.
// ============================================================================

export interface DocReference {
  id: string;
  title: string;
  url: string;
  description: string;
}

export const REFERENCE_DOCS: DocReference[] = [
  {
    id: "doc1",
    title: "FACILITY BASED INTEGRATED MANAGEMENT OF NEONATAL AND CHILDHOOD ILLNESS (F-IMNCI)",
    url: "https://nhm.gov.in/images/pdf/programmes/child-health/guidelines/imnci_chart_booklet.pdf",
    description: "Model Chapter for textbooks for medical students and allied health professionals."
  },
  {
    id: "doc2",
    title: "AAP Safe Sleep Guidelines (2022 Update)",
    url: "https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/Sleep-Related-Infant-Deaths-Updated-2022",
    description: "Recommendations for Reducing Infant Deaths in the Sleep Environment."
  },
  {
    id: "doc3",
    title: "KEN-CH-20-01-OPERATIONALGUIDANCE-2017-eng-IMNCI-Guidelines-Healthcare-Providers.pdf",
    url: "https://platform.who.int/docs/default-source/mca-documents/policy-documents/operational-guidance/KEN-CH-20-01-OPERATIONALGUIDANCE-2017-eng-IMNCI-Guidelines-Healthcare-Providers.pdf",
    description: "Assessment and initial management of fever in young children."
  }
];
