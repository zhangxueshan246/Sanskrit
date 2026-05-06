import { formatSutraId } from './formatSutraId';

const CJK_RE = '\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF';
const LATIN_RE = 'A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF'; // 含梵文转写扩展拉丁（ṛ ṭ ḍ ṇ ṅ ṣ ḥ ṃ 等）
const THIN = '\u2009';

function addCJKSpacing(text: string): string {
  return text
    .replace(new RegExp(`([${CJK_RE}])([${LATIN_RE}])`, 'gu'), `$1${THIN}$2`)
    .replace(new RegExp(`([${LATIN_RE}])([${CJK_RE}])`, 'gu'), `$1${THIN}$2`);
}

/**
 * 解析文本中的 Wiki 式链接 [[id]] 并处理换行符
 * 将 \n 转换为 <br/> 标签，将 wiki 链接转换为可点击的 HTML 链接
 * 为长的梵文词汇插入软连字符（软断字符），使浏览器在自动换行时显示连字符
 */
export function parseWikiLinks(text: string): string {
  if (!text) return '';

  // 步骤 0：在汉字与拉丁字符边界自动插入细空格
  let result = addCJKSpacing(text);

  // 步骤 1：将 - 后插入 <wbr>，使其成为可选断点
  result = result.replace(/-(?=[a-zA-Z])/g, '-<wbr>');

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
