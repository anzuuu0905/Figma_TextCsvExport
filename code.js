figma.showUI(__html__, { width: 400, height: 500 });

// シンボルを安全に文字列に変換する関数
function safeStringify(value) {
  if (typeof value === 'symbol') {
    return value.toString().replace('Symbol(', '').replace(')', '');
  }
  return String(value || '');
}

// カラー情報を16進数に変換する関数
function rgbToHex(color) {
  if (!color) return '';
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// 全ページのテキストレイヤーを取得する非同期関数
async function getAllTextNodes() {
  let allTextNodes = [];

  // すべてのページを読み込む
  await figma.loadAllPagesAsync();

  for (const page of figma.root.children) {
    try {
      const textNodes = page.findAllWithCriteria({
        types: ['TEXT']
      });

      // シンボルインスタンス内のテキストを除外
      const filteredNodes = textNodes.filter(node => {
        let currentParent = node.parent;
        while (currentParent) {
          if (currentParent.type === "INSTANCE") {
            return false;
          }
          currentParent = currentParent.parent;
        }
        return true;
      });

      allTextNodes = allTextNodes.concat(filteredNodes);
    } catch (error) {
      console.error(`Error accessing page: ${error}`);
    }
  }

  console.log(`全テキストノード数: ${allTextNodes.length}（シンボルインスタンス内のテキストは除外済み）`);
  return allTextNodes;
}

// メイン処理を非同期関数で包む
(async () => {
  try {
    const allTextNodes = await getAllTextNodes();

    // データを抽出して整形
    const extractedData = [
      {
        // Basic Info
        id: 'ID',
        name: 'Name',
        pageName: 'PageName',
        frame1: 'ParentFrame',
        characters: 'Characters',

        // Position
        alignmentHorizontal: 'AlignmentHorizontal',
        alignmentVertical: 'AlignmentVertical',
        positionX: 'PositionX',
        positionY: 'PositionY',
        transform: 'Transform',

        // Layout
        width: 'Width',
        height: 'Height',

        // Appearance
        opacity: 'Opacity',
        cornerRadius: 'CornerRadius',

        // Typography
        fontFamily: 'FontFamily',
        fontStyle: 'FontStyle',
        fontSize: 'FontSize',
        lineHeight: 'LineHeight',
        letterSpacing: 'LetterSpacing',
        textAlignHorizontal: 'TextAlignHorizontal',
        textAlignVertical: 'TextAlignVertical',

        // Fill
        fillColor: 'FillColor',
        fillOpacity: 'FillOpacity'
      },
      ...allTextNodes
        .filter(node => !node.id.includes(';'))
        .map(node => {
          let topLevelFrame = '';
          let parent = node.parent;
          let pageName = '';

          while (parent) {
            if (parent.type === "PAGE") {
              pageName = parent.name;
              break;
            }
            if (parent.type === "FRAME" && parent.parent.type === "PAGE") {
              topLevelFrame = parent.name;
            }
            parent = parent.parent;
          }

          // カラー情報の取得
          let fillColor = '';
          let fillOpacity = '';
          if (node.fills && node.fills.length > 0 && node.fills[0].type === 'SOLID') {
            fillColor = rgbToHex(node.fills[0].color);
            fillOpacity = node.fills[0].opacity !== undefined ?
              Math.round(node.fills[0].opacity * 100) + '%' :
              '100%';
          }

          // フォント情報の安全な取得
          const fontName = node.fontName || {};
          const fontFamily = fontName.family || '';
          const fontStyle = fontName.style || '';

          try {
            return {
              // Basic Info
              id: node.id || '',
              name: node.name || '',
              pageName: pageName,
              frame1: topLevelFrame,
              characters: node.characters || '',

              // Position
              alignmentHorizontal: node.layoutAlign || '',
              alignmentVertical: node.layoutMode || '',
              positionX: Math.round(node.x || 0),
              positionY: Math.round(node.y || 0),
              transform: Math.round(node.rotation || 0),

              // Layout
              width: Math.round(node.width || 0),
              height: Math.round(node.height || 0),

              // Appearance
              opacity: Math.round((node.opacity || 1) * 100) + '%',
              cornerRadius: Math.round(node.cornerRadius || 0),

              // Typography
              fontFamily: fontFamily,
              fontStyle: fontStyle,
              fontSize: Math.round(node.fontSize || 0),
              lineHeight: typeof node.lineHeight === 'object' ?
                Math.round(node.lineHeight.value) + (node.lineHeight.unit || 'px') :
                'AUTO',
              letterSpacing: typeof node.letterSpacing === 'object' ?
                Math.round(node.letterSpacing.value) + (node.letterSpacing.unit || 'px') :
                '0%',
              textAlignHorizontal: node.textAlignHorizontal || '',
              textAlignVertical: node.textAlignVertical || '',

              // Fill
              fillColor: fillColor,
              fillOpacity: fillOpacity
            };
          } catch (error) {
            console.error('Error processing node:', node.id, error);
            return null;
          }
        })
        .filter(Boolean) // null値を除外
    ];

    // フィルタリング結果のログ出力
    console.log('エクスポート統計:', {
      '全テキストノード数': allTextNodes.length,
      'エクスポート対象数': extractedData.length - 1,
      '除外されたノード数': allTextNodes.length - (extractedData.length - 1)
    });

    // データをコンソールに出力して確認
    console.log('Extracted Data:', JSON.stringify(extractedData[1], null, 2));

    // UIにデータを送信
    figma.ui.postMessage({
      type: 'send-text-data',
      data: extractedData
    });

  } catch (error) {
    console.error('Error in main process:', error);
    figma.notify('エラーが発生しました: ' + error.message, { error: true });
  }
})();

// UIからのメッセージを受け取る
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-data') {
    try {
      const headers = msg.data[0];
      const rows = msg.data.slice(1);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // IDとテキストのインデックスを取得
      const idIndex = headers.indexOf('ID');
      const textIndex = headers.indexOf('Characters');

      for (const row of rows) {
        try {
          const id = row[idIndex];
          const newText = row[textIndex];

          if (!id || !newText) continue;

          // ノードの取得
          const node = await figma.getNodeByIdAsync(id);
          if (!node || node.type !== "TEXT") {
            throw new Error(`ID: ${id} のテキストノードが見つかりません`);
          }

          // シンボルインスタンス内のテキストをチェック
          let currentParent = node.parent;
          while (currentParent) {
            if (currentParent.type === "INSTANCE") {
              throw new Error(`ID: ${id} はシンボルインスタンス内のテキストです`);
            }
            currentParent = currentParent.parent;
          }

          // フォントの読み込み
          await figma.loadFontAsync(node.fontName);

          // テキストの更新
          node.characters = newText;
          successCount++;

        } catch (error) {
          errorCount++;
          errors.push(`${error.message}`);
        }
      }

      // 結果の通知
      if (errorCount > 0) {
        figma.notify(`⚠️ ${successCount}件成功、${errorCount}件失敗\n${errors[0]}`,
          { timeout: 5000 });
      } else {
        figma.notify(`✅ ${successCount}件のテキストを更新しました`);
      }

      figma.ui.postMessage({
        type: 'import-complete',
        count: successCount
      });

    } catch (error) {
      console.error('Import error:', error);
      figma.ui.postMessage({
        type: 'import-error',
        message: error.message
      });
    }
  }
};
