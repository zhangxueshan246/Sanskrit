export interface Sutra {
  id: string;
  text: string;
  translation?: string;
  tibetan?: string;
  /** 段书讲解（段晴《波你尼语法入门》的讲解内容，字段名避开 vṛtti，因为 vṛtti 在本项目里指注释） */
  duanExplain?: string;
  /** 按语：个人说明，所有条目都保留此字段 */
  notes?: string;
  /** 管辖此经的真领句（不含 anuvṛtti 承袭）。手写项用于跨编号体系；同编号体系的由 scope 自动计算 */
  adhikaras?: string[];
  /** 本条若是领句，写它管辖的区间（裸编号，如 "6.3.1"–"6.3.24"，含两端）。只作用于同前缀的经文 */
  scope?: { from: string; to: string };
  /** 派生字段（由 applyScopes 填写，不要写进数据文件）：adhikaras 中由 scope 区间自动算出的那一项，用于主图不画成员边 */
  computedAdhikara?: string;
  /** anuvṛtti 承袭：本条从哪条经文沿用了哪个词。不是领句，不进主图，只在详情页显示 */
  anuvrtti?: { from: string; term?: string }[];
  references?: string[];
  /** 平行文本：仅用于 Pāṇini 与 Kātantra 两大系统之间的经文对应，双向填写 */
  parallel?: string[];
  /** 注释于：本条是哪些经文的注释（jkv、dssk、dsv 等）。只写在注释方，反向关系由代码推算 */
  commentaryOn?: string[];
  sequence?: string[];
  source: 'panini' | 'katantra' | 'dsv' | 'jkv' | 'dssk' | 'other';
  updatedAt?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'reference' | 'adhikara' | 'parallel' | 'commentary' | 'sequence';
}
