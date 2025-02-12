// UIの初期化
figma.showUI(__html__, { width: 400, height: 200 });

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

// テキストレイヤーを取得する非同期関数
async function getTextNodes() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    console.log('選択なし: 全テキストを取得');
    return await getAllTextNodes();
  } else {
    console.log('フレーム選択: 選択内のテキストを取得');
    return await getSelectedFrameTextNodes(selection);
  }
}

// 全フレームのテキストレイヤーを取得する非同期関数
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

// 選択されたフレーム内のテキストレイヤーを取得する非同期関数
async function getSelectedFrameTextNodes(selection) {
  let textNodes = [];

  for (const selected of selection) {
    if (selected.type === "FRAME" || selected.type === "GROUP") {
      console.log(`選択されたフレーム/グループ: ${selected.name}`);

      // 選択されたフレーム/グループ内のテキストを直接検索
      const foundNodes = selected.findAllWithCriteria({ types: ['TEXT'] });

      // シンボルインスタンス内のテキストを除外
      const filteredNodes = foundNodes.filter(node => {
        let currentParent = node.parent;
        while (currentParent) {
          if (currentParent.type === "INSTANCE") {
            return false;
          }
          currentParent = currentParent.parent;
        }
        return true;
      });

      textNodes = textNodes.concat(filteredNodes);
      console.log(`フレーム "${selected.name}" 内のテキスト数: ${filteredNodes.length}`);
    }
  }

  return textNodes;
}

// テキストノードのスタイル情報を安全に取得する関数
function getTextStyleInfo(node) {
  let fontSize = 'Mixed';
  let fontFamily = 'Mixed';
  let fontStyle = 'Mixed';
  let lineHeight = 'Mixed';
  let letterSpacing = 'Mixed';
  let textAlignHorizontal = 'Mixed';
  let textAlignVertical = 'Mixed';
  let fillColor = 'Mixed';
  let fillOpacity = 'Mixed';
  let positionX = Math.round(node.x * 100) / 100;
  let positionY = Math.round(node.y * 100) / 100;

  // フォントサイズ
  if (typeof node.fontSize !== 'symbol') {
    fontSize = node.fontSize || 0;
  }

  // フォントファミリーとスタイル
  if (node.fontName && typeof node.fontName !== 'symbol') {
    fontFamily = node.fontName.family || '';
    fontStyle = node.fontName.style || '';
  }

  // 行の高さ
  if (node.lineHeight && typeof node.lineHeight !== 'symbol') {
    if (typeof node.lineHeight === 'object') {
      if (node.lineHeight.value !== undefined && !isNaN(node.lineHeight.value)) {
        lineHeight = node.lineHeight.value + (node.lineHeight.unit || 'px');
      } else {
        lineHeight = 'AUTO';
      }
    } else {
      lineHeight = 'AUTO';
    }
  }

  // 文字間隔
  if (node.letterSpacing && typeof node.letterSpacing !== 'symbol') {
    if (typeof node.letterSpacing === 'object') {
      letterSpacing = Math.round(node.letterSpacing.value) + (node.letterSpacing.unit || 'px');
    } else {
      letterSpacing = '0%';
    }
  }

  // テキストの配置
  if (typeof node.textAlignHorizontal !== 'symbol') {
    textAlignHorizontal = node.textAlignHorizontal || '';
  }
  if (typeof node.textAlignVertical !== 'symbol') {
    textAlignVertical = node.textAlignVertical || '';
  }

  // カラー情報
  if (node.fills &&
      node.fills.length > 0 &&
      typeof node.fills !== 'symbol' &&
      node.fills[0].type === 'SOLID') {
    fillColor = rgbToHex(node.fills[0].color);
    fillOpacity = node.fills[0].opacity !== undefined ?
      Math.round(node.fills[0].opacity * 100) + '%' :
      '100%';
  }

  return {
    fontSize,
    fontFamily,
    fontStyle,
    lineHeight,
    letterSpacing,
    textAlignHorizontal,
    textAlignVertical,
    fillColor,
    fillOpacity,
    positionX,
    positionY
  };
}

