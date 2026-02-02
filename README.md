# Bite Back! The Booth Defense（反擊吧！攤位防衛戰）

[![Global Game Jam 2026](https://img.shields.io/badge/Global%20Game%20Jam-2026-orange)](https://globalgamejam.org/)
[![Theme: Mask](https://img.shields.io/badge/Theme-Mask-purple)](https://globalgamejam.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Pixi.js](https://img.shields.io/badge/Pixi.js-8.x-ff69b4)](https://pixijs.com/)

> Global Game Jam 2026 參賽作品，主題為「Mask」

## 遊戲簡介

**Bite Back! The Booth Defense** 是一款橫向塔防遊戲，玩家在台灣夜市攤位區防守，透過射擊餓鬼、收集食材、合成特殊子彈來盡可能存活更多回合。

### 核心特色

- **快節奏的戰鬥與資源管理結合**：射擊敵人獲取食材，適時合成特殊子彈
- **台灣夜市特色食材合成系統**：豆腐、珍珠、米血組合成各種特殊攻擊
- **策略性的攤位防守與升級選擇**：每回合結束選擇升級強化能力

## 遊戲玩法

### 遊戲循環

1. **敵人生成**：餓鬼從畫面右側生成並向左移動
2. **射擊收集**：玩家射擊敵人獲取食材
3. **自動儲存**：食材自動進入對應攤位（最多各 6 個）
4. **合成強化**：按數字鍵 1-5 合成特殊子彈
5. **回合升級**：每回合結束後選擇升級強化
6. **難度提升**：敵人數量隨回合增加（回合數 × 2）

### 敵人類型

| 名稱   | 類型 | 生命值 | 掉落物              |
| ------ | ---- | ------ | ------------------- |
| 餓鬼   | 小怪 | 1      | 無                  |
| 紅餓鬼 | 菁英 | 2      | 豆腐                |
| 綠餓鬼 | 菁英 | 2      | 珍珠                |
| 藍餓鬼 | 菁英 | 2      | 米血                |
| 餓死鬼 | Boss | 10     | 特殊升級（每 5 波） |

### 特殊子彈配方

| 按鍵 | 名稱     | 消耗                 | 效果                             |
| ---- | -------- | -------------------- | -------------------------------- |
| 1    | 夜市總匯 | 豆腐×1 珍珠×1 米血×1 | 連鎖閃電攻擊 5 個目標            |
| 2    | 臭豆腐   | 豆腐×3               | 貫穿 1 個敵人                    |
| 3    | 珍珠奶茶 | 珍珠×3               | 三向散射子彈                     |
| 4    | 豬血糕   | 米血×3               | 追蹤敵人，降低敵人移速           |
| 5    | 蚵仔煎   | 20 擊殺數            | 百分比傷害（Boss 10%、菁英 50%） |

### 升級系統

**普通升級**（每回合結束）：

- 加辣：臭豆腐傷害 +0.5
- 加椰果：珍珠奶茶子彈 +1
- 加香菜：豬血糕範圍 +0.5

**Boss 升級**（每 5 回合）：

- 打折：特殊子彈消耗 -1
- 大胃王：彈匣容量 +6
- 快吃：蚵仔煎傷害 +10%
- 飢餓三十：Buff 時長 +2 秒
- 總匯吃到飽：夜市總匯鏈結 ×2
- 好餓好餓：換彈時間 -0.5 秒

## 操作說明

| 按鍵    | 功能     |
| ------- | -------- |
| W/A/S/D | 移動     |
| Space   | 射擊     |
| 1       | 夜市總匯 |
| 2       | 臭豆腐   |
| 3       | 珍珠奶茶 |
| 4       | 豬血糕   |
| 5       | 蚵仔煎   |

## 遊戲數值

- **玩家生命**：5 條（敵人到達底線扣 1 條）
- **彈匣容量**：6 發
- **重裝時間**：3 秒
- **移動速度**：200 px/s
- **特殊子彈 Buff**：持續 2 秒

## 快速開始

### 需求環境

- Node.js 22.x
- pnpm

### 安裝

```bash
# 安裝依賴
pnpm install
```

### 開發

```bash
# 啟動開發伺服器（帶熱重載）
pnpm dev
```

開啟瀏覽器前往 http://localhost:5173

### 建置

```bash
# TypeScript 型別檢查與建置
pnpm build

# 預覽生產建置
pnpm preview
```

## 開發指令

| 指令                 | 說明                   |
| -------------------- | ---------------------- |
| `pnpm dev`           | 啟動開發伺服器         |
| `pnpm build`         | 建置生產版本           |
| `pnpm preview`       | 預覽生產建置           |
| `pnpm test`          | 執行測試（watch mode） |
| `pnpm test:ui`       | 測試 UI 介面           |
| `pnpm test:coverage` | 測試覆蓋率報告         |
| `pnpm format`        | 格式化程式碼           |
| `pnpm format:check`  | 檢查格式               |

## 技術棧

- **Runtime**：TypeScript 5.9（ES2022, strict mode）
- **Rendering**：Pixi.js v8.x（2D WebGL）
- **Build Tool**：Vite（rolldown-vite）
- **Testing**：Vitest + @vitest/ui + @vitest/coverage-v8
- **Formatting**：Prettier
- **Deployment**：Cloudflare Pages

## 瀏覽器支援

- Chrome 120+
- Firefox 120+
- Safari 17+

> 僅支援桌面版瀏覽器，需要 WebGL 2.0 支援

## 專案架構

```
src/
├── core/           # 核心系統（資源載入、設定）
├── systems/        # 遊戲系統（戰鬥、攤位、波次等）
├── entities/       # 遊戲實體（玩家、敵人、子彈）
├── screens/        # 畫面（開始、遊戲結束、升級）
├── collision/      # 碰撞處理
├── effects/        # 視覺特效
└── test/           # 測試設定
```

## 授權

本專案為 Global Game Jam 2026 參賽作品。

## 致謝

感謝 Global Game Jam 2026 主辦單位以及所有團隊成員的付出！
