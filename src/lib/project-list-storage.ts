/**
 * 首页「我的项目」列表：localStorage 持久化，供 Stitch 首页左侧栏与工具栏「保存到我的项目」使用。
 */

const PROJECT_LIST_KEY = 'fractal-project-list';
const PROJECT_DATA_PREFIX = 'fractal-project-data-';

export interface ProjectListItem {
  id: string;
  name: string;
  updatedAt: string; // ISO
}

function safeParse<T>(json: string | null, fallback: T): T {
  if (json == null || json === '') return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function getProjectList(): ProjectListItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const raw = window.localStorage.getItem(PROJECT_LIST_KEY);
  const list = safeParse<ProjectListItem[]>(raw, []);
  return Array.isArray(list) ? list : [];
}

export function getProjectData(id: string): { nodes: unknown[]; edges: unknown[] } | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(PROJECT_DATA_PREFIX + id);
  const data = safeParse<{ nodes?: unknown[]; edges?: unknown[] }>(raw, {});
  if (!data || !Array.isArray(data.nodes)) return null;
  return {
    nodes: data.nodes,
    edges: Array.isArray(data.edges) ? data.edges : [],
  };
}

export function saveProjectToList(
  id: string,
  name: string,
  payload: { nodes: unknown[]; edges: unknown[] }
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const list = getProjectList();
  const existing = list.find((p) => p.id === id);
  const item: ProjectListItem = {
    id,
    name: name.trim() || '未命名项目',
    updatedAt: new Date().toISOString(),
  };
  const next = existing
    ? list.map((p) => (p.id === id ? item : p))
    : [...list, item];
  next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  window.localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(next));
  window.localStorage.setItem(PROJECT_DATA_PREFIX + id, JSON.stringify(payload));
}

export function removeProjectFromList(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const list = getProjectList().filter((p) => p.id !== id);
  window.localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(list));
  window.localStorage.removeItem(PROJECT_DATA_PREFIX + id);
}
