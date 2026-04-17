// 经文数据结构
// 你可以在这里添加更多经文

export interface Sutra {
  id: string;
  text: string;           // 经文原文
  translation?: string;   // 翻译
  vrtti?: string;         // 注释
  notes?: string;         // 个人笔记（例词、注意事项等）
  adhikaras?: string[];   // 所属 adhikara（管辖经），可以多层
  references: string[];   // 引用的其他经文
  parallel?: string[];    // 其他语法书的对应经（如Kātantra）
  source: 'panini' | 'katantra' | 'other';
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'reference' | 'adhikara' | 'parallel' | 'sequence';
}

// ===== Pāṇini Aṣṭādhyāyī 示例数据 =====
export const sutras: Record<string, Sutra> = {
  // 第一章 第一节
  "pan_6.4.60": {
    id: "pan_6.4.60",
    text: "niṣṭhāyām aṇyadarthe.",
    translation: "成就词缀前表主动含义时。",
    notes: "niṣṭhā：成就词缀[[pan_1.1.26]]。\n aṇyadarthe：当它的意义不是 ṇyat 词缀的意义时（ṇyat 词缀专门表示被动 karmaṇi 或无人称状态 bhāve）。也就是说，当它表示主动（kartari）意义时。",
    adhikaras: ["pan_6.4.59", "pan_6.4.58"],
    references: ["pan_1.1.26"],
    parallel: [],
    source: "panini"
  },
  "pan_6.4.59": {
    id: "pan_6.4.59",
    text: "kṣiyaḥ.",
    translation: "在词根kṣi后。",
    adhikaras: ["pan_6.4.58"],
    references: [],
    parallel: [],
    source: "panini"
  },
  "pan_6.4.58": {
    id: "pan_6.4.58",
    text: "yu-pluvor dīrghaś chandasi.",
    translation: "吠陀中 yu 和 plu 变长。",
    adhikaras: [], 
    references: [],
    source: "panini"
  },
  "pan_1.1.26": {
    id: "pan_1.1.26",
    text: "kta-ktavatū niṣṭhā.",
    translation: "kta和ktvatu是成就词缀。",
    adhikaras: [], 
    references: [],
    source: "panini"
  },

  // ===== Kātantra 示例数据 =====
  "kat_1.1.1": {
    id: "kat_1.1.1",
    text: "siddho varṇasamāmnāyaḥ",
    translation: "字母的排列是已知的",
    source: "katantra",
    references: [],
    parallel: []
  },

};

// 生成图谱边
export function generateEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const sutra of Object.values(sutras)) {
    // 引用关系
    for (const ref of sutra.references) {
      if (sutras[ref]) {
        edges.push({ from: sutra.id, to: ref, type: 'reference' });
      }
    }
    // 并行对应关系
    if (sutra.parallel) {
      for (const par of sutra.parallel) {
        if (sutras[par]) {
          edges.push({ from: sutra.id, to: par, type: 'parallel' });
        }
      }
    }
    // Adhikara 管辖关系（支持多层）
    if (sutra.adhikaras) {
      for (const adh of sutra.adhikaras) {
        if (sutras[adh]) {
          edges.push({ from: adh, to: sutra.id, type: 'adhikara' });
        }
      }
    }
  }

  return edges;
}

export const edges = generateEdges();
