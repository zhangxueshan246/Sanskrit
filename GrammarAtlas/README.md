# Grammar Atlas

梵语语法经文可视化图谱，展示 Pāṇini Aṣṭādhyāyī、Kātantra、Kāśikāvṛṭti 等语法书之间的关系网络。

## 本地运行

```bash
cd GrammarAtlas
npm install
npm run dev
```

访问 http://localhost:4321/Sanskrit/

## 如何添加经文

编辑 `src/data/sutras.ts` 文件。基本结构和字段说明：

```typescript
"pan_1.1.4": {
  id: "pan_1.1.4",                // 经文 ID（必填）
  text: "na dhātulopa ārdhadhātuke",  // 经文原文（必填）
  source: "panini",               // 来源（必填）: panini|katantra|jkv|dssk|other
  translation: "翻译",            // 翻译（选填）
  vrtti: "注释",                  // 注释（选填）
  notes: "笔记\n支持多行",         // 笔记（选填，支持 wiki 链接 [[id]] 和 \n 换行）
  references: ["pan_1.1.3"],      // 引用 ID 数组（必填，至少 []）
  adhikaras: ["pan_1.1.1"],       // 管辖此经的 adhikāra（选填，支持多层）
  parallel: ["kat_1.1.7"],        // 对应文献（选填，建议双向）
}
```

### 关键规则

1. **Wiki 链接与 references 同步**
   - 在 `notes`/`translation`/`vrtti` 中用 `[[经文ID]]` 链接
   - 所有链接的 ID **必须也加到** `references` 数组
   - 验证脚本会自动检查一致性

   ```typescript
   notes: "见 [[pan_1.1.26]]",
   references: ["pan_1.1.26"]  // 必填
   ```

2. **多行笔记** — 用 `\n` 分隔
   ```typescript
   notes: "第一行\n第二行\n第三行"
   ```

3. **多层 adhikāra** — 可被多个 adhikāra 管辖
   ```typescript
   adhikaras: ["pan_6.4.1", "pan_6.1.72"]
   ```
   验证脚本会检查**所有层级**的 adhikara，例如如果 `pan_6.4.77` 引用了 `pan_6.4.1`，而 `pan_6.4.1` 本身的 adhikara 包括某条经文，那么这个间接引用也是有效的。

4. **对应/注释关系** — `parallel` 建议**双向**写
   ```typescript
   // dssk_552 注释 pan_3.1.124
   "dssk_552": { parallel: ["pan_3.1.124"], ... }
   "pan_3.1.124": { parallel: ["dssk_552"], ... }  // 不要漏掉！
   ```
   这样用户可从任一经文跳转到另一方，图谱也更清晰。

### 验证引用一致性

```bash
npm run validate
```

脚本检查：
- ✓ `notes` 中的 `[[id]]` 都在 `references` 或任何层级的 `adhikaras` 中
- ✓ `references` 中的 ID 都是存在的经文
- ✓ `references` 中没有孤立 ID（都要在 notes 中提及）

## 搜索和排序

### 经文列表页 `/sutras`

- **排序选项**：
  - **按来源分组**（默认）：按 Pāṇini → Kātantra → Kāśikāvṛṭti → Sārasiddhāntakaumudī 分组
  - **按经文顺序**：按ID的自然数字排序（pan_1.1.26 → pan_1.4.14 → pan_3.1.124...）

- **模糊搜索**：
  - 搜索范围：经文ID、原文、中文翻译、笔记
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
| 灰色实线 | reference | 经文互相引用 |
| 橙色虚线 | parallel | 多文献对应或注释关系 |
| 红色实线 | adhikara | 管辖关系 |

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
# 1. 编辑 src/data/sutras.ts（或其他文件）
cd GrammarAtlas

# 2. 验证与本地测试（必须！）
npm run validate     # 检查 wiki 链接和 references 一致性
npm run dev         # 本地预览 http://localhost:4321/Sanskrit/

# 3. 返回项目根并提交
cd ..
git add GrammarAtlas/
git commit -m "简明的描述"  # 例：Add 5 new DSSK sutras
git push origin master     # 自动触发部署
```

### 常用命令
| 命令 | 用途 |
|------|------|
| `npm run validate` | 检查 wiki 链接和 references 一致性 |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 本地构建测试 |
| `npm run preview` | 预览构建结果 |

⚠️ **重要提示**
- 每次编辑后**必须运行** `npm run validate`
- **提交前本地测试** `npm run dev` 查看效果
- 避免频繁小提交，稳定后再 push

## 关于本项目

本项目由 [zhangxueshan246](https://github.com/zhangxueshan246) 与 Claude AI 共同开发，旨在为梵语语法学习者提供一个可视化的经文关系图谱工具。

**数据说明**：
- Pāṇini、Kātantra、Kāśikāvṛṭti 基于对应原典的学习笔记
- 段晴《波你尼语法入门》部分基于同名中文参考书，而非原始梵文文献



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
