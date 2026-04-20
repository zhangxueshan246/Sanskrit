import { formatSutraId } from './formatSutraId';

/**
 * 解析文本中的 Wiki 式链接 [[id]] 并处理换行符
 * 将 \n 转换为 <br/> 标签，将 wiki 链接转换为可点击的 HTML 链接
 */
export function parseWikiLinks(text: string): string {
  if (!text) return '';

  // 步骤 1：将换行符 \n 转换为 <br/> 标签
  let result = text.replace(/\n/g, '<br/>');

  // 步骤 2：正则表达式匹配 [[sutra_id]] 格式
  // 例如：[[pan_1.1.26]] 或 [[kat_2.3.4]]
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

  result = result.replace(wikiLinkRegex, (match, sutraId) => {
    // sutraId 例如：pan_1.1.26 → 格式化为 PS 1.1.26
    const displayText = formatSutraId(sutraId);
    const href = `/Sanskrit/sutra/${sutraId}`;

    // 返回 HTML 链接，使用现有的 .sutra-link 样式类
    return `<a href="${href}" class="sutra-link">${displayText}</a>`;
  });

  return result;
}
