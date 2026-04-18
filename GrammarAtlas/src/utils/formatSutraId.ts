/**
 * 格式化经文ID的显示，将 pan_7.2.115 转换为 PS 7.2.115
 * @param id 原始ID，如 "pan_7.2.115"
 * @returns 格式化后的显示文本，如 "PS 7.2.115"
 */
export function formatSutraId(id: string): string {
  // 前缀映射表
  const prefixMap: Record<string, string> = {
    'pan': 'PS',      // Pāṇini Sūtra
    'kat': 'Kāt',     // Kātantra
    'jkv': 'JKv',     // Kāśikāvṛṭti
    'dssk': 'DSSK',   // 段晴《波你尼语法入门》
  };

  // 找到第一个下划线
  const underscoreIndex = id.indexOf('_');
  if (underscoreIndex === -1) {
    return id; // 没有下划线，直接返回
  }

  const prefix = id.substring(0, underscoreIndex);
  const rest = id.substring(underscoreIndex + 1);

  const displayPrefix = prefixMap[prefix] || prefix.toUpperCase();
  return `${displayPrefix} ${rest}`;
}
