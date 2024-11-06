function doGet(e) {
  const spreadsheetId = e.parameter.spreadsheetId;
  const sheetName = e.parameter.sheetName;

  try {
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('指定されたシートが見つかりません');
    }

    // A1セルの値を取得してログ出力
    const a1Value = sheet.getRange('A1').getValue();
    console.log('A1セルの値:', a1Value);

    // データ範囲を取得
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

    // スプレッドシートのデータをオブジェクトの配列に変換
    const importData = values
      .map(row => ({
        pageName: row[0] || '',
        frame1: row[1] || '',
        id: row[2] || '',
        name: row[3] || '',
        characters: row[4] || '',
        fontSize: row[5] || '',
        fontFamily: row[6] || '',
        fontStyle: row[7] || '',
        textColor: row[8] || '',
        textOpacity: row[9] || '',
        textAlignHorizontal: row[10] || '',
        textAlignVertical: row[11] || '',
        lineHeight: row[12] || '',
        letterSpacing: row[13] || '',
        textCase: row[14] || '',
        textDecoration: row[15] || ''
      }))
      .filter(row => row.id); // IDが存在するデータのみを返す

    if (importData.length === 0) {
      throw new Error('有効なデータが見つかりません（IDが必要です）');
    }

    // JSONとしてデータを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: importData
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
