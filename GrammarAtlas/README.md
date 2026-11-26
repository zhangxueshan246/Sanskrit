# Vyākaraṇa Atlas

梵语语法经文可视化图谱，展示 Pāṇini Aṣṭādhyāyī、Kātantra、Kāśikāvṛṭti 等语法书之间的关系网络。

## 技术栈

- **框架**：Astro v6 + React 18
- **数据**：JSON 文件存储（直接 fs 读取）
- **类型检查**：TypeScript strict
- **可视化**：D3.js 力导向图
- **搜索**：Fuse.js 模糊搜索
- **部署**：GitHub Pages


## 如何添加经文

每个经文存储为独立的 JSON 文件，根据来源放在对应目录：

```
src/content/sutras/
├── panini/     pan_1.1.1.json
├── dssk/
├── katantra/
├── dsv/
├── jkv/
└── other/
```

**基本结构**：
```json
{
  "id": "pan_1.1.1",
  "text": "经文原文 [[ref_id]]",
  "translation": "翻译",
  "duanExplain": "段书讲解",
  "notes": "按语\n支持多行",
  "source": "panini",
  "references": ["ref_id"],
  "parallel": ["other_id"],
  "commentaryOn": ["root_id"],
  "adhikaras": ["adhikara_id"],
  "sequence": ["next_id"],
  "updatedAt": 1743638400000
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 经文ID (例: `pan_1.1.1`) |
| `text` | string | ✓ | 经文原文，支持 `[[id]]` wiki链接、`\n` 分段、`\|` 可选换行点、`-` 后自动添加断点 |
| `translation` | string | ✗ | 中英翻译，同样支持 wiki 链接和换行标记 |
| `tibetan` | string | ✗ | 藏文对照 |
| `duanExplain` | string | ✗ | 段书讲解（段晴《波你尼语法入门》的讲解，字段名避开 vṛtti）|
| `notes` | string | ✗ | 按语（个人说明，所有条目都保留此字段，可为空）|
| `draft` | string | ✗ | 草稿标记，非空时验证脚本给出警告（内容可能未编辑完成）。**网站不显示此字段** |
| `source` | enum | ✓ | `panini` \| `katantra` \| `dsv` \| `jkv` \| `dssk` \| `other` |
| `references` | array | ✗ | 引用经文 ID 数组 |
| `parallel` | array | ✗ | 平行文本，**主要用于 Pāṇini 与 Kātantra 两大系统之间的经文对应**，双向填写。dssk–kat 这类对应也可保留，但验证脚本会给出警告 |
| `commentaryOn` | array | ✗ | 注释于：本条是哪些经文的注释（jkv、dssk、dsv 等）。**只写在注释方**，反向关系由代码推算 |
| `adhikaras` | array | ✗ | Adhikāra 领句（管辖此经的）。只放真领句，**不要放 anuvṛtti 承袭**；同编号体系内的领句优先用 `scope`，此字段留给跨编号体系（如 `dssk` → `pan`）手写 |
| `scope` | object | ✗ | 本条若是领句，写它管辖的区间：`{ "from": "6.3.1", "to": "6.3.24" }`（裸编号，含两端，`from` 须等于自身编号）。同前缀的经文落入区间即自动获得该领句；多层嵌套时图谱只连最内层，祖先在详情页向上展开。`to` 对应的经文不必已录入 |
| `anuvrtti` | array | ✗ | anuvṛtti 承袭：本条从哪条经文沿用了哪个词，形如 `[{ "from": "pan_2.1.22", "term": "tatpuruṣaḥ" }]`。**不是领句，不进主图**，只在详情页显示；`from` 必须存在，缺 `term` 时给出警告 |
| `sequence` | array | ✗ | 后继经文（自然序列关系）|
| `updatedAt` | number | ✗ | 时间戳（毫秒），**不要手动填写**，运行 `npm run stamp` 自动补全 |

### 文本换行与断行

长梵文词需要手动标记换行点，避免在错误位置断行。支持三种方式：

| 标记 | 作用 | 何时显示 |
|------|------|--------|
| `\|` | 可选换行点 | 仅在容器窄小时换行，不显示连字符 |
| `-` | 复合词分隔 | `-` 后紧跟字母时自动添加换行点（如 `yoga-yoga-` 中每个 `-` 后） |
| `\n` | 分段 | 强制另起一段，段与段之间留出空白 |

**例子**：
```json
{
  "text": "niṣṭhāyām|aṇy|adarthe.",
  "notes": "长注释中可以|在任何地方|标记换行点"
}
```

### 文本格式与样式

经文文本支持以下 Markdown 格式自动转换并加粗显示关键词：

#### 加粗文本
```
**词汇** → 渲染为加粗
```

#### 外部链接
```
[文本](url) → 渲染为带链接的文本（新标签页打开）
```

#### Wiki 内部链接
```
[[pan_1.1.1]] → 链接到对应的经文详情页
[[dssk_15]] → 支持所有来源
```

### 卡片样式优化

- **固定高度**：所有经文卡片统一高度 180px，排列整齐
- **文本截断**：
  - 原文最多显示 4 行，超长内容用省略号截断
  - 汉译最多显示 2 行



### wiki 链接与 references 规则

文本中提到的 ID 必须在某个关系字段中出现，支持灵活的方式：

```json
{ "text": "见 [[pan_1.1.26]]", "references": ["pan_1.1.26"] }
{ "notes": "相关内容见 [[dssk_15]]", "parallel": ["dssk_15"] }
{ "notes": "之后是 [[pan_1.1.5]]", "sequence": ["pan_1.1.5"] }
{ "notes": "参见 [[pan_6.4.1]]", "adhikaras": ["pan_6.4.1"] }
```

验证脚本检查（`npm run validate`）：

**Error（`isValid = false`，脚本 `exit(1)`）**：
- 文本字段（`text`、`translation`、`duanExplain`、`notes`）中的 `[[id]]` 不在 `references`、`parallel`、`commentaryOn`、`sequence`、`adhikaras`、`anuvrtti` 任何一个中（或按下面的特殊规则可解析）
- `references` / `parallel` / `commentaryOn` / `sequence` / `adhikaras` / `anuvrtti.from` 中包含不存在的经文 ID
- `references` 中有孤立 ID（没有在文本字段中被 `[[]]` 提及）
- `scope` 格式错误：`from` / `to` 不是 `6.3.1` 形式的编号，`from` 不等于本条自身编号，或 `from` 大于 `to`
- `translation`、`duanExplain`、`notes` 三个字段全为空（内容未完成，不应部署）

**特殊验证规则（类 adhikāra 关系）**：
- **jkv ↔ pan 关系**：提到 `[[jkv_x.x.x]]` 但关系字段中有 `pan_x.x.x` → 有效（因为 jkv 是 pan 的注释，相同编号的 pan 相当于 jkv 的 adhikāra）
- **parallel / commentaryOn 传递引用**：提到 `[[经文B]]` 但关系字段中有经文B的某个 parallel、commentaryOn 或注释者 → 有效（引用平行或注释相当于引用本体）
- **平行经文的领句**：提到的经文是当前经文某个平行/注释经文的领句（直接或间接）→ 有效。常见于 dssk 的注释里提到对应 pan 经文的领句

**Warning（仅提示，不影响通过）**：
- `parallel` 指向的经文不是 Pāṇini / Kātantra（如 dssk–kat 对应）：请确认是否应改为 `commentaryOn`，或确认为保留的对应
- `sequence` 字段为空（建议补充，使经文串联）
- `draft` 字段不为空（可能有内容未编辑完成）
- `anuvrtti` 条目缺少 `term`（沿用的词）


## 界面功能

### 经文列表页 `/sutras`
- **排序选项**：经文按来源分组显示，每组默认展示前 10 条，可"查看更多"展开
- **模糊搜索**：搜索范围覆盖经文 ID、原文、翻译、段书讲解、按语

### 图谱页 `/atlas`
- **自动适配**：打开时自动缩放到合适比例，显示所有经文节点
- **交互操作**：拖拽节点调整位置，滚轮缩放，拖动背景平移
- **搜索高亮**：输入关键词匹配节点高亮，ESC 清除搜索
- **连线说明**：

| 颜色 | 类型 | 含义 |
|------|------|------|
| 深灰实线 | reference | 引用经文 |
| 橙色虚线 | parallel | 平行文本（多文献对应或注释关系）|
| 紫色点线 | commentary | 注释（注释方指向被注释的经文）|
| 红色实线 | adhikara | Adhikāra 领句（管辖关系）|
| 青色实线 | sequence | 后继经文（自然序列）|

注释条目（jkv、dsv）默认不进主图，勾选"显示注释"后才显示；它们的关系在对应经文的详情页关系图里可以看到。

区间领句（带 `scope` 的经文）在图上以虚线色带框出其管辖范围，成员不逐条连线。`anuvrtti`（承袭）不进图，只在详情页显示。

## 经文来源与颜色

| 来源 | 前缀 | 显示 | 颜色 | 特点 |
|------|------|------|------|------|
| Pāṇini Aṣṭādhyāyī | `pan_` | PS | 深蓝 #1e3a8a | 主要梵语语法 |
| Kātantra | `kat_` | Kāt | 绿色 #059669 | 简化版梵语语法 |
| Kāśikāvṛṭti | `jkv_` | JKv | 中蓝 #3b82f6 | Pāṇini 的注释 |
| 段晴《波你尼语法入门》 | `dssk_` | DSSK | 浅蓝 #93c5fd | 基于中文参考书，与 Pāṇini 的注释关系 |
| Durgasiṃhavṛtti | `dsv_` | DSV | 浅绿 #34d399 | Kātantra 的注释（梵文注 + 险狮子注汉译），编号与经文一致 |


## 工作流

### 常用命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动本地开发服务器 (http://localhost:4321/Sanskrit/) |
| `npm run validate` | 检查所有经文的 wiki 链接和 references 一致性 |
| `npm run stamp` | 给修改过的经文 JSON 更新 `updatedAt` 时间戳（基于文件修改时间） |
| `npm run build` | 生产构建（生成静态 HTML） |

### 添加/修改经文

```bash
# 1. 编辑 src/content/sutras/{source}/{id}.json

