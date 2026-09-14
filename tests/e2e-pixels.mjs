// Screenshot helpers for the Electron end-to-end checks: decode Chromium's PNG screenshots in Node
// (no page code or data URLs involved) and compare two captures of the same region.
import { inflateSync } from 'node:zlib';

// 8-bit RGB or RGBA, non-interlaced: the form Chromium's screenshots take.
export function decodePng(buffer) {
  let pos = 8, width, height, channels;
  const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos), type = buffer.toString('ascii', pos + 4, pos + 8), data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4); channels = { 2: 3, 6: 4 }[data[9]];
      if (data[8] !== 8 || data[12] !== 0 || !channels) throw Error('Unsupported PNG format');
    } else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat)), stride = width * channels, out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= channels && y ? out[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predictor = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      out[y * stride + x] = (line[x] + predictor) & 255;
    }
  }
  return { width, height, channels, data: out };
}

export async function screenshot(send, clip) {
  const params = { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) };
  const png = Buffer.from((await send('Page.captureScreenshot', params)).data, 'base64');
  return { png, image: decodePng(png) };
}

// Bounding box of the pixels whose summed RGB difference exceeds the threshold.
export function diffBox(a, b, threshold = 45) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, count = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * a.channels, j = (y * b.width + x) * b.channels;
    const d = Math.abs(a.data[i] - b.data[j]) + Math.abs(a.data[i + 1] - b.data[j + 1]) + Math.abs(a.data[i + 2] - b.data[j + 2]);
    if (d > threshold) { count++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return count ? { width: x1 - x0 + 1, height: y1 - y0 + 1, count, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } : { width: 0, height: 0, count: 0 };
}

export function pixel(image, x, y) {
  const i = (Math.round(y) * image.width + Math.round(x)) * image.channels;
  return [image.data[i], image.data[i + 1], image.data[i + 2]];
}
