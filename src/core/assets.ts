import { Assets, Texture } from "pixi.js";

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
};

/**
 * Load all game assets
 * Should be called before game initialization
 */
export async function loadAssets(): Promise<void> {
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
