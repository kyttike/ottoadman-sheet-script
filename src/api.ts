export function fetchJson(url: string): unknown {
  return JSON.parse(UrlFetchApp.fetch(url).getContentText());
}
