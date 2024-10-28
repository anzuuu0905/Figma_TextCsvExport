
// code.js
figma.showUI(__html__);

async function sendDataToSheet(data) {
  const url = "https://script.google.com/macros/s/AKfycbxMdPpFqSPrFBDPubJHKMOCxP_u0CVCMx2EVGY5s_vw83FWWgqg6TSgnYnkltU6Mjgv/exec";

  console.log("Sending data to Google Sheets:", data); // 送信前デバッグ用

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.text();
    console.log("Google Sheet Response:", result); // レスポンス確認
  } catch (error) {
    console.error("Error sending data to Google Sheets:", error); // エラー確認
  }
}


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

function extractTextPropertiesFromFrame() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: "error", message: "No frame selected." });
    return;
  }

  let allTextProperties = [];

  for (const node of selection) {
    if (node.type === "FRAME" || node.type === "GROUP") {
      allTextProperties = allTextProperties.concat(getTextLayersInFrame(node));
    }
  }

  if (allTextProperties.length === 0) {
    figma.ui.postMessage({ type: "error", message: "No text layers found in the selected frame." });
  } else {
    sendDataToSheet(allTextProperties); // Google Sheetsにデータを送信
  }
}

extractTextPropertiesFromFrame();
