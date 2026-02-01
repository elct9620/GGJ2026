import { Assets, Texture } from "pixi.js";

/**
 * Game font family constant
 * Used by all UI text elements for consistent styling
 * Font: Chiron Hei HK WS (Variable Font)
 */
export const GAME_FONT_FAMILY = "Chiron Hei HK WS, sans-serif";

// Import assets using Vite's static import
import bgRoad from "../assets/BG_Road.png";
import dropItemPool0 from "../assets/DropItemPool_0.png";
import dropItemPool1 from "../assets/DropItemPool_1.png";
import dropItemPool2 from "../assets/DropItemPool_2.png";
import imageStalls from "../assets/image_Stalls.png";
import playerSprite from "../assets/Player.png";
import playerDirHint from "../assets/Player_DirHint.png";
import monster0 from "../assets/Monster_0.png";
import upgradeBase from "../assets/image_UpgradeBase.png";
import bulletClassBase from "../assets/image_BulletClassBase.png";
import keyBind from "../assets/image_keyBind.png";
import keyBindTip from "../assets/image_keyBindTip.png";
import skillTip0 from "../assets/image_skillTip_0.png";
import skillTip1 from "../assets/image_skillTip_1.png";
import skillTip2 from "../assets/image_skillTip_2.png";
import skillTip3 from "../assets/image_skillTip_3.png";
import upgradeIcon from "../assets/image_upgradeIcon.png";
import skillIcon from "../assets/btn_skillIcon.png";

/**
 * Asset keys for type-safe access
 */
export const AssetKeys = {
  background: "background",
  boothPool0: "boothPool0",
  boothPool1: "boothPool1",
  boothPool2: "boothPool2",
  stalls: "stalls",
  player: "player",
  playerDirHint: "playerDirHint",
  monster: "monster",
  upgradeBase: "upgradeBase",
  bulletClassBase: "bulletClassBase",
  keyBind: "keyBind",
  keyBindTip: "keyBindTip",
  skillTip0: "skillTip0",
  skillTip1: "skillTip1",
  skillTip2: "skillTip2",
  skillTip3: "skillTip3",
  upgradeIcon: "upgradeIcon",
  skillIcon: "skillIcon",
} as const;

export type AssetKey = (typeof AssetKeys)[keyof typeof AssetKeys];

/**
 * Asset manifest mapping keys to imported URLs
 */
const ASSET_MANIFEST: Record<AssetKey, string> = {
  [AssetKeys.background]: bgRoad,
  [AssetKeys.boothPool0]: dropItemPool0,
  [AssetKeys.boothPool1]: dropItemPool1,
  [AssetKeys.boothPool2]: dropItemPool2,
  [AssetKeys.stalls]: imageStalls,
  [AssetKeys.player]: playerSprite,
  [AssetKeys.playerDirHint]: playerDirHint,
  [AssetKeys.monster]: monster0,
  [AssetKeys.upgradeBase]: upgradeBase,
  [AssetKeys.bulletClassBase]: bulletClassBase,
  [AssetKeys.keyBind]: keyBind,
  [AssetKeys.keyBindTip]: keyBindTip,
  [AssetKeys.skillTip0]: skillTip0,
  [AssetKeys.skillTip1]: skillTip1,
  [AssetKeys.skillTip2]: skillTip2,
  [AssetKeys.skillTip3]: skillTip3,
  [AssetKeys.upgradeIcon]: upgradeIcon,
  [AssetKeys.skillIcon]: skillIcon,
};

/**
 * Load custom game fonts
 * Loads Chiron Hei HK WS variable font via CSS
 */
async function loadFonts(): Promise<void> {
  // Load font CSS stylesheet
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/fonts/css/vf.css";
  document.head.appendChild(link);

  // Wait for the font to be available
  await document.fonts.ready;

  // Verify the font is loaded by checking if the font family is available
  const fontLoaded = await document.fonts.load("400 16px 'Chiron Hei HK WS'");
  if (fontLoaded.length === 0) {
    console.warn("Chiron Hei HK WS font may not be fully loaded");
  }
}

/**
 * Load all game assets
 * Should be called before game initialization
 */
export async function loadAssets(): Promise<void> {
  // Load fonts first to ensure they're available for text rendering
  await loadFonts();

  const loadPromises = Object.entries(ASSET_MANIFEST).map(([key, url]) =>
    Assets.load({ alias: key, src: url }),
  );
  await Promise.all(loadPromises);
}

/**
 * Get a loaded texture by key
 */
export function getTexture(key: AssetKey): Texture {
  return Assets.get(key);
}
