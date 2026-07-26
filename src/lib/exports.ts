const KEY = "foundriq:exported-pdfs:v1";

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markExported(id: string) {
  try {
    const s = read();
    s.add(id);
    localStorage.setItem(KEY, JSON.stringify(Array.from(s)));
    window.dispatchEvent(new CustomEvent("foundriq:exports-changed"));
  } catch {
    /* ignore */
  }
}

export function getExportedSet(): Set<string> {
  return read();
}
