# Grammar Atlas

梵语语法经文可视化图谱，展示 Pāṇini Aṣṭādhyāyī 与 Kātantra 等语法书之间的关系网络。

## 本地运行

```bash
cd GrammarAtlas
npm install
npm run dev
```

访问 http://localhost:4321/Sanskrit/

## 如何添加经文

编辑 `src/data/sutras.ts` 文件。

### 基本格式

```typescript
"pan_1.1.4": {                    // 经文ID：pan_ 或 kat_ 前缀 + 章节号
  id: "pan_1.1.4",                // 必填：与 key 相同
  text: "na dhātulopa ārdhadhātuke",  // 必填：经文原文
  translation: "...",             // 选填：翻译
  vrtti: "...",                   // 选填：注释
  notes: "例：bhū + ta → bhūta",  // 选填：个人笔记
  adhikaras: ["pan_6.4.1"],       // 选填：所属管辖经（可多层）
  references: ["pan_1.1.3"],      // 必填：引用的其他经文（空数组也要写）
  parallel: ["kat_x.x.x"],        // 选填：其他语法书的对应经
  source: "panini"                // 必填："panini" | "katantra" | "other"
},
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✓ | 经文编号，格式 `源_章.节.条`，如 `pan_1.1.1` |
| `text` | ✓ | 经文原文（梵语） |
| `source` | ✓ | 来源：`panini` / `katantra` / `other` |
| `references` | ✓ | 引用的其他经文 ID 数组，无则写 `[]` |
| `translation` | | 中文或英文翻译 |
| `vrtti` | | 注释、解释 |
| `notes` | | 个人笔记（支持 wiki 链接和多行）|
| `adhikaras` | | 管辖此经的 adhikāra ID 数组（支持多层） |
| `parallel` | | 其他语法书中的对应经文 ID 数组 |

### Wiki 链接与多行笔记

在 `notes`、`translation`、`vrtti` 等文本字段中，你可以：

**1. 添加 Wiki 链接**
```typescript
notes: "niṣṭhā 的定义见 [[pan_1.1.26]]，用法参考 [[pan_6.4.59]]"
```
- 格式：`[[经文ID]]`
- 链接会自动转换为可点击的超链接
- **链接的 ID 必须也添加到 `references` 数组中**

**2. 多行笔记**
```typescript
notes: "第一行说明。\n 第二行补充。\n 第三行扩展信息。"
```
- 使用 `\n` 作为换行符
- 每行会显示为单独的段落

**完整示例：**
```typescript
"pan_6.4.60": {
  id: "pan_6.4.60",
  text: "niṣṭhāyām aṇyadarthe.",
  translation: "成就词缀前表主动含义时。",
  notes: "niṣṭhā：成就词缀[[pan_1.1.26]]。\n aṇyadarthe：表主动含义（kartari）。",
  references: ["pan_1.1.26"],  // 必须包含所有在 notes 中链接的 ID
  adhikaras: ["pan_6.4.59"],
  source: "panini"
},
```

### 验证引用一致性

添加或修改经文后，运行验证脚本确保 `notes` 中的所有链接都在 `references` 中：

```bash
npm run validate
```

验证脚本会检查：
- ✓ notes 中的所有 `[[id]]` 是否都在 references 中
- ✓ references 中的 ID 是否都是存在的经文
- ✓ references 中的所有 ID 是否都在 notes 中提及

如果有问题会显示错误信息：
```
✗ pan_6.4.60:
  • notes 中包含 [[pan_1.1.26]] 但不在 references 中
```

### 多层 Adhikāra 示例

一条经文可能同时被多个 adhikāra 管辖：

```typescript
"pan_6.4.77": {
  id: "pan_6.4.77",
  text: "aci śnudhātubhruvāṃ yvor iyaṅuvaṅau",
  adhikaras: [
    "pan_6.4.1",   // aṅgasya（管辖 6.4.1-6.4.175）
    "pan_6.1.72"   // saṃhitāyām（管辖 6.1.72-6.1.157）
  ],
  references: [],
  source: "panini"
},
```

### Pāṇini vs Kātantra 对应

用 `parallel` 字段建立对应关系：

```typescript
// Pāṇini
"pan_1.1.1": {
  text: "vṛddhir ādaic",
  parallel: ["kat_1.1.7"],  // 对应 Kātantra
  // ...
},

// Kātantra
"kat_1.1.7": {
  text: "ādo vṛddhiḥ",
  parallel: ["pan_1.1.1"],  // 反向引用
  // ...
},
```

## 图谱中的连线说明

| 颜色 | 类型 | 含义 |
|------|------|------|
| 灰色实线 | reference | 经文互相引用 |
| 橙色虚线 | parallel | Pāṇini ↔ Kātantra 对应 |
| 红色实线 | adhikara | 管辖关系 |

## 部署

Push 到 GitHub 后会自动部署到 GitHub Pages。

首次需要在 GitHub 仓库设置中启用：
1. Settings → Pages
2. Source 选择 **GitHub Actions**

部署地址：https://zhangxueshan246.github.io/Sanskrit/

## 目录结构

```
GrammarAtlas/
├── src/
│   ├── data/
│   │   └── sutras.ts      ← 经文数据（主要编辑这个）
│   ├── components/
│   │   └── SutraGraph.tsx ← D3.js 图谱组件
│   ├── pages/
│   │   ├── index.astro    ← 首页
│   │   ├── atlas.astro    ← 图谱页面
│   │   └── sutra/[id].astro ← 经文详情页
│   └── styles/
│       └── global.css     ← 样式
└── package.json
```
