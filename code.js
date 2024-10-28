// code.js
figma.showUI(__html__);

function getTextLayersInFrame(node) {
  let textProperties = [];

  if (!node.visible) {
    return textProperties;
  }

  if (node.type === "TEXT") {
    textProperties.push({
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
      textProperties = textProperties.concat(getTextLayersInFrame(child));
    }
  }

  return textProperties;
}


// CSV形式に変換する関数
function convertToCSV(data) {
  const headers = [
    "ID", "Name", "Characters", "Font Size", "Font Family", "Font Style",
    "Text Align Horizontal", "Text Align Vertical", "Line Height", "Letter Spacing",
    "Text Case", "Text Decoration"
  ];

  const rows = data.map(item => [
    item.id,
    item.name,
    item.characters,
    item.fontSize,
    item.fontFamily,
    item.fontStyle,
    item.textAlignHorizontal,
    item.textAlignVertical,
    item.lineHeight,
    item.letterSpacing,
    item.textCase,
    item.textDecoration
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(value => `"${value}"`).join(","))
  ].join("\n");

  console.log("CSV Content Created:", csvContent); // デバッグ用のログ
  return csvContent;
}


// データ抽出およびCSV送信
function extractTextPropertiesFromFrame() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: "error", message: "No frame フレームが選択されていません." });
    return;
  }

  let allTextProperties = [];

  for (const node of selection) {
    if (node.type === "FRAME" || node.type === "GROUP") {
      allTextProperties = allTextProperties.concat(getTextLayersInFrame(node));
    }
  }

  if (allTextProperties.length === 0) {
    figma.ui.postMessage({ type: "error", message: "選択したフレームにテキストレイヤーが見つかりません." });
  } else {
    const csvData = convertToCSV(allTextProperties);
    console.log("Sending CSV Data to UI"); // メッセージ送信の確認
    figma.ui.postMessage({ type: "csv", data: csvData });
  }
}

extractTextPropertiesFromFrame();