// データを抽出して整形する関数
async function extractTextData(textNodes) {
  if (textNodes.length === 0) {
    return [];
  }

  const extractedData = [
    {
      // ヘッダー情報
      id: 'ID',
      name: 'Name',
      pageName: 'PageName',
      frame1: 'ParentFrame',
      characters: 'Characters',
      fontFamily: 'FontFamily',
      fontStyle: 'FontStyle',
      fontSize: 'FontSize',
      lineHeight: 'LineHeight',
      letterSpacing: 'LetterSpacing',
      textAlignHorizontal: 'TextAlignHorizontal',
      textAlignVertical: 'TextAlignVertical',
      fillColor: 'FillColor',
      fillOpacity: 'FillOpacity',
      positionX: 'PositionX',
      positionY: 'PositionY'
    },
    ...textNodes
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

        // スタイル情報を取得
        const styleInfo = getTextStyleInfo(node);

        return {
          id: node.id || '',
          name: node.name || '',
          pageName: pageName,
          frame1: topLevelFrame,
          characters: node.characters || '',
          fontSize: styleInfo.fontSize,
          fontFamily: styleInfo.fontFamily,
          fontStyle: styleInfo.fontStyle,
          lineHeight: styleInfo.lineHeight,
          letterSpacing: styleInfo.letterSpacing,
          textAlignHorizontal: styleInfo.textAlignHorizontal,
          textAlignVertical: styleInfo.textAlignVertical,
          fillColor: styleInfo.fillColor,
          fillOpacity: styleInfo.fillOpacity,
          positionX: styleInfo.positionX,
          positionY: styleInfo.positionY
        };
      })
      .filter(Boolean)
  ];

  return extractedData;
}

// テキストデータを処理して送信する関数
async function processAndSendTextData(textNodes, source = '') {
  if (textNodes.length === 0) {
    figma.notify('テキストレイヤーが見つかりませんでした');
    figma.ui.postMessage({
      type: 'send-text-data',
      data: []
    });
    return;
  }

  const extractedData = await extractTextData(textNodes);

  // フィルタリング結果のログ出力
  const isSelected = figma.currentPage.selection.length > 0;
  console.log(`${source} エクスポート統計:`, {
    [isSelected ? '選択フレーム内のテキストノード数' : '全テキストノード数']: textNodes.length,
    'エクスポート対象数': extractedData.length - 1,
    '除外されたノード数': textNodes.length - (extractedData.length - 1)
  });

  // UIにデータを送信
  figma.ui.postMessage({
    type: 'send-text-data',
    data: extractedData
  });
}

// 選択変更時のイベントリスナー
figma.on('selectionchange', async () => {
  try {
    const textNodes = await getTextNodes();
    await processAndSendTextData(textNodes, 'Selection Change');
  } catch (error) {
    console.error('Error in selection change:', error);
    figma.notify('エラーが発生しました: ' + error.message);
  }
});

// メイン処理（初期ロード時）
(async () => {
  try {
    const textNodes = await getTextNodes();
    await processAndSendTextData(textNodes, 'Initial Load');
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

      const idIndex = headers.indexOf('ID');
      const textIndex = headers.indexOf('Characters');

      for (const row of rows) {
        try {
          const id = row[idIndex];
          const newText = row[textIndex];

          if (!id || !newText) continue;

          const node = await figma.getNodeByIdAsync(id);
          if (!node || node.type !== "TEXT") {
            throw new Error(`ID: ${id} のテキストノードが見つかりません`);
          }

          let currentParent = node.parent;
          while (currentParent) {
            if (currentParent.type === "INSTANCE") {
              throw new Error(`ID: ${id} はシンボルインスタンス内のテキストです`);
            }
            currentParent = currentParent.parent;
          }

          await figma.loadFontAsync(node.fontName);
          node.characters = newText;
          successCount++;

        } catch (error) {
          errorCount++;
          errors.push(`${error.message}`);
        }
      }

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
  } else if (msg.type === 'clear-selection') {
    figma.currentPage.selection = [];
    try {
      const textNodes = await getAllTextNodes();
      await processAndSendTextData(textNodes, 'Clear Selection');
    } catch (error) {
      console.error('Error in clear selection:', error);
      figma.notify('エラーが発生しました: ' + error.message);
    }
  }
};
