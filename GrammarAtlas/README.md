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
└── jkv/
```

**基本结构**：
```json
{
  "id": "pan_1.1.1",
  "text": "经文原文 [[ref_id]]",
  "translation": "翻译",
  "vrtti": "注释",
  "notes": "笔记\n支持多行",
  "source": "panini",
  "references": ["ref_id"],
  "parallel": ["other_id"],
  "adhikaras": ["adhikara_id"],
  "sequence": ["next_id"],
  "updatedAt": 1743638400000
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 经文ID (例: `pan_1.1.1`) |
| `text` | string | ✓ | 经文原文，支持 `[[id]]` wiki链接、`\n` 强制换行、`\|` 可选换行点、`-` 后自动添加断点 |
| `translation` | string | ✗ | 中英翻译，同样支持 wiki 链接和换行标记 |
| `vrtti` | string | ✗ | Vṛtti 注释/讲解 |
| `notes` | string | ✗ | 个人笔记 |
| `source` | enum | ✓ | `panini` \| `katantra` \| `jkv` \| `dssk` \| `other` |
| `references` | array | ✗ | 引用经文 ID 数组 |
| `parallel` | array | ✗ | 平行文本（其他文献的对应经文）|
| `adhikaras` | array | ✗ | Adhikāra 领句（管辖此经的）|
| `sequence` | array | ✗ | 后继经文（自然序列关系）|
| `updatedAt` | number | ✗ | 时间戳（毫秒），**不要手动填写**，运行 `npm run stamp` 自动补全 |

### 文本换行与断行

长梵文词需要手动标记换行点，避免在错误位置断行。支持三种方式：

| 标记 | 作用 | 何时显示 |
|------|------|--------|
| `\|` | 可选换行点 | 仅在容器窄小时换行，显示连字符 `-` |
| `-` | 复合词分隔 | 自动在 `-` 后添加换行点（如 `yoga-yoga-` 中每个 `-` 后） |
| `\n` | 强制换行 | 总是换行（无连字符） |

**例子**：
```json
{
  "text": "niṣṭhāyām|aṇy|adarthe.",
  "notes": "长注释中可以|在任何地方|标记换行点"
}
```

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
- 文本中的 `[[id]]` 不在 `references`、`parallel`、`sequence`、`adhikaras` 任何一个中
- `references` / `parallel` / `sequence` / `adhikaras` 中包含不存在的经文 ID
- `references` 中有孤立 ID（没有在文本字段中被 `[[]]` 提及）
- `translation`、`vrtti`、`notes` 三个字段全为空（内容未完成，不应部署）

**特殊验证规则（类 adhikāra 关系）**：
- **jkv ↔ pan 关系**：提到 `[[jkv_x.x.x]]` 但 references 中有 `pan_x.x.x` → 有效（因为 jkv 是 pan 的注释，相同编号的 pan 相当于 jkv 的 adhikāra）
- **parallel 传递引用**：提到 `[[经文B]]` 但 references 中有经文B的某个 parallel → 有效（引用 parallel 相当于引用本体）

**Warning（仅提示，不影响通过）**：
- `sequence` 字段为空（建议补充，使经文串联）
- `draft` 字段不为空（可能有内容未编辑完成）


## 界面功能

### 经文列表页 `/sutras`
- **排序选项**：按来源分组（默认）或按 ID 自然数字排序
- **模糊搜索**：搜索范围覆盖经文 ID、原文、翻译、注释、笔记

### 图谱页 `/atlas`
- **自动适配**：打开时自动缩放到合适比例，显示所有经文节点
- **交互操作**：拖拽节点调整位置，滚轮缩放，拖动背景平移
- **搜索高亮**：输入关键词匹配节点高亮，ESC 清除搜索
- **连线说明**：

| 颜色 | 类型 | 含义 |
|------|------|------|
| 深灰实线 | reference | 引用经文 |
| 橙色虚线 | parallel | 平行文本（多文献对应或注释关系）|
| 红色实线 | adhikara | Adhikāra 领句（管辖关系）|
| 青色实线 | sequence | 后继经文（自然序列）|

## 经文来源与颜色

| 来源 | 前缀 | 显示 | 颜色 | 特点 |
|------|------|------|------|------|
| Pāṇini Aṣṭādhyāyī | `pan_` | PS | 深蓝 #1e3a8a | 主要梵语语法 |
| Kātantra | `kat_` | Kāt | 绿色 #059669 | 简化版梵语语法 |
| Kāśikāvṛṭti | `jkv_` | JKv | 中蓝 #3b82f6 | Pāṇini 的注释 |
| 段晴《波你尼语法入门》 | `dssk_` | DSSK | 浅蓝 #93c5fd | 基于中文参考书 |


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
│   │       └── jkv/
│   ├── types/
│   │   └── sutra.ts                ← TypeScript 类型定义
│   ├── components/
│   │   ├── SutraGraph.tsx          ← D3.js 图谱组件
│   │   └── SutraListControls.tsx   ← 搜索排序组件
│   ├── pages/
│   │   ├── index.astro             ← 首页
│   │   ├── atlas.astro             ← 图谱页面
│   │   ├── sutras.astro            ← 列表页面
│   │   └── sutra/[id].astro        ← 经文详情页
│   ├── utils/
│   │   ├── getSutras.ts            ← 数据访问层
│   │   ├── stampSutras.ts          ← 给 JSON 补全 updatedAt 时间戳
│   │   ├── validateReferences.ts   ← 验证脚本
│   │   ├── searchSutras.ts         ← Fuse.js 搜索
│   │   ├── sortSutras.ts           ← 排序工具
│   │   ├── formatSutraId.ts        ← ID 格式化
│   │   └── parseWikiLinks.ts       ← Wiki 链接解析
│   ├── layouts/
│   │   └── Layout.astro            ← 基础布局
│   └── styles/
│       └── global.css              ← 全局样式
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```
