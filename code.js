figma.showUI(__html__, { width: 300, height: 200 });

// テキストレイヤーを全て取得
const textNodes = figma.currentPage.findAllWithCriteria({
  types: ['TEXT']
});

// データを抽出して整形
const extractedData = [
  // ヘッダー行
  {
    fileName: 'ファイル名',    // 追加：Figmaファイル名
    pageName: 'ページ名',      // Figmaページ名
    frame1: '最上位フレーム',  // 最上位
    frame2: '2階層目',
    frame3: '3階層目',
    frame4: '4階層目',
    frame5: '最下位フレーム',  // 最下位
    id: 'ID',
    name: '名前',
    characters: 'テキスト',
    fontSize: 'フォントサイズ',
    fontFamily: 'フォントファミリー',
    fontStyle: 'フォントスタイル',
    textAlignHorizontal: '水平位置',
    textAlignVertical: '垂直位置',
    lineHeight: '行高',
    letterSpacing: '文字間隔',
    textCase: 'テキストケース',
    textDecoration: 'テキスト装飾'
  },
  ...textNodes.map(node => {
    // 親フレームの階層を取得（最大5階層まで）
    const parents = [];
    let parent = node.parent;
    while (parent && parents.length < 5) {
      parents.push(parent.name || '');  // 下位から順に追加
      parent = parent.parent;
    }

    // 5階層分の配列を確保（足りない分は空文字で埋める）
    while (parents.length < 5) {
      parents.push('');
    }

    // 配列を反転して最上位を先頭にする
    parents.reverse();

    return {
      fileName: figma.root.name,  // Figmaファイル名を追加
      pageName: figma.currentPage.name,
      frame1: parents[0],  // 最上位フレーム
      frame2: parents[1],
      frame3: parents[2],
      frame4: parents[3],
      frame5: parents[4],  // 最下位フレーム
      id: node.id,
      name: node.name,
      characters: node.characters,
      fontSize: node.fontSize,
      fontFamily: node.fontName.family,
      fontStyle: node.fontName.style,
      textAlignHorizontal: node.textAlignHorizontal,
      textAlignVertical: node.textAlignVertical,
      lineHeight: typeof node.lineHeight === 'object' ? node.lineHeight.value + node.lineHeight.unit : 'AUTO',
      letterSpacing: typeof node.letterSpacing === 'object' ? node.letterSpacing.value + node.letterSpacing.unit : '0%',
      textCase: node.textCase,
      textDecoration: node.textDecoration
    };
  })
];
// UIにデータを送信
figma.ui.postMessage({
  type: 'send-text-data',
  data: extractedData
});

// UIからのメッセージを受け取る
figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case 'complete':
      figma.notify('✅ ' + msg.message);
      break;

    case 'error':
      figma.notify('❌ ' + msg.message, { error: true });
      break;

    case 'close':
      figma.closePlugin();
      break;
  }
};
