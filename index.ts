import * as Jimp from 'jimp'; // Make sure to install Jimp using npm

interface Badge {
  image: Jimp;
  size: { width: number; height: number };
  hasCircle: boolean;
  hasHappyColors: boolean;
}

async function verifyBadge(imagePath: string): Promise<Badge> {
  // Load the image using Jimp
  const image = await Jimp.read(imagePath);

  // Check image size
  const size = image.resize(512, 512);

  // Check if only non-transparent pixels are within a circle
  const hasCircle = checkCircle(image);

  // Check if the colors give a happy feeling
  const hasHappyColors = checkHappyColors(image);

  return {
    image,
    size: { width: size.getWidth(), height: size.getHeight() },
    hasCircle,
    hasHappyColors,
  };
}

// Check if only non-transparent pixels are within a circle with tolerance
function checkCircle(image: Jimp, tolerance: number = 5): boolean {
  const centerX = image.getWidth() / 2;
  const centerY = image.getHeight() / 2;

  let maxRadius = 0;

  // Find the farthest non-transparent pixel from the center
  for (let x = 0; x < image.getWidth(); x++) {
    for (let y = 0; y < image.getHeight(); y++) {
      const pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y)); // Get pixel color

      if (pixelColor.a > 0) { // If pixel is non-transparent
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2); // Calculate distance from center
        maxRadius = Math.max(maxRadius, distance); // Update maxRadius if needed
      }
    }
  }

  // Make sure maxRadius is not greater than the image size
  maxRadius = Math.min(maxRadius, image.getWidth() / 2, image.getHeight() / 2);

  // Check if each pixel is within the circle with tolerance
  for (let x = 0; x < image.getWidth(); x++) {
    for (let y = 0; y < image.getHeight(); y++) {
      const pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y));
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2); // Calculate distance from center

      // Check if pixel is non-transparent and within the circle with tolerance
      if (pixelColor.a > 0 && distance > maxRadius + tolerance) {
        return false;
      }
    }
  }

  return true;
}

function checkHappyColors(image: Jimp): boolean {
  // Get the average HSL color of the entire image
  const averageHSL = getAverageHSL(image);

  // Define the range of happy colors in HSL space
  const happyColorRanges = {
    hue: { min: 30, max: 90 },         // Yellow-Green to Yellow
    saturation: { min: 50, max: 100 }, // Moderate to fully saturated
    lightness: { min: 40, max: 80 },   // Dark to moderately light
  };

  // Check if the average HSL color is within the happy color ranges
  return (
    averageHSL.h >= happyColorRanges.hue.min &&
    averageHSL.h <= happyColorRanges.hue.max &&
    averageHSL.s >= happyColorRanges.saturation.min &&
    averageHSL.s <= happyColorRanges.saturation.max &&
    averageHSL.l >= happyColorRanges.lightness.min &&
    averageHSL.l <= happyColorRanges.lightness.max
  );
}

function getAverageHSL(image: Jimp): { h: number; s: number; l: number } {
  let totalPixels = 0;
  let totalHue = 0;
  let totalSaturation = 0;
  let totalLightness = 0;

  for (let x = 0; x < image.getWidth(); x++) {
    for (let y = 0; y < image.getHeight(); y++) {
      const pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y));
      const hsl = rgbToHSL(pixelColor.r, pixelColor.g, pixelColor.b);

      totalHue += hsl.h;
      totalSaturation += hsl.s;
      totalLightness += hsl.l;
      totalPixels++;
    }
  }

  const averageHSL = {
    h: Math.round(totalHue / totalPixels),
    s: Math.round(totalSaturation / totalPixels),
    l: Math.round(totalLightness / totalPixels),
  };

  return averageHSL;
}

function rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    switch (max) {
      case r:
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / (max - min) + 2;
        break;
      case b:
        h = (r - g) / (max - min) + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Replace this with the path to your badge image
const imagePath = process.argv.slice(2)[0] || './images/badge.jpeg';

verifyBadge(imagePath).then((badgeResult) => {
  console.log('Badge Verification Result:');
  console.log('Size:', badgeResult.size);
  console.log('Has Circle:', badgeResult.hasCircle);
  console.log('Has Happy Colors:', badgeResult.hasHappyColors);
  // TODO: Handle the image verification result
}).catch((error) => {
    console.error(error);
  }
);
