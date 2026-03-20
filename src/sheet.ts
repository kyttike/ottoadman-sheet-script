export function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)!;
}
