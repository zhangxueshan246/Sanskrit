# Vyākaraṇa Atlas

梵语语法经文可视化图谱，展示 Pāṇini Aṣṭādhyāyī、Kātantra、Kāśikāvṛṭti 等语法书之间的关系网络。

## 🚀 技术栈

- **框架**：Astro v6 + React 18
- **数据**：JSON 文件存储（直接 fs 读取）
- **类型检查**：TypeScript strict
- **可视化**：D3.js 力导向图
- **搜索**：Fuse.js 模糊搜索
- **部署**：GitHub Pages


## 本地运行

```bash
cd GrammarAtlas
npm install
npm run dev
```

访问 http://localhost:4321/Sanskrit/

## 如何添加经文

### 新方式：使用 JSON 文件（推荐）

从 Astro v6 开始，每个经文存储为独立的 JSON 文件，更加清晰易维护。

**基本结构**：
```json
// src/content/sutras/panini/pan_1.1.1.json
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
| `vrtti` | string | ✗ | 注释/讲解 |
| `notes` | string | ✗ | 个人笔记 |
| `source` | enum | ✓ | `panini` \| `katantra` \| `jkv` \| `dssk` \| `other` |
| `references` | array | ✓ | 引用ID数组（至少 `[]`） |
| `parallel` | array | ✗ | 其他文献的对应经文 |
| `adhikaras` | array | ✗ | 管辖此经的 adhikāra |
| `sequence` | array | ✗ | 后继经文（自然序列关系） |
| `updatedAt` | number | ✗ | 时间戳（毫秒），**不要手动填写**，提交前运行 `npm run stamp` 自动补全 |

**添加步骤**：

1. **创建文件** — 根据 `source` 放在对应目录
   ```bash
   src/content/sutras/
   ├── panini/
   │   └── pan_1.1.1.json        ← 新建在这里
   ├── dssk/
   ├── katantra/
   └── jkv/
   ```

2. **填充数据** — 使用上面的 JSON 模板

3. **验证一致性** — 确保 wiki 链接和 references 一致
   ```bash
   npm run validate
   ```

4. **打上时间戳** — 确保 `updatedAt` 字段正确（GitHub Pages 不保留文件时间）
   ```bash
   npm run stamp
   ```

5. **本地预览** — 查看效果
   ```bash
   npm run dev
   # 访问 http://localhost:4321/Sanskrit/
   ```

6. **提交推送** — GitHub Actions 自动部署
   ```bash
   git add src/content/sutras/
   git commit -m "Add new sutra: pan_1.1.1"
   git push origin master
   ```

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

**工作原理**：
- 宽屏幕 → 不显示 `|` 或 `-`，正常显示（无换行）
- 窄屏幕 → 在标记点处换行，显示连字符 `-`
- 如果没有标记 → 长词自动在容器边缘折断（无连字符）

**编辑建议**：
1. 编写经文时，先不加 `|`
2. 本地预览（`npm run dev`），在窄屏看效果
3. 发现不合理的断行？在那些地方加 `|`
4. 刷新页面验证

### wiki 链接与 references 规则

文本中提到的 ID 必须在某个关系字段中出现，支持灵活的方式：

```json
{
  "text": "见 [[pan_1.1.26]] 的说明",
  "references": ["pan_1.1.26"]     // 方式1：加到 references
}

// 或
{
  "notes": "相关内容见 [[dssk_15]]",
  "parallel": ["dssk_15"]          // 方式2：加到 parallel
}

// 或
{
  "notes": "之后是 [[pan_1.1.5]]",
  "sequence": ["pan_1.1.5"]        // 方式3：加到 sequence
}

