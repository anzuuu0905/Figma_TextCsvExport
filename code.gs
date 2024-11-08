function doPost(e) {
  try {
    const { spreadsheetId, sheetName, data } = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.openById(spreadsheetId)
                               .getSheetByName(sheetName);

    // ヘッダー行の定義（code.jsと同じ順序）
    const headers = [
      // Basic Info
      'ID',
      'Name',
      'PageName',
      'ParentFrame',
      'Characters',

      // Position
      'AlignmentHorizontal',
      'AlignmentVertical',
      'PositionX',
      'PositionY',
      'Transform',

      // Layout
      'Width',
      'Height',

      // Appearance
      'Opacity',
      'CornerRadius',

      // Typography
      'FontFamily',
      'FontStyle',
      'FontSize',
      'LineHeight',
      'LetterSpacing',
      'TextAlignHorizontal',
      'TextAlignVertical',

      // Fill
      'FillColor',
      'FillOpacity'
    ];

    // ヘッダー行を書き込み
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // データを2次元配列に変換（code.jsと同じ順序）
    const values = data.slice(1).map(item => [
      // Basic Info
      item.id || '',
      item.name || '',
      item.pageName || '',
      item.frame1 || '',
      item.characters || '',

      // Position
      item.alignmentHorizontal || '',
      item.alignmentVertical || '',
      item.positionX || '',
      item.positionY || '',
      item.transform || '',

      // Layout
      item.width || '',
      item.height || '',

      // Appearance
      item.opacity || '',
      item.cornerRadius || '',

      // Typography
      item.fontFamily || '',
      item.fontStyle || '',
      item.fontSize || '',
      item.lineHeight || '',
      item.letterSpacing || '',
      item.textAlignHorizontal || '',
      item.textAlignVertical || '',

      // Fill
      item.fillColor || '',
      item.fillOpacity || ''
    ]);

    // データを2行目から書き込み
    if (values.length > 0) {
      sheet.getRange(2, 1, values.length, headers.length).setValues(values);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `${values.length} 件のデータを書き込みました`
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
