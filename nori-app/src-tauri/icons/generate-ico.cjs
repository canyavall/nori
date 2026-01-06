// Minimal valid ICO file generator
const fs = require('fs');

// ICO file format: https://en.wikipedia.org/wiki/ICO_(file_format)
// This creates a minimal 1x1 pixel transparent ICO file

const ico = Buffer.from([
  // ICO header
  0x00, 0x00, // Reserved (must be 0)
  0x01, 0x00, // Type (1 = ICO)
  0x01, 0x00, // Number of images (1)

  // Image directory entry
  0x20,       // Width (32 pixels)
  0x20,       // Height (32 pixels)
  0x00,       // Color palette (0 = no palette)
  0x00,       // Reserved (must be 0)
  0x01, 0x00, // Color planes
  0x20, 0x00, // Bits per pixel (32-bit)
  0x30, 0x04, 0x00, 0x00, // Size of image data (1072 bytes)
  0x16, 0x00, 0x00, 0x00, // Offset to image data (22 bytes)

  // BMP info header (40 bytes)
  0x28, 0x00, 0x00, 0x00, // Header size
  0x20, 0x00, 0x00, 0x00, // Width
  0x40, 0x00, 0x00, 0x00, // Height (2x for ICO)
  0x01, 0x00,             // Planes
  0x20, 0x00,             // Bits per pixel
  0x00, 0x00, 0x00, 0x00, // Compression
  0x00, 0x04, 0x00, 0x00, // Image size
  0x00, 0x00, 0x00, 0x00, // X pixels per meter
  0x00, 0x00, 0x00, 0x00, // Y pixels per meter
  0x00, 0x00, 0x00, 0x00, // Colors used
  0x00, 0x00, 0x00, 0x00, // Important colors
]);

// Add 1024 bytes of blue pixel data (32x32 BGRA)
const pixels = Buffer.alloc(4096);
for (let i = 0; i < 1024; i++) {
  pixels[i * 4] = 0xFF;     // Blue
  pixels[i * 4 + 1] = 0x9C; // Green
  pixels[i * 4 + 2] = 0x00; // Red
  pixels[i * 4 + 3] = 0xFF; // Alpha
}

fs.writeFileSync('icon.ico', Buffer.concat([ico, pixels]));
console.log('Generated placeholder icon.ico (32x32, orange color)');
