figma.showUI(__html__, {
  width: 300,
  height: 200
});

figma.ui.onmessage = (msg) => {
  if (msg.type === 'extract') {
    extractTextPropertiesFromFrame();
  }
};

function getTextLayersInFrame(node, pageName, framePaths = []) {
  let textProperties = [];

  if (!node.visible) {
    return textProperties;
  }

  // 現在のフレームパスを配列に追加
  const currentFramePaths = [...framePaths, node.name];

  if (node.type === "TEXT") {
    // 5段階のフレーム名を作成
    const frame1 = currentFramePaths[0] || '';
    const frame2 = currentFramePaths[1] || '';
    const frame3 = currentFramePaths[2] || '';
    const frame4 = currentFramePaths[3] || '';
    // 5段階目は残りの全てのパスを結合
    const frame5 = currentFramePaths.slice(4).join(' / ') || '';

    textProperties.push({
      pageName: pageName,
      frame1: frame1,
      frame2: frame2,
      frame3: frame3,
      frame4: frame4,
      frame5: frame5,
      id: node.id,
      name: node.name,
      characters: node.characters.replace(/\n/g, "<br>"),
      fontSize: node.fontSize,
      fontFamily: node.fontName.family,
      fontStyle: node.fontName.style,
      textAlignHorizontal: node.textAlignHorizontal,
      textAlignVertical: node.textAlignVertical,
      lineHeight: node.lineHeight ? node.lineHeight.value : "",
      letterSpacing: node.letterSpacing ? node.letterSpacing.value : "",
      textCase: node.textCase,
      textDecoration: node.textDecoration
    });
  } else if (node.type === "FRAME" || node.type === "GROUP") {
    for (const child of node.children) {
      textProperties = textProperties.concat(
        getTextLayersInFrame(child, pageName, currentFramePaths)
      );
    }
  }

  return textProperties;
}

// CSV形式に変換する関数も更新
function convertToCSV(data) {
  const headers = [
    "Page Name",
    "Frame Level 1",
    "Frame Level 2",
    "Frame Level 3",
    "Frame Level 4",
    "Frame Level 5",
    "ID", "Name", "Characters", "Font Size", "Font Family", "Font Style",
    "Text Align Horizontal", "Text Align Vertical", "Line Height", "Letter Spacing",
    "Text Case", "Text Decoration"
  ];

  const rows = data.map(item => [
    item.pageName || '',
    item.frame1 || '',
    item.frame2 || '',
    item.frame3 || '',
    item.frame4 || '',
    item.frame5 || '',
    item.id || '',
    item.name || '',
    item.characters || '',
    item.fontSize || '',
    item.fontFamily || '',
    item.fontStyle || '',
    item.textAlignHorizontal || '',
    item.textAlignVertical || '',
    item.lineHeight || '',
    item.letterSpacing || '',
    typeof item.textCase === 'symbol' ? item.textCase.toString().replace('Symbol(', '').replace(')', '') : (item.textCase || ''),
    typeof item.textDecoration === 'symbol' ? item.textDecoration.toString().replace('Symbol(', '').replace(')', '') : (item.textDecoration || '')
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  return csvContent;
}


// データ抽出およびCSV送信

function extractTextPropertiesFromFrame() {
  let allTextProperties = [];

  // 全てのページをループ
  for (const page of figma.root.children) {
    // ページ内の全てのフレームをループ
    for (const node of page.children) {
      if (node.type === "FRAME" || node.type === "GROUP") {
        // 空の配列を初期パスとして渡す（最初のフレーム名は含めない）
        const frameProperties = getTextLayersInFrame(node, page.name, []);
        allTextProperties = allTextProperties.concat(frameProperties);
      }
    }
  }

  if (allTextProperties.length === 0) {
    figma.ui.postMessage({ type: "error", message: "ドキュメント内にテキストレイヤーが見つかりません。" });
  } else {
    const csvData = convertToCSV(allTextProperties);
    console.log("Sending CSV Data to UI");
    figma.ui.postMessage({ type: "csv", data: csvData });
  }
}
extractTextPropertiesFromFrame();
