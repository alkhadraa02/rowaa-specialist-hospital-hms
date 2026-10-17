export type InteractionRow = { genericA: string; genericB: string; severity: string; noteAr: string; noteEn: string };
export type InteractionHit = InteractionRow;

const norm = (s: string) => s.trim().toLowerCase();

/** Check a newly prescribed generic against the patient's other active generics using the seeded table. */
export function checkInteractions(newGeneric: string, current: string[], table: InteractionRow[]): InteractionHit[] {
  const n = norm(newGeneric);
  const others = new Set(current.map(norm));
  return table.filter((r) => {
    const a = norm(r.genericA);
    const b = norm(r.genericB);
    return (a === n && others.has(b)) || (b === n && others.has(a));
  });
}

const RANK: Record<string, number> = { CONTRAINDICATED: 3, MAJOR: 2, MODERATE: 1 };

export function worstSeverity(hits: InteractionHit[]) {
  return hits.reduce((w, h) => ((RANK[h.severity] ?? 0) > (RANK[w] ?? -1) ? h.severity : w), "");
}
