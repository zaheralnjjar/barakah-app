const fs = require('fs');
const path = require('path');

const fontPath = path.join(process.cwd(), 'src/assets/fonts/Amiri-Regular.ttf');
const outputPath = path.join(process.cwd(), 'src/utils/AmiriFont.ts');

try {
    const fontBuffer = fs.readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString('base64');

    const content = `export const AmiriFontBase64 = "${fontBase64}";`;

    fs.writeFileSync(outputPath, content);
    console.log('Font converted successfully to ' + outputPath);
} catch (e) {
    console.error('Error converting font:', e);
}
