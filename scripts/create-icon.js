const fs = require('fs');
const path = require('path');

// 创建 16x16 的 RGBA 像素数据
const size = 16;
const pixels = Buffer.alloc(size * size * 4, 0); // BGRA 格式

// 绘制一个简单的勾选标记图标
// 背景：蓝色 (#2196F3)
// 勾选标记：白色

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = ((size - 1 - y) * size + x) * 4; // BMP是底部向上的
  pixels[idx] = b;     // B
  pixels[idx + 1] = g; // G
  pixels[idx + 2] = r; // R
  pixels[idx + 3] = a; // A
}

// 填充蓝色圆角背景
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    // 简单的圆角矩形检测
    const corners = [[0,0],[0,15],[15,0],[15,15]];
    let isCorner = false;
    for (const [cx, cy] of corners) {
      if (Math.abs(x - cx) < 2 && Math.abs(y - cy) < 2) {
        isCorner = true;
        break;
      }
    }
    if (!isCorner) {
      setPixel(x, y, 0x21, 0x96, 0xF3, 255); // 蓝色背景
    }
  }
}

// 绘制白色勾选标记 ✓
const checkmark = [
  [3, 7], [4, 8], [5, 9], [6, 10],  // 勾的左边短划
  [7, 9], [8, 8], [9, 7], [10, 6], [11, 5], [12, 4]  // 勾的右边长划
];
for (const [x, y] of checkmark) {
  setPixel(x, y, 255, 255, 255, 255);
  setPixel(x, y+1, 255, 255, 255, 255); // 加粗
}

// 构建 ICO 文件
// ICO Header (6 bytes)
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);    // Reserved
icoHeader.writeUInt16LE(1, 2);    // Type: 1 = ICO
icoHeader.writeUInt16LE(1, 4);    // Count: 1 image

// ICO Directory Entry (16 bytes)
const bmpInfoSize = 40;
const pixelDataSize = size * size * 4;
const maskSize = size * Math.ceil(size / 32) * 4; // AND mask
const imageSize = bmpInfoSize + pixelDataSize + maskSize;
const dataOffset = 6 + 16; // header + 1 directory entry

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(size, 0);      // Width
dirEntry.writeUInt8(size, 1);      // Height
dirEntry.writeUInt8(0, 2);         // Color palette
dirEntry.writeUInt8(0, 3);         // Reserved
dirEntry.writeUInt16LE(1, 4);      // Color planes
dirEntry.writeUInt16LE(32, 6);     // Bits per pixel
dirEntry.writeUInt32LE(imageSize, 8);  // Image size
dirEntry.writeUInt32LE(dataOffset, 12); // Data offset

// BMP Info Header (40 bytes)
const bmpInfo = Buffer.alloc(40);
bmpInfo.writeUInt32LE(40, 0);       // Header size
bmpInfo.writeInt32LE(size, 4);      // Width
bmpInfo.writeInt32LE(size * 2, 8);  // Height (doubled for ICO)
bmpInfo.writeUInt16LE(1, 12);       // Planes
bmpInfo.writeUInt16LE(32, 14);      // Bit count
bmpInfo.writeUInt32LE(0, 16);       // Compression
bmpInfo.writeUInt32LE(pixelDataSize + maskSize, 20); // Image size
bmpInfo.writeInt32LE(0, 24);        // X pixels per meter
bmpInfo.writeInt32LE(0, 28);        // Y pixels per meter
bmpInfo.writeUInt32LE(0, 32);       // Colors used
bmpInfo.writeUInt32LE(0, 36);       // Important colors

// AND mask (全0 = 全不透明，让alpha通道处理透明度)
const andMask = Buffer.alloc(maskSize, 0);

// 组合 ICO 文件
const ico = Buffer.concat([icoHeader, dirEntry, bmpInfo, pixels, andMask]);

// 确保 assets 目录存在
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'tray-icon.ico'), ico);
console.log('Icon created successfully at: ' + path.join(assetsDir, 'tray-icon.ico'));
console.log('File size: ' + ico.length + ' bytes');
