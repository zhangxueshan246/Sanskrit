/**
 * 首页卡片用的纯文本摘要：去掉 **粗体** 与 [[id]] 标记，只取第一段，超长截断
 */
export function previewText(text: string | undefined, max = 90): string {
  if (!text) return '';
  const plain = text
    .replace(/\*\*/g, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .split(/\n+/)[0]
    .trim();
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}
