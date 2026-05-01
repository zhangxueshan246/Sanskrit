export interface Sutra {
  id: string;
  text: string;
  translation?: string;
  vrtti?: string;
  notes?: string;
  adhikaras?: string[];
  references: string[];
  parallel?: string[];
  sequence?: string[];
  source: 'panini' | 'katantra' | 'jkv' | 'dssk' | 'other';
  updatedAt?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'reference' | 'adhikara' | 'parallel' | 'sequence';
}
