// A minimal zip writer and reader for exporting and importing the lesson store: deflated entries,
// no encryption, no zip64 (the store is far below 4 GB). Uses only Node's zlib, so no dependency.
const zlib = require('node:zlib');

const crc32 = buf => zlib.crc32(buf) >>> 0;
// entries: [[name, string | Buffer]] -> Buffer
function writeZip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'), packed = zlib.deflateRawSync(data), file = Buffer.from(name, 'utf8'), crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(file.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(packed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(file.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, file, packed); centrals.push(central, file);
    offset += 30 + file.length + packed.length;
  }
  const directory = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

// Buffer -> [[name, Buffer]]; checks every entry's CRC. Limits guard against oversized archives.
function readZip(buf, { maxEntries = 100_000, maxBytes = 500_000_000 } = {}) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw Error('Not a zip file.');
  const count = buf.readUInt16LE(end + 10), dirOffset = buf.readUInt32LE(end + 16);
  if (count > maxEntries) throw Error('Too many files in the zip.');
  const out = [];
  let p = dirOffset, total = 0;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw Error('Damaged zip directory.');
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 20), raw = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32), local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    total += raw; if (total > maxBytes) throw Error('The zip is too large.');
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28), packed = buf.subarray(start, start + size);
    const data = method === 8 ? zlib.inflateRawSync(packed) : method === 0 ? Buffer.from(packed) : null;
    if (!data) throw Error(`Unsupported compression in ${name}.`);
    if (crc32(data) !== crc) throw Error(`${name} is damaged.`);
    out.push([name, data]);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

module.exports = { writeZip, readZip };
