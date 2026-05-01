import { formatSutraId } from './formatSutraId';

/**
 * 解析文本中的 Wiki 式链接 [[id]] 并处理换行符
 * 将 \n 转换为 <br/> 标签，将 wiki 链接转换为可点击的 HTML 链接
 * 为长的梵文词汇插入软连字符（软断字符），使浏览器在自动换行时显示连字符
 */
export function parseWikiLinks(text: string): string {
  if (!text) return '';

  // 步骤 1：将 - 后插入 <wbr>，使其成为可选断点
  let result = text.replace(/-(?=[a-zA-Z])/g, '-<wbr>');

  // 步骤 2：将手动断点标记 | 转换为 <wbr> 标签
  result = result.replace(/\|/g, '<wbr>');

  // 步骤 3：将 \n 转换为 <br/> 标签（强制换行）
  result = result.replace(/\n/g, '<br/>');

  // 步骤 4：正则表达式匹配 [[sutra_id]] 格式
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

  result = result.replace(wikiLinkRegex, (match, sutraId) => {
    const displayText = formatSutraId(sutraId);
    const href = `/Sanskrit/sutra/${sutraId}`;
    return `<a href="${href}" class="sutra-link">${displayText}</a>`;
  });

  return result;
}