// 或
{
  "notes": "参见 [[pan_6.4.1]]",
  "adhikaras": ["pan_6.4.1"]       // 方式4：加到 adhikaras
}
```

### 验证引用一致性

```bash
npm run validate
```

脚本检查：
- ✓ `text`/`translation`/`vrtti`/`notes` 中的所有 `[[id]]` 都在 `references`、`parallel`、`sequence` 或 `adhikaras` 中
- ✓ `references` 中的 ID 都是存在的经文
- ✓ `references` 中没有孤立 ID（都要在任何一个文本字段中提及）


## 搜索和排序

### 经文列表页 `/sutras`

- **排序选项**：
  - **按来源分组**（默认）：按 Pāṇini → Kātantra → Kāśikāvṛṭti → 段晴《波你尼语法入门》 分组
  - **按经文顺序**：按ID的自然数字排序（PS 1.1.26 → PS 1.4.14 → PS 3.1.124...）

- **模糊搜索**：
  - 搜索范围：经文ID、原文、中文翻译、注释、笔记
  - 搜索时自动取消分组，显示扁平结果
  - 结果实时计数

### 图谱页 `/atlas`

- **搜索功能**：
  - 在图谱顶部输入框搜索经文（🔍 搜索标签）
  - 匹配的节点：高亮发光（蓝色阴影）
  - 不匹配的节点：淡化显示（opacity 0.2）
  - 实时显示搜索结果计数（当前/总计）
  - ESC键或清空按钮清除搜索
  - 所有D3交互（拖拽、点击）保留

## 图谱中的连线说明

| 颜色 | 类型 | 含义 |
|------|------|------|
| 深灰实线 | reference | 经文互相引用 |
| 橙色虚线 | parallel | 多文献对应或注释关系 |
| 红色实线 | adhikara | 管辖关系 |
| 青色实线 | sequence | 自然序列（后继关系） |

## 经文来源与颜色

| 来源 | 前缀 | 显示 | 颜色 | 特点 |
|------|------|------|------|------|
| Pāṇini Aṣṭādhyāyī | `pan_` | PS | 深蓝 #1e3a8a | 主要梵语语法 |
| Kātantra | `kat_` | Kāt | 绿色 #059669 | 简化版梵语语法 |
| Kāśikāvṛṭti | `jkv_` | JKv | 中蓝 #3b82f6 | Pāṇini 的注释 |
| 段晴《波你尼语法入门》 | `dssk_` | DSSK | 浅蓝 #93c5fd | 基于中文参考书 |

## 部署与更新工作流

### 自动部署
- 推送到 GitHub 后自动部署到 GitHub Pages（https://zhangxueshan246.github.io/Sanskrit/）
- 工作流配置：`.github/workflows/deploy.yml`
- 首次需要在仓库 Settings → Pages 中选择 GitHub Actions 作为 Source

### 更新流程
```bash
# 1. 编辑或新建 src/content/sutras/{source}/{id}.json
cd GrammarAtlas

# 2. 验证与打时间戳（必须！）
npm run validate     # 检查 wiki 链接和 references 一致性
npm run stamp        # 用文件系统修改时间更新所有文件的 updatedAt

# 3. 本地预览
npm run dev         # 本地预览 http://localhost:4321/Sanskrit/

# 4. 返回项目根并提交
cd ..
git add GrammarAtlas/
git commit -m "简明的描述"  # 例：Add 5 new DSSK sutras
git push origin master     # 自动触发部署
```

### 常用命令
| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动本地开发服务器 (http://localhost:4321/Sanskrit/) |
| `npm run stamp` | 给新经文 JSON 补全 `updatedAt` 时间戳（已有的不覆盖） |
| `npm run validate` | 检查所有经文的 wiki 链接和 references 一致性 |
| `npm run build` | 生产构建（生成静态 HTML） |
| `npm run preview` | 预览构建后的网站 |

### 快速工作流

```bash
# 1. 新增经文
# 编辑 src/content/sutras/{source}/{id}.json

# 2. 验证 + 打时间戳
npm run validate     # 应该看到 "✅ 所有经文引用检查通过！"
npm run stamp        # 给新文件补全 updatedAt

# 3. 本地预览
npm run dev
# 访问 http://localhost:4321/Sanskrit/sutra/{id}

# 4. 提交
git add src/content/
git commit -m "Add sutra: {id}"
git push origin master   # 自动部署到 GitHub Pages
```

⚠️ **重要提示**
- 每次新增或修改经文后**必须运行** `npm run validate` 和 `npm run stamp`
- **提交前本地测试** `npm run dev` 查看效果
- 避免频繁小提交，验证通过后再 push

## 关于本项目

本项目由 [zhangxueshan246](https://github.com/zhangxueshan246) 与 Claude AI 共同开发，旨在为梵语语法学习者提供一个可视化的经文关系图谱工具。

**数据说明**：
- Pāṇini、Kātantra、Kāśikāvṛṭti 基于对应原典的学习笔记
- 段晴《波你尼语法入门》部分基于同名中文参考书，而非原始梵文文献



## 目录结构

```
GrammarAtlas/
├── src/
│   ├── content/                    ← 经文数据（JSON格式）
│   │   └── sutras/
│   │       ├── panini/             ← Pāṇini sutras
│   │       ├── dssk/               ← DSSK sutras
│   │       ├── katantra/           ← Kātantra sutras
│   │       └── jkv/                ← Kāśikāvṛṭti sutras
│   ├── types/
│   │   └── sutra.ts                ← TypeScript 类型定义
│   ├── data/                       ← （已删除，改用 content/）
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
├── astro.config.mjs                ← Astro 配置
├── tsconfig.json                   ← TypeScript 配置
├── package.json                    ← 依赖管理
└── README.md                       ← 本文件
```

