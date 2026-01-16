// src/utils/fontLoader.ts

// Cache to prevent reloading the same font
const loadedFonts = new Set<string>();

export async function loadGoogleFont(fontFamily: string, doc: Document = document) {
  if (loadedFonts.has(fontFamily)) return;

  // Construct the Google Fonts URL
  const familyQuery = fontFamily.replace(/\s+/g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@400;500;600;700&display=swap`;

  try {
    // 1. Fetch the CSS stylesheet
    const response = await fetch(url);
    const cssText = await response.text();

    // 2. Parse font-face URLs from the CSS
    // This regex extracts the .woff2 URLs
    const urlRegex = /url\((.*?)\) format\('woff2'\)/g;
    let match;
    const fontPromises = [];

    while ((match = urlRegex.exec(cssText)) !== null) {
      const fontUrl = match[1].replace(/['"]/g, '');
      
      // 3. Use the FontFace API to load the specific font file
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
      
      // Add to the document's font set
      doc.fonts.add(fontFace);
      
      // Wait for it to load
      fontPromises.push(fontFace.load());
    }

    await Promise.all(fontPromises);
    loadedFonts.add(fontFamily);
    
    return true;
  } catch (error) {
    console.error(`Failed to load font: ${fontFamily}`, error);
    return false;
  }
}