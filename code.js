figma.showUI(__html__, { width: 300, height: 200 });

// 全ページのテキストレイヤーを取得
let allTextNodes = [];
figma.root.children.forEach(page => {
  const textNodes = page.findAllWithCriteria({
    types: ['TEXT']
  });
  allTextNodes = allTextNodes.concat(textNodes);
});

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

// データを抽出して整形
const extractedData = [
  {
    pageName: 'ページ名',
    frame1: 'フレーム1',
    id: 'ID',
    name: '名前',
    characters: 'テキスト',
    fontSize: 'フォントサイズ',
    fontFamily: 'フォント',
    fontStyle: 'スタイル',
    textColor: 'テキストカラー',
    textOpacity: '不透明度',
    textAlignHorizontal: '横位置',
    textAlignVertical: '縦位置',
    lineHeight: '行高',
    letterSpacing: '字間',
    textCase: '大文字/小文字',
    textDecoration: '装飾'
  },
  ...allTextNodes.map(node => {
    // 最上位のフレームを取得
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
    let textColor = '';
    let textOpacity = '';
    if (node.fills && node.fills.length > 0 && node.fills[0].type === 'SOLID') {
      textColor = rgbToHex(node.fills[0].color);
      textOpacity = node.fills[0].opacity !== undefined ?
        Math.round(node.fills[0].opacity * 100) + '%' :
        '100%';
    }

    return {
      pageName: safeStringify(pageName),
      frame1: safeStringify(topLevelFrame),
      id: safeStringify(node.id),
      name: safeStringify(node.name),
      characters: safeStringify(node.characters),
      fontSize: safeStringify(node.fontSize),
      fontFamily: safeStringify(node.fontName.family),
      fontStyle: safeStringify(node.fontName.style),
      textColor: textColor,
      textOpacity: textOpacity,
      textAlignHorizontal: safeStringify(node.textAlignHorizontal),
      textAlignVertical: safeStringify(node.textAlignVertical),
      lineHeight: typeof node.lineHeight === 'object' ?
        safeStringify(node.lineHeight.value) + safeStringify(node.lineHeight.unit) :
        'AUTO',
      letterSpacing: typeof node.letterSpacing === 'object' ?
        safeStringify(node.letterSpacing.value) + safeStringify(node.letterSpacing.unit) :
        '0%',
      textCase: safeStringify(node.textCase || 'ORIGINAL'),
      textDecoration: safeStringify(node.textDecoration || 'NONE')
    };
  })
];

// データをコンソールに出力して確認
console.log('Extracted Data:', JSON.stringify(extractedData[1], null, 2));

// UIにデータを送信
figma.ui.postMessage({
  type: 'send-text-data',
  data: extractedData
});

// UIからのメッセージを受け取る
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'import-data':
      try {
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        console.log('インポートデータ:', msg.data);

        for (const row of msg.data) {
          try {
            if (!row.id) continue;

            const node = figma.getNodeById(row.id);
            if (!node || node.type !== "TEXT") {
              throw new Error(`ID: ${row.id} のテキストノードが見つかりません`);
            }

            // 現在のフォントを読み込み
            await figma.loadFontAsync(node.fontName);

            // テキストの内容だけを更新
            if (row.characters !== undefined) {
              node.characters = row.characters;
              successCount++;
              console.log(`更新成功: ID ${row.id}, テキスト: ${row.characters}`);
            }

          } catch (error) {
            console.error(`Error updating node:`, error);
            errorCount++;
            errors.push(`ID ${row.id}: ${error.message}`);
          }
        }

        if (errorCount > 0) {
          figma.notify(`⚠️ ${successCount}件成功、${errorCount}件失敗\n${errors[0]}`, { timeout: 5000 });
        } else {
          figma.notify(`✅ ${successCount}件のテキストを更新しました`);
        }

        figma.ui.postMessage({
          type: 'import-complete',
          count: successCount
        });

      } catch (error) {
        console.error('Import error:', error);
        figma.notify('❌ インポートエラー: ' + error.message, { error: true });
        figma.ui.postMessage({
          type: 'import-error',
          message: error.message
        });
      }
      break;
  }
};
