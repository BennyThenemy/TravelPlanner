export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function interpolateDate(prev: string | undefined, next: string | undefined): string {
  const today = new Date().toISOString().split('T')[0];
  if (!prev && !next) return today;
  if (!prev) return addDays(next!, -1);
  if (!next) return addDays(prev, 1);
  const a = new Date(prev + 'T00:00:00');
  const b = new Date(next + 'T00:00:00');
  const diff = b.getTime() - a.getTime();
  if (diff <= 86400000) {
    // same day or 1 day apart: keep prev date
    return prev;
  }
  const mid = new Date(a.getTime() + diff / 2);
  return mid.toISOString().split('T')[0];
}

export function blobToObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
