/**
 * Build runtime payload for data-data-query-ref binding.
 * No Tailwind arbitrary values — JSON only; injector fills DOM.
 */
export type DataQueryLite = {
  id: string;
  description: string;
  sorting?: string;
  filtering?: string;
  dataSource?: string;
};

export type RuntimePayload = {
  byRef: Record<
    string,
    {
      columns: string[];
      rows: string[][];
      source: 'mock' | 'embedded';
    }
  >;
};

/** Composite ref nodeId::queryId */
function ref(nodeId: string, queryId: string): string {
  return `${nodeId}::${queryId}`;
}

/**
 * Generate mock table data from dataQueries descriptions (deterministic, preview-only).
 */
export function buildDataQueryRuntimePayload(params: {
  nodeId: string;
  dataQueries: DataQueryLite[] | undefined;
  /** Explicit rows by query id (optional real data later) */
  rowsByQueryId?: Record<string, string[][]>;
}): RuntimePayload {
  const byRef: RuntimePayload['byRef'] = {};
  const { nodeId, dataQueries = [], rowsByQueryId } = params;

  for (const q of dataQueries) {
    const key = ref(nodeId, q.id);
    const embedded = rowsByQueryId?.[q.id];
    if (embedded && embedded.length > 0) {
      const colCount = Math.max(...embedded.map((r) => r.length));
      const columns = Array.from({ length: colCount }, (_, i) => `列 ${i + 1}`);
      byRef[key] = { columns, rows: embedded, source: 'embedded' };
      continue;
    }
    // Mock from description: 2 columns fixed + rows as synthetic list
    const desc = (q.description || '数据').slice(0, 40);
    const rows: string[][] = [
      [desc || '示例 1', '进行中'],
      ['示例 2', '待处理'],
      ['示例 3', '完成'],
    ];
    if (q.filtering) {
      rows[0][1] = '已筛选';
    }
    byRef[key] = {
      columns: ['名称', '状态'],
      rows,
      source: 'mock',
    };
  }

  return { byRef };
}

export function runtimePayloadToScript(payload: RuntimePayload): string {
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<script type="application/json" id="data-query-runtime">${json}</script>`;
}
