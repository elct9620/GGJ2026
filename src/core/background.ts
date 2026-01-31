import { Graphics } from "pixi.js";

/**
 * Create background graphics for the game
 * Spec: § 2.7.2 Main Scene Layout
 */
export function createBackground(): Graphics {
  const background = new Graphics();

  // Draw booth area (left 20%, 384px width)
  // SPEC § 2.7.2 - Booth area
  background.rect(0, 0, 384, 1080);
  background.fill(0x2c3e50); // Dark blue-gray

  // Draw baseline separator (x = 384)
  background.rect(384, 0, 4, 1080);
  background.fill(0xe74c3c); // Red line to indicate baseline

  // Draw game area (right 80%)
  background.rect(388, 0, 1532, 1080);
  background.fill(0x1a1a1a); // Dark background (matches SPEC § 4.2.1)

  // Add grid lines for visual reference (prototype)
  background.lineStyle(1, 0x34495e, 0.3);

  // Vertical grid lines
  for (let x = 384; x <= 1920; x += 100) {
    background.moveTo(x, 0);
    background.lineTo(x, 1080);
  }

  // Horizontal grid lines
  for (let y = 0; y <= 1080; y += 100) {
    background.moveTo(384, y);
    background.lineTo(1920, y);
  }

  return background;
}
