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
  source: 'panini' | 'katantra' | 'jkv' | 'dssk' | 'other';
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
    notes: "niṣṭhā：成就词缀。[[pan_1.1.26]] \n aṇyadarthe：当它的意义不是 ṇyat 词缀的意义时（ṇyat 词缀专门表示被动 karmaṇi 或无人称状态 bhāve）。也就是说，当它表示主动（kartari）意义时。",
    adhikaras: ["pan_6.4.59"],
    references: ["pan_1.1.26"],
    parallel: [],
    source: "panini"
  },
  "pan_6.4.59": {
    id: "pan_6.4.59",
    text: "kṣiyaḥ.",
    translation: "在词根 kṣi 后。",
    adhikaras: ["pan_6.4.58"],
    notes: " [[pan_6.4.58]] 中的 dīrghas 代入这一句。",
    references: [],
    parallel: [],
    source: "panini"
  },
  "pan_6.4.58": {
    id: "pan_6.4.58",
    text: "yu-pluvor dīrghaś chandasi.",
    translation: "吠陀中 yu 和 plu 变长。",
    notes: "不确定，待查。",
    adhikaras: [], 
    references: [],
    source: "panini"
  },
  "pan_3.1.124": {
    id: "pan_3.1.124",
    text: "ṛ-halor ṇyat.",
    translation: "段书：于 ṛ 音以及辅音后，加 ṇyat。",
    notes: "ṇyat词缀，待查。",
    adhikaras: [], 
    references: [],
    parallel: ["dssk_552"],
    source: "panini"
  },
    "dssk_552": {
    id: "dssk_552",
    text: "ṛvarṇāntāt halantāc ca ṇyat.",
    translation: "段书：在以元音 ṛ 为末音的以及以辅音为末音的（词根）后，加 ṇyat。",
    vrtti: "段书讲解：\n 在经文中，ṛ 和 hal 组成双数第六格，但这个第六格表示第五格的意义。《迦湿伽》说明：pañcamyarthe ṣaṣṭhī。\n ṇyat：仍然是 kṛtya 类的词缀，ṇ 和 t 皆为符号。ņ 符号指示词根的元音须变为三合元音[[pan_7.2.115]]。例如 √kṛ（做）就是一个以 ṛ 元音为末音的词根，vac 是一个以辅音落尾的词根。",
    adhikaras: [], 
    references: ["pan_7.2.115"],
    parallel: ["pan_3.1.124"],
    source: "dssk"
  },
  "pan_1.1.26": {
    id: "pan_1.1.26",
    text: "kta-ktavatū niṣṭhā.",
    translation: "段书：kta 和 ktvatu 是成就词缀。",
    notes: "",
    adhikaras: [], 
    references: [],
    parallel: ["dssk_565"],
    source: "panini"
  },
    "dssk_565": {
    id: "dssk_565",
    text: "ekau niṣṭḥāsaṃjñau staḥ.",
    translation: "段书：这一对叫做成就词缀。",
    vrtti: "段书讲解：\n kta 是过去被动分词词缀 (past passive participle)，ktavatu 是过去主动态分词词缀。这两个词缀共同叫做 niṣṭhā，即成就词缀。 niṣṭhā “成就词缀” 是本句经文引入的一个新的语法术语。",
    adhikaras: [], 
    references: [],
    parallel: ["pan_1.1.26"],
    source: "dssk"
  },
    "pan_1.1.72": {
    id: "pan_1.1.72",
    text: "yena vidhis tad-antasya.",
    translation: "段书：以此为规则，以此为末音。",
    notes: "参见[[dssk_15]] 讲解后半部分。",
    adhikaras: [], 
    references: ["dssk_15"],
    source: "panini"
  },
    "pan_1.4.14": {
    id: "pan_1.4.14",
    text: "sup-tiṅ-antaṃ padam.",
    translation: "段书：以格尾、语尾为末的是字。",
    notes: "anta 在段书[[dssk_15]]有解释，需再查。",
    adhikaras: [], 
    references: [],
    parallel: ["dssk_15"],
    source: "panini"
  },
    "dssk_15": {
    id: "dssk_15",
    text: "subantaṃ tiṅantaṃ ca padasaṃjñaṃ syāt.",
    translation: "段书：一个以格尾为末的，或是以语尾为末的（词）叫做字。",
    vrtti: "段书讲解：\n 此句对 pada “字”做了明确的定义。在梵文中，字的概念有许多，一般说词或字是指 śabda（声），古代印度人重声不重形，往往一本书都是以“声”的形式传下来，因此“声”就相当于汉文化的字。\n pada “步；字”。这个词是波你尼语法体系中的一个术语， 与 śabda（声）不同，它特指加上格尾或动词语尾完成了语法变化的字。\n sup：取名词等单数第一格尾 su 和复数第七格尾  sup 的 p 符号所形成的对收，代表所有的格尾（98）。\n tiṅ：取动词主动语态单数第三人称语尾 tip 和中间语态复数第一人称语尾 mahiṅ 的 ṅ 符号形成对收，代表所有的动词语尾 （344）。\n 应当注意到的是，波你尼在这句中使用了 sup-anta 和 tiṅ-anta，这是两个多财释复合词，表示“以格尾为末的词”以及“以语尾为末的词”。使用了-anta（以……为末的）这样的概念，也就不再包括 sup 和 tiṅ 本身。这里涉及到了波你尼语法体系中一个十分重要的规则，叫做 tadantaviddhi“以此为末的规则”。要读懂《波你尼经》，首先应当掌握的就是波你尼经的这个规则。规则的确立是根据《波你尼经》[[pan_1.1.72]]:\n yena vidhis tad-antasya.\n “以此为规则，以此为末音。”\n 《本经月光疏》释道：\n viśeşaņaṃ tadantasya sañjñā syāt svasya ca rūpasya.\n  “一个特定的（字符或词缀）是以它为末的（词的）术语， 并且是它自身类型的术语。”viśeşaṇam 即经文中 yena 所指代的，指一个具体的字符或词缀。yena 位于表示“工具、途径、方式、作用”意义的第三格。karaņam vyāparavat，“方式等具有功能性”。er aj ity atra viśeṣaṇasya ikārasya pāņinikartṛkavidhānakriyāyāṃ karaņasya itaravyāvartanam eva vyāpāraḥ.“‘于 I 音后加 ac 词缀’， 彼处的特定字符 i 作为制定规则者波你尼安排行为中的方式具有排它性，即具有功能。”\n “以此为末”句经文说明，凡是波你尼经文中提到的一个字符或一个词尾，它所摄的含义有二：1. 它本身是一个词或一个词缀的末音；2. 它包含了以它为末音的词。经文中论述的字符或词缀与词的结合都根据这个规则。（关于以此为末的规则所不含的内容，见本书第615条。）在讲某一字符须发生变化时，一般是在讲一个词的末音须发生变化，例如 P.III.3.56 即本书第 572 条，其原文是：er ac.“于 I 音后加 ac 词缀。”彼处出现的 i 音就是一个特定的字符，而这个字符正是一个术语，代表了以它为术音的词和它同类型的词。因第 572 条在领句 dhātoh (541) 的管辖之下，由此可知“于 i 音后”是指以 i 音为末音的动词词根，所有以 i 音为末的动词词根也都要按照第 572 条的规则发生同样的变化。",
    adhikaras: [], 
    references: ["pan_1.1.72"],
    parallel: ["pan_1.4.14"],
    source: "dssk"
  },
    "pan_7.2.115": {
    id: "pan_7.2.115",
    text: "aco ñṇiti.",
    translation: "段书：遇到 ñ 和 ṇ 符号时，元音发生变化。",
    vrtti: "段书补全句：其后所遇是 ñ 和 ņ 符号时，以元音为末的词干发生三合的变化。",
    adhikaras: [], 
    references: [],
    parallel: ["dssk_162"],
    source: "panini"
  },
   "dssk_162": {
    id: "dssk_162",
    text: "vṛddhiḥ. sakhāyau sakhāyaḥ. he sakhe. sakhāyam sakhāyau sakhīn sakhyā sakhye.",
    translation: "段书：变化成为三合元音。（例如：）sakhāyau, sakhāyah; he sakhe; sakhāyam, sakhāyau, sakhīn, sakhyā, sakhye. ",
    vrtti: "段书讲解：\n ac：元音的对收，在经中是第六格。\n 如果完整地表达对这句经文的注释，应该是这样的：ňiti ṇiti ca pare 'j-antāṅgasya vṛddhiḥ syāt，“其后所遇是 ñ 和 ņ 符号时，以元音为末的词干发生三合的变化。根据“以此为末的规则” (tadantaviddhi)，当替换音为单个字符时，它要替换的是位于第六格的音或词的末音。sakhi 的前五个格尾如带了 ṇ 符号，sakhi 的末音 i 于强语干须发生三合元音的变化，i 的三合元音是 ai，在第一格双数格尾 au 前，ai 变成 āy，然后再加上 au，如例词所示。复数第一格、单双数第二格也须如此的过程。呼格的变化不照这五个格的规则，其变化如148条所示。从复数第二格起，不再属于代词基的范畴，因此 sakhi 的末音不再发生三合元音的变化。",
    adhikaras: [], 
    references: [],
    parallel: ["pan_7.2.115"],
    source: "dssk"
  },
  // ===== Kātantra 示例数据 =====
  "kat_1.1.1": {
    id: "kat_1.1.1",
    text: "siddho varṇasamāmnāyaḥ.",
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