# 2. 验证引用 + 打时间戳
npm run validate
npm run stamp

# 3. 提交推送（自动部署到 GitHub Pages）
git add GrammarAtlas/src/content/
git commit -m "Add sutra: pan_1.1.1"
git push origin master
```

**时间戳说明**：`updatedAt` 记录文件真实修改时间（不是 stamp 运行时间），只更新修改过的文件，不依赖 git 状态。


## 关于本项目

本项目由 [zhangxueshan246](https://github.com/zhangxueshan246) 与 Claude AI 共同开发，旨在为梵语语法学习者提供一个可视化的经文关系图谱工具。

**数据说明**：
- Pāṇini、Kātantra、Kāśikāvṛṭti 基于对应原典的学习笔记
- 段晴《波你尼语法入门》部分基于同名中文参考书，而非原始梵文文献


## 开源协议

- **代码**：[MIT License](LICENSE) - 允许自由使用、修改和分发
- **数据**：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) - 经文数据可自由使用，需注明出处

详见 [LICENSE](LICENSE) 文件。


## 目录结构

```
GrammarAtlas/
├── src/
│   ├── content/                    ← 经文数据（JSON格式）
│   │   └── sutras/
│   │       ├── panini/
│   │       ├── dssk/
│   │       ├── katantra/
│   │       ├── dsv/
│   │       ├── jkv/
│   │       └── other/
│   ├── types/
│   │   └── sutra.ts                ← TypeScript 类型定义
│   ├── components/
│   │   ├── SutraGraph.tsx          ← D3.js 图谱组件
│   │   ├── SutraMiniGraph.tsx      ← 详情页关系小图
│   │   ├── SutraMiniGraphPanel.tsx ← 小图面板
│   │   └── SutraListControls.tsx   ← 搜索排序组件
│   ├── pages/
│   │   ├── index.astro             ← 首页
│   │   ├── atlas.astro             ← 图谱页面
│   │   ├── sutras.astro            ← 列表页面
│   │   ├── about.astro             ← 关于 / 版权与引用
│   │   ├── 404.astro               ← 404 页面
│   │   └── sutra/[id].astro        ← 经文详情页
│   ├── utils/
│   │   ├── getSutras.ts            ← 数据访问层
│   │   ├── adhikara.ts             ← 区间领句（scope）计算
│   │   ├── stampSutras.ts          ← 给 JSON 补全 updatedAt 时间戳
│   │   ├── validateReferences.ts   ← 验证脚本
│   │   ├── searchSutras.ts         ← Fuse.js 搜索
│   │   ├── sortSutras.ts           ← 排序工具
│   │   ├── formatSutraId.ts        ← ID 格式化
│   │   ├── previewText.ts          ← 卡片预览文本
│   │   └── parseWikiLinks.ts       ← Wiki 链接解析
│   ├── layouts/
│   │   └── Layout.astro            ← 基础布局
│   └── styles/
│       └── global.css              ← 全局样式
├── public/                         ← 静态文件（favicon、robots.txt、sitemap.xml）
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```
