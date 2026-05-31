/**
 * Appends ?groupId=<id> to a URL path when groupId is provided.
 * Correctly merges with existing query strings (e.g. ?weekKey=...).
 *
 * Examples:
 *   withGroupId('/manager/group', 'abc')        → '/manager/group?groupId=abc'
 *   withGroupId('/manager/group?weekKey=X', 'abc') → '/manager/group?weekKey=X&groupId=abc'
 *   withGroupId('/manager/group', null)          → '/manager/group'
 */
export function withGroupId(path: string, groupId: string | null | undefined): string {
  if (!groupId) return path;

  const [base, existingQuery] = path.split('?');
  const params = new URLSearchParams(existingQuery ?? '');
  params.set('groupId', groupId);
  return `${base}?${params.toString()}`;
}
