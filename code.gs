function doPost(e) {
  try {
    const { spreadsheetId, sheetName, data, action } = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(spreadsheetId)
                               .getSheetByName(sheetName);

    // インポートの場合
    if (action === 'import') {
      // 2行目から最終行までのデータを取得（1行目はヘッダー）
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

      // スプレッドシートのデータをオブジェクトの配列に変換
      const importData = values.map(row => ({
        pageName: row[0],
        frame1: row[1],
        id: row[2],
        name: row[3],
        characters: row[4],
        fontSize: row[5],
        fontFamily: row[6],
        fontStyle: row[7],
        textColor: row[8],
        textOpacity: row[9],
        textAlignHorizontal: row[10],
        textAlignVertical: row[11],
        lineHeight: row[12],
        letterSpacing: row[13],
        textCase: row[14],
        textDecoration: row[15]
      })).filter(row => row.id); // IDが存在するデータのみを返す

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: importData
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    // エクスポートの場合（既存のコード）
    const values = data.map(item => [
      item.pageName || '',
      item.frame1 || '',
      item.id || '',
      item.name || '',
      item.characters || '',
      item.fontSize || '',
      item.fontFamily || '',
      item.fontStyle || '',
      item.textColor || '',
      item.textOpacity || '',
      item.textAlignHorizontal || '',
      item.textAlignVertical || '',
      item.lineHeight === 'AUTO' ? 'AUTO' : (item.lineHeight || ''),
      item.letterSpacing === '0%' ? '0%' : (item.letterSpacing || ''),
      item.textCase || '',
      item.textDecoration || ''
    ]);

    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, values[0].length)
         .setValues(values);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      processedRows: values.length
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
  }
}
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
