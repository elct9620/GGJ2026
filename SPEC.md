# Game Specification: Night Market Defense

# 1. Intent Layer

## 1.1 Purpose

本遊戲為 Global Game Jam 2026 參賽作品，主題為「Mask」。透過橫向類塔防遊戲機制，讓玩家體驗台灣夜市攤位文化與餓鬼傳說的結合。

**核心價值主張**：

- 快節奏的戰鬥與資源管理結合
- 台灣夜市特色食材合成系統
- 策略性的攤位防守與升級選擇

## 1.2 Users

**主要使用者**：

- 團隊成員和朋友
- Game Jam 評審和參與者
- 休閒遊戲玩家

**使用情境**：

- 單人遊戲體驗
- 瀏覽器環境（Cloudflare 部署）
- 短時間遊戲場次（5-15 分鐘）

## 1.3 Success Criteria

**可衡量指標**：

1. **完成度**：所有核心系統可運作
   - 攤位系統可儲存和提取食材
   - 戰鬥系統可射擊和擊敗敵人
   - 合成系統可產生特殊子彈
   - 升級系統可強化能力

2. **遊戲平衡**：
   - 玩家可存活至少 5 個回合
   - 進階玩家可達成 10 個回合以上
   - 每個回合有明確的挑戰增長

3. **主題符合度**：
   - 遊戲機制呼應「Mask」主題（覆蓋、防守）
   - 視覺和音效完整呈現

4. **技術品質**：
   - 在現代瀏覽器流暢運行（60 FPS）
   - 無重大錯誤和崩潰

# 2. Design Layer

## 2.1 Game Overview

**核心概念**：玩家操作角色在夜市攤位區防守，透過射擊餓鬼、收集食材、合成特殊子彈，在無盡回合中盡可能存活。

**遊戲循環**：

1. 敵人從右側生成並向左移動
2. 玩家射擊敵人獲取食材
3. 收集食材到攤位儲存
4. 合成特殊子彈強化攻擊
5. 回合結束後選擇升級
6. 敵人數量增加，難度提升

## 2.2 Terminology

| 術語                         | 定義                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Entity（實體）**           | 遊戲中所有物件的基礎類別，提供唯一 ID 和生命週期管理                       |
| **Player（玩家）**           | 可操作的角色，能在遊戲畫面中自由移動                                       |
| **Booth（攤位）**            | 用來儲存食材的固定區域，每種食材有專屬攤位                                 |
| **Food（食材）**             | 合成技能的素材，擊敗敵人掉落，敵人也會奪取                                 |
| **Ghost（餓鬼）**            | 一般敵人，生命值 1 點                                                      |
| **Red Ghost（紅惡鬼）**      | 強化敵人，生命值 2 點，100% 掉落豆腐                                       |
| **Green Ghost（綠惡鬼）**    | 強化敵人，生命值 2 點，100% 掉落珍珠                                       |
| **Blue Ghost（藍惡鬼）**     | 強化敵人，生命值 2 點，100% 掉落米血                                       |
| **Boss（餓死鬼）**           | 強化敵人，生命值 3 點，每 5 回合出現                                       |
| **Wave（回合）**             | 每回合生成固定數量敵人，回合數越高敵人越多                                 |
| **Bullet（子彈）**           | 玩家攻擊單位，包含普通子彈和特殊子彈                                       |
| **Synthesis（合成）**        | 消耗食材產生特殊子彈效果                                                   |
| **Upgrade（升級）**          | 回合間強化能力的永久效果                                                   |
| **Box（寶箱）**              | 出現在攤位前方的防禦機制，用食材數量阻擋敵人，敵人碰撞時消耗食材並消除敵人 |
| **Kill Counter（擊殺計數）** | 追踪玩家擊殺敵人數量的系統，用於遊戲統計和結算畫面                         |
| **Vector（向量）**           | 不可變的 2D 座標值物件，用於位置和方向計算                                 |
| **Event（事件）**            | 遊戲中發生的狀態變更通知，包含類型和可選資料                               |
| **EventQueue（事件佇列）**   | 管理和調度遊戲事件的系統，統一處理延遲執行                                 |

## 2.3 Core Systems

### 2.3.1 Booth System

**Purpose**: 儲存食材供合成使用

**Constraints**:

- 固定 3 個攤位位置（遊戲開始時已設置，攤位不可移動）
- 每個攤位對應一種食材類型
- 每個攤位可儲存 6 個食材（6 slots）
- 敵人每次觸碰攤位僅偷取 1 個食材

**Behaviors**:

- **Store（儲存）**: 敵人死亡掉落食材後，食材自動進入對應攤位（無需玩家拾取）
- **Consume（消耗）**: 合成系統按鍵觸發時直接消耗攤位食材
- **Enemy Steal（敵人奪取）**: 敵人觸碰攤位時偷取 1 個食材

**Error Scenarios**:

| 操作     | 當前狀態        | 結果             |
| -------- | --------------- | ---------------- |
| 儲存食材 | 攤位已滿（6/6） | 食材消失（丟失） |
| 消耗食材 | 攤位為空（0/6） | 無法消耗         |

**Food Types**:

| 食材名稱 | 攤位編號 | 最大儲存量 |
| -------- | -------- | ---------- |
| 珍珠     | 1        | 6          |
| 豆腐     | 2        | 6          |
| 米血     | 3        | 6          |

### 2.3.2 Combat System

**Purpose**: 玩家透過射擊擊敗敵人

**Constraints**:

- 彈夾容量：6 發子彈
- 重裝時間：3 秒
- 普通子彈傷害：1 點（擊殺 1 隻餓鬼，對 Boss 造成 1 點傷害）
- 特殊子彈持續時間：2 秒（夜市總匯除外）
- 重裝期間：玩家可移動但無法射擊
- 特殊子彈為臨時 Buff：不替換彈夾內容，僅在 Buff 期間強化發射的子彈

**Behaviors**:

- **Normal Attack（普通攻擊）**:
  - 按下 Space 鍵發射子彈
  - 子彈向右直線飛行
  - 擊中敵人造成傷害
  - 消耗彈夾數量（6 → 5 → ... → 0）

- **Reload（重裝）**:
  - 彈夾歸零時自動觸發
  - 3 秒後彈夾恢復至 6 發
  - 重裝期間玩家可移動但無法射擊

- **Special Bullet（特殊子彈）**:
  - 合成成功後立即啟動 2 秒 Buff
  - Buff 期間發射的子彈擁有特殊效果
  - Buff 結束後恢復普通子彈

**Error Scenarios**:

| 輸入     | 當前狀態        | 結果         |
| -------- | --------------- | ------------ |
| 按 Space | 重裝期間        | 無反應       |
| 按 Space | 彈夾為空（0/6） | 無反應       |
| 按數字鍵 | 特殊 Buff 期間  | 無法再次合成 |

### 2.3.3 Synthesis System

**Purpose**: 透過按鍵快速發動特殊子彈效果（即時消耗食材）

**Constraints**:

- 按鍵 1-5 分別對應 5 種特殊子彈
- 直接從攤位消耗食材（無中間合成槽）
- 特殊子彈不能堆疊：Buff 期間無法再次觸發
- Buff 持續時間：2 秒（所有特殊子彈統一）

**Behaviors**:

- **Trigger by Key（按鍵觸發）**:
  - 按下數字鍵 1-5 檢查食材是否滿足配方
  - 食材充足時立即消耗並啟動 Buff
  - Buff 期間發射的子彈擁有特殊效果

- **Consume Food（消耗食材）**:
  - 直接從攤位扣除對應食材
  - 消耗後攤位食材數量減少

- **Activate Buff（啟動 Buff）**:
  - 接下來發射的子彈擁有特殊效果（2 秒內）
  - UI 顯示當前 Buff 類型和剩餘時間

- **Buff Expiration（Buff 結束）**:
  - 2 秒後 Buff 結束
  - 恢復普通子彈

**Error Scenarios**:

| 按鍵         | 當前狀態               | 結果                        |
| ------------ | ---------------------- | --------------------------- |
| 1-4          | 食材不足               | 無反應，UI 提示庫存不足     |
| 1-5          | Buff 期間              | 無反應（無法疊加）          |
| 1 (夜市總匯) | 豆腐/珍珠/米血任一為 0 | 無反應                      |
| 5 (蚵仔煎)   | 擊殺數 < 解鎖門檻      | 無反應，UI 提示未解鎖       |

**Synthesis Recipes**:

| 子彈名稱 | 數字鍵 | 配方消耗                  | 觸發條件       | 效果                   | 持續時間 |
| -------- | ------ | ------------------------- | -------------- | ---------------------- | -------- |
| 普通     | Space  | 無                        | 無             | 無                     | 無       |
| 夜市總匯 | 1      | 豆腐 ×1、珍珠 ×1、米血 ×1 | 無             | 連鎖閃電，基礎傷害 ×10 | 2s       |
| 臭豆腐   | 2      | 豆腐 ×3                   | 無             | 貫穿                   | 2s       |
| 珍珠奶茶 | 3      | 珍珠 ×3                   | 無             | 散射                   | 2s       |
| 豬血糕   | 4      | 米血 ×3                   | 無             | 追蹤彈                 | 2s       |
| 蚵仔煎   | 5      | 無                        | 累積擊殺 10 隻 | 基礎傷害 ×8            | 2s       |

**配方說明**:

- 蚵仔煎為特殊子彈，不消耗食材，需累積擊殺 10 隻敵人後解鎖
- 解鎖後可無限次使用（無冷卻，無消耗）
- 快吃升級可使蚵仔煎累積速度 ×2（5 隻擊殺即可解鎖）
- 其他特殊子彈按鍵觸發時立即檢查並消耗食材

### 2.3.4 Upgrade System

**Purpose**: 回合間及 Boss 擊敗後永久強化玩家能力

**Constraints**:

- 每波結束提供 2 個隨機選項
- 非 Boss 波：從普通升級池抽取（無消耗，直接選擇）
- Boss 波（5, 10, 15...）：從 Boss 升級池抽取（無消耗，直接選擇）
- 玩家選擇其中 1 個
- 升級效果永久持續（整場遊戲，不會因回合結束而重置）
- 同一升級可重複選擇（效果堆疊，無上限）

**Behaviors**:

- **Present Options（呈現選項）**:
  - 回合結束觸發
  - 根據波次類型（普通/Boss）選擇升級池
  - 隨機抽取 2 個升級選項
  - 顯示升級效果（無需消耗）

- **Apply Upgrade（套用升級）**:
  - 玩家選擇升級
  - 永久修改遊戲參數
  - 進入下一回合

**Error Scenarios**:

| 操作         | 條件           | 結果             |
| ------------ | -------------- | ---------------- |
| 進入下一回合 | 未選擇任何選項 | 無法進入下一回合 |

**Normal Upgrade Options（普通升級）**:

| 升級名稱 | 效果                    | 消耗 |
| -------- | ----------------------- | ---- |
| 加辣     | 臭豆腐傷害倍率 +0.5     | 無   |
| 加椰果   | 珍珠奶茶子彈數 +5       | 無   |
| 加香菜   | 豬血糕傷害範圍倍率 +0.5 | 無   |

**Boss Upgrade Options（Boss 升級）**:

| 升級名稱 | 效果                                             | 消耗 |
| -------- | ------------------------------------------------ | ---- |
| 打折     | 臭豆腐/珍珠奶茶/豬血糕消耗 -1（3→2→1，最低 1）   | 無   |
| 大胃王   | 彈匣容量 ×2（6→12→24...）                        | 無   |
| 快吃     | 臭豆腐/珍珠奶茶/豬血糕消耗 -1（當場生效，最低 1）<br>蚵仔煎累積速度 ×2（5 隻擊殺即可解鎖） | 無   |
| 飢餓三十 | 特殊子彈 Buff 時間 ×2（2s→4s→8s...）             | 無   |

**升級效果說明**:

- 打折：永久減少食材消耗，每次選擇減少 1（3→2→1），最低 1，可重複堆疊
- 大胃王：每次選擇使彈匣容量翻倍，可重複堆疊
- 快吃：當場遊戲生效，臨時減少食材消耗 1（與打折效果可疊加），最低 1；同時使蚵仔煎累積速度 ×2（擊殺數需求減半，10→5）
- 飢餓三十：所有特殊子彈 Buff 時間翻倍，可重複堆疊

### 2.3.5 Wave System

**Purpose**: 控制敵人生成和回合進程

**Constraints**:

- 無限回合（直到玩家死亡，無勝利條件）
- 敵人數量線性增長：回合數 × 2（第 1 回合 2 隻，第 2 回合 4 隻，依此類推）
- Boss 每 5 回合出現一次（第 5, 10, 15... 回合）

**Behaviors**:

- **Spawn Enemies（生成敵人）**:
  - 回合開始時計算敵人數量
  - 一般敵人數 = 回合數 × 2
  - Boss 回合（5, 10, 15...）額外生成 1 隻 Boss

- **Wave Progression（回合進程）**:
  - 所有敵人被擊敗或到達底線
  - 觸發升級選擇
  - 升級完成後進入下一回合

**Error Scenarios**:

| 條件           | 結果                     |
| -------------- | ------------------------ |
| 玩家生命值歸零 | 遊戲結束，不進入下一回合 |

**Spawn Probability（生成機率）**:

| 敵人類型 | 生成機率 | 備註                   |
| -------- | -------- | ---------------------- |
| 餓鬼     | 40%      | 基礎敵人，掉落隨機食材 |
| 紅惡鬼   | 20%      | 固定掉豆腐             |
| 綠惡鬼   | 20%      | 固定掉珍珠             |
| 藍惡鬼   | 20%      | 固定掉米血             |

**Spawn Frequency（生成頻率）**:

- 基礎間隔：2~3 秒（隨機）
- 間隔不隨波次縮短（維持固定節奏）
- 停止條件：該波所有敵人已生成完畢

**Spawn Position（生成位置）**:

- X 座標：1950 px（畫面右側外 30px）
- Y 座標：隨機 0~1080 px
- 生成順序：逐個生成，不同時生成多隻

**Boss Spawn（Boss 生成）**:

- 頻率：每 5 波出現一次（波次 5, 10, 15...）
- 位置：同普通敵人（x = 1950, y = 隨機）
- 順序：該波最後一隻敵人生成
- Boss 不計入生成機率（額外生成）

**Wave Formula**:

| 回合數 | 一般敵人數 | Boss 數 | 總敵人數 |
| ------ | ---------- | ------- | -------- |
| 1      | 2          | 0       | 2        |
| 2      | 4          | 0       | 4        |
| 3      | 6          | 0       | 6        |
| 4      | 8          | 0       | 8        |
| 5      | 10         | 1       | 11       |
| 10     | 20         | 1       | 21       |
| 15     | 30         | 1       | 31       |

### 2.3.6 EventQueue System

**Purpose**: 統一管理遊戲事件和延遲執行，替代散落的 `setTimeout` 呼叫，讓各系統透過事件驅動方式互動。

**Constraints**:

- 事件佇列為單例（Singleton），全域唯一實例
- 事件按照發佈順序和延遲時間依序執行
- 每個事件類型可有多個訂閱者（Subscriber）
- 訂閱者必須提供處理函式（Handler）
- 支援延遲執行（Delayed Execution），單位為毫秒（ms）

**Behaviors**:

- **Publish Event（發佈事件）**:
  - 系統調用 `publish(eventType, data?, delay?)` 發佈事件
  - 若無延遲（`delay = 0` 或未指定），立即通知所有訂閱者
  - 若有延遲（`delay > 0`），加入延遲佇列，等待指定時間後執行

- **Subscribe（訂閱事件）**:
  - 系統調用 `subscribe(eventType, handler)` 訂閱事件類型
  - 當事件發佈時，所有訂閱者的 `handler` 函式被調用
  - 訂閱者可訂閱多個事件類型

- **Unsubscribe（取消訂閱）**:
  - 系統調用 `unsubscribe(eventType, handler)` 取消訂閱
  - 取消後不再接收該事件類型的通知

- **Process Queue（處理佇列）**:
  - 每個遊戲幀（Game Loop Tick）檢查延遲佇列
  - 若事件到達執行時間，從佇列移除並通知訂閱者
  - 事件按照到達執行時間排序（最早到達的先執行）

**Error Scenarios**:

| 操作             | 當前狀態               | 結果                         |
| ---------------- | ---------------------- | ---------------------------- |
| 發佈事件         | 無訂閱者               | 事件被丟棄（無錯誤）         |
| 訂閱事件         | 重複訂閱同一處理函式   | 僅保留一個訂閱（去重）       |
| 取消訂閱         | 處理函式不存在         | 無效果                       |
| 處理延遲事件     | 延遲時間為負數         | 視為立即執行（delay=0）      |
| Handler 拋出錯誤 | 訂閱者處理函式執行失敗 | 記錄錯誤，繼續執行其他訂閱者 |

**Event Types**:

遊戲中定義的事件類型：

| 事件類型              | 資料結構                                | 發佈時機                     | 訂閱系統                                  |
| --------------------- | --------------------------------------- | ---------------------------- | ----------------------------------------- |
| `WaveComplete`        | `{ waveNumber: number }`                | 回合內所有敵人清除           | Wave System                               |
| `WaveStart`           | `{ waveNumber: number }`                | 新回合開始                   | Wave System, UI                           |
| `UpgradeSelected`     | `{ upgradeId: string }`                 | 玩家選擇升級                 | Upgrade System                            |
| `ReloadComplete`      | `{}`                                    | 彈夾重裝完成（3 秒後）       | Combat System                             |
| `SynthesisTriggered`  | `{ recipeId: string }`                  | 按鍵 1-5 觸發特殊子彈        | Synthesis System                          |
| `BuffExpired`         | `{ buffType: string }`                  | 特殊子彈 Buff 結束（2 秒後） | Combat System                             |
| `EnemyDeath`          | `{ enemyId: string, position: Vector }` | 敵人生命值歸零               | Combat System, Booth System, Kill Counter |
| `EnemyReachedEnd`     | `{ enemyId: string }`                   | 敵人到達底線                 | Wave System, Player                       |
| `PlayerDeath`  | `{}`                                    | 玩家生命值歸零 | Game Scene |
| `FoodStored`   | `{ boothId: string, foodType: string }` | 食材進入攤位   | Box System |
| `FoodConsumed` | `{ boothId: string, amount: number }`   | 攤位食材被消耗 | Box System |

**Integration with Systems**:

各系統使用 EventQueue 的方式：

- **Wave System**:
  - 發佈 `WaveStart` 事件（回合開始）
  - 訂閱 `EnemyReachedEnd` 和 `EnemyDeath` 事件（追蹤敵人數量）
  - 發佈 `WaveComplete` 事件（延遲觸發，用於回合轉換）

- **Combat System**:
  - 發佈 `ReloadComplete` 事件（延遲 3000ms）
  - 訂閱 `SynthesisTriggered` 事件（啟動特殊子彈 Buff）
  - 發佈 `BuffExpired` 事件（延遲 2000ms）

- **Synthesis System**:
  - 發佈 `SynthesisTriggered` 事件（放入第 3 個食材時）

- **Booth System**:
  - 訂閱 `EnemyDeath` 事件（自動儲存掉落食材）

**測試案例**：參見 [docs/testing.md](docs/testing.md) § 2.9 EventQueue Tests。

### 2.3.7 Box System

**Purpose**: 用食材作為防禦盾牌，阻擋敵人進攻

**Constraints**:

- 與攤位配套：3 個攤位對應 3 個潛在寶箱位置
- 寶箱存在條件：對應攤位食材 > 0
- 寶箱位置：攤位前方（x = 384，攤位右邊緣）
- 寶箱耐久度：等於對應攤位食材數量

**Behaviors**:

- **Spawn（生成）**:
  - 攤位獲得第一個食材時，寶箱在攤位前方出現
  - 寶箱耐久度 = 攤位食材數量

- **Sync State（同步狀態）**:
  - 攤位食材增減時，寶箱耐久度同步更新
  - UI 顯示寶箱當前耐久度（等於食材數量）

- **Block Enemy（阻擋敵人）**:
  - 敵人碰撞寶箱時：
    1. 攤位食材 -1
    2. 寶箱耐久度 -1
    3. 敵人立即消失（不掉落食材）

- **Despawn（消失）**:
  - 攤位食材歸零時，寶箱立即消失

**Error Scenarios**:

| 操作         | 當前狀態          | 結果                               |
| ------------ | ----------------- | ---------------------------------- |
| 敵人碰撞寶箱 | 食材 1/6          | 食材歸零，寶箱消失，敵人消失不掉落 |
| 敵人進攻     | 寶箱不存在（0/6） | 敵人進入攤位區，正常偷取食材       |
| 攤位補充食材 | 寶箱已消失        | 新寶箱立即出現                     |
| 玩家觸發合成 | 寶箱存在          | 寶箱耐久度同步減少（食材消耗）     |

**Integration with Other Systems**:

- **Booth System**: 寶箱耐久度鏡像攤位食材數量（雙向同步）
- **Combat System**: 敵人碰撞寶箱不計入擊殺數（不觸發掉落）
- **EventQueue**: 訂閱 `FoodStored` 和 `FoodConsumed` 事件更新耐久度

### 2.3.8 Kill Counter System

**Purpose**: 追踪玩家擊殺敵人數量，用於遊戲統計、結算畫面和蚵仔煎解鎖

**Constraints**:

- 全局計數器，累積不重置（整場遊戲）
- 無上限，持續累積
- 追踪蚵仔煎解鎖進度（預設需 10 隻擊殺）

**Behaviors**:

- **Count Kill（計數擊殺）**:
  - 敵人被子彈擊殺時，計數器 +1
  - 敵人被寶箱阻擋消失時，計數器不增加
  - 敵人到達底線時，計數器不增加
  - 檢查是否達到蚵仔煎解鎖門檻

- **Check Oyster Omelet Unlock（檢查蚵仔煎解鎖）**:
  - 預設解鎖門檻：10 隻擊殺
  - 快吃升級效果：門檻減半為 5 隻（累積速度 ×2）
  - 達到門檻時解鎖蚵仔煎（按鍵 5 可用）

- **Visual Feedback（視覺反饋）**:
  - UI 顯示當前擊殺總數（例：15 隻）
  - UI 顯示蚵仔煎解鎖進度（例：5/10 或 5/5 已解鎖）
  - 遊戲結束時在結算畫面顯示總擊殺數

**Error Scenarios**:

| 操作         | 當前狀態                   | 結果             |
| ------------ | -------------------------- | ---------------- |
| 按 5（蚵仔煎）| 擊殺數 < 解鎖門檻          | 無反應，UI 提示未解鎖 |
| 按 5（蚵仔煎）| 擊殺數 ≥ 解鎖門檻          | Buff 啟動 2s     |
| 選擇快吃升級 | 已擊殺 7 隻（門檻 10→5）   | 蚵仔煎立即解鎖   |

**Integration with Other Systems**:

- **Combat System**: 訂閱 `EnemyDeath` 事件（僅限子彈擊殺）
- **Synthesis System**: 提供蚵仔煎解鎖狀態查詢
- **Upgrade System**: 快吃升級修改解鎖門檻（10→5）
- **UI System**: 顯示擊殺總數和蚵仔煎解鎖進度
- **Game Over Screen**: 顯示最終擊殺統計

## 2.4 Player Interactions

### 2.4.1 Input Controls

**鍵盤操作**:

| 按鍵  | 功能     | 行為                                             |
| ----- | -------- | ------------------------------------------------ |
| W     | 向上移動 | 玩家向上移動（200 px/s）                         |
| A     | 向左移動 | 玩家向左移動（200 px/s）                         |
| S     | 向下移動 | 玩家向下移動（200 px/s）                         |
| D     | 向右移動 | 玩家向右移動（200 px/s）                         |
| Space | 射擊     | 發射子彈（消耗彈夾）                             |
| 1     | 夜市總匯 | 消耗豆腐1、珍珠1、米血1，發射連鎖閃電子彈（2s）  |
| 2     | 臭豆腐   | 消耗豆腐3，發射貫穿子彈（2s）      |
| 3     | 珍珠奶茶 | 消耗珍珠3，發射散射子彈（2s）      |
| 4     | 豬血糕   | 消耗米血3，發射追蹤子彈（2s）      |
| 5     | 蚵仔煎   | 發射高傷害子彈（2s，無消耗，需累積擊殺 10 隻解鎖） |

**Error Scenarios**:

| 輸入     | 當前狀態         | 結果                        |
| -------- | ---------------- | --------------------------- |
| 按 Space | 重裝期間         | 無反應                      |
| 按 1-4   | 食材不足         | 無反應，UI 提示庫存不足     |
| 按 5     | 蚵仔煎未解鎖     | 無反應，UI 提示未解鎖       |
| 按 1-5   | Buff 期間        | 無反應（無法疊加）          |
| 移動鍵   | 超出遊戲邊界     | 停止移動                    |

### 2.4.2 User Journey

**遊戲開始**:

1. 進入遊戲主畫面
2. 顯示 3 個空攤位（左側 20% 區域）
3. 玩家角色出現在中央
4. 第 1 回合開始（2 隻餓鬼生成）

**回合中**:

1. 敵人從右側畫面外生成
2. 玩家移動並射擊敵人
3. 擊敗敵人掉落食材，食材自動進入對應攤位
4. 按數字鍵 1-5 即時觸發特殊子彈（直接消耗攤位食材）
5. 特殊子彈效果啟動 2 秒
6. 重複 2-5 直到所有敵人清除

**回合結束**:

1. 顯示升級選項（2 選 1）
2. 玩家選擇升級
3. 消耗食材套用升級
4. 進入下一回合

**遊戲結束**:

1. 玩家生命值歸零
2. 顯示存活回合數
3. 顯示擊敗敵人總數
4. 選項：重新開始 / 結束遊戲

## 2.5 Entity Architecture

**Purpose**: 提供統一的遊戲物件基礎架構，用於追蹤和管理所有遊戲內的實體。

### 2.5.1 Entity Base Class

所有遊戲物件（Player、Ghost、Boss、Bullet、Food）繼承自抽象類別 `Entity`。

**Properties**:

- `id: string` - 唯一識別碼（只讀）
- `active: boolean` - 實體是否啟用（用於物件池管理）

**Constraints**:

- ID 必須唯一且不可變更
- ID 生成方式：自增整數轉字串（例：`"1"`, `"2"`, `"3"`）
- 物件池回收時設定 `active = false`，重新啟用時設定 `active = true`

**ID Generation**:

```typescript
// 全域 ID 計數器
let nextEntityId = 1;

// Entity 建構時分配 ID
abstract class Entity {
  public readonly id: string;
  public active: boolean = true;

  constructor() {
    this.id = String(nextEntityId++);
  }
}
```

**Integration with Object Pool**:

- **建立（Create）**：從物件池取得實體時，若池為空則新建 Entity（分配新 ID）
- **啟用（Activate）**：設定 `active = true`，初始化實體狀態
- **停用（Deactivate）**：設定 `active = false`，清除實體狀態，返回物件池
- **銷毀（Destroy）**：物件池清空時，實體永久移除

**Error Scenarios**:

| 操作           | 當前狀態       | 結果         |
| -------------- | -------------- | ------------ |
| 啟用已啟用實體 | active = true  | 無效果       |
| 停用未啟用實體 | active = false | 無效果       |
| 存取已停用實體 | active = false | 應忽略該實體 |

**Benefits**:

- **追蹤性**：所有遊戲物件可透過唯一 ID 識別和除錯
- **物件池整合**：`active` 狀態簡化物件池管理
- **效能**：整數 ID 比 UUID 更高效，適合高頻建立/銷毀場景
- **一致性**：所有遊戲實體使用統一的基礎架構

**測試案例**：參見 [docs/testing.md](docs/testing.md) § 2.8 Entity Tests。

## 2.6 Game Entities

### 2.6.1 Player

**Properties**:

- 移動速度：200 px/s（每秒 200 像素，固定速度）
- 碰撞箱：24×24 px（縮小碰撞，提高容錯率）
- 生命值：5 條（敵人到達底線扣 1 條，無額外血條系統）
- 彈夾容量：6 發
- 當前彈夾數：0-6

**Behaviors**:

- 接收鍵盤輸入移動
- 發射子彈
- 死亡條件：生命值歸零

**測試案例**：參見 [docs/testing.md](docs/testing.md) § 2.6 Player Tests。

### 2.6.2 Enemies

**餓鬼（Ghost）**:

- 生命值：1 HP
- 移動速度：0.5 單位/秒（約 50 px/s）
- 傷害：到達底線扣玩家 1 條生命
- 掉落：100% 掉落隨機食材（珍珠/豆腐/米血，機率均等 33.3%）
- 生成機率：40%

**紅惡鬼（Red Ghost）**:

- 生命值：2 HP
- 移動速度：0.4 單位/秒（約 40 px/s）
- 傷害：到達底線扣玩家 1 條生命
- 掉落：100% 掉落豆腐（固定類型，不隨機）
- 生成機率：20%

**綠惡鬼（Green Ghost）**:

- 生命值：2 HP
- 移動速度：0.4 單位/秒（約 40 px/s）
- 傷害：到達底線扣玩家 1 條生命
- 掉落：100% 掉落珍珠（固定類型，不隨機）
- 生成機率：20%

**藍惡鬼（Blue Ghost）**:

- 生命值：2 HP
- 移動速度：0.4 單位/秒（約 40 px/s）
- 傷害：到達底線扣玩家 1 條生命
- 掉落：100% 掉落米血（固定類型，不隨機）
- 生成機率：20%

**餓死鬼（Boss）**:

- 生命值：3 HP
- 移動速度：0.3 單位/秒（約 30 px/s）
- 傷害：到達底線扣玩家 1 條生命
- 掉落：100% 掉落隨機食材（珍珠/豆腐/米血，機率均等 33.3%）
- 生成頻率：每 5 波出現一次（波次 5, 10, 15...）

**共同行為**:

- 從右側畫面外生成（x = 1950, y = 隨機 0~1080）
- 向左移動
- 碰撞攤位時偷取 1 個食材（不改變移動方向）
- 碰撞寶箱時立即消失（不掉落食材）
- 到達底線（x = 384）扣玩家生命並消失
- 被子彈擊中扣除生命值
- 生命值歸零時死亡並掉落食材

**測試案例**：參見 [docs/testing.md](docs/testing.md) § 2.7 Enemy Tests。

### 2.6.3 Bullets

**普通子彈**:

- 傷害：1
- 速度：400 px/s（向右飛行）
- 穿透：否
- 散射：否

**特殊子彈屬性**:

| 屬性     | 說明                     | 範例           |
| -------- | ------------------------ | -------------- |
| 傷害倍率 | 基礎傷害 × 倍率          | 臭豆腐 ×2      |
| 大小倍率 | 碰撞箱放大               | 臭豆腐 2 倍大  |
| 散射數量 | 同時發射多個子彈         | 珍珠奶茶 10 個 |
| 穿透     | 擊中敵人不消失           | 豬血糕         |
| 追蹤     | 子彈自動追蹤敵人         | 豬血糕         |
| 連鎖     | 擊中後自動攻擊下一個敵人 | 夜市總匯       |

## 2.7 Visual Layout

### 2.7.1 Screen Resolution

- **目標解析度**：1920×1080 (Full HD)（固定解析度，不支援自適應縮放）
- **寬高比**：16:9
- **視角**：2D 俯視角（Top-Down）

### 2.7.2 Main Scene Layout

**攤位區域（左側）**:

- 寬度：384 px（畫面寬度的 20%，固定值）
- 高度：1080 px（全高）
- 內容：3 個垂直排列的攤位

**活動區域（中央到右側）**:

- 寬度：1536 px（80% of 1920）
- 高度：1080 px（全高）
- 內容：玩家、敵人、子彈、掉落食材

**邊界定義**:

- 左邊界：x = 384（攤位區右側）
- 右邊界：x = 1920（畫面右側）
- 上邊界：y = 0
- 下邊界：y = 1080
- 底線：x = 384（敵人觸碰此線扣生命）

### 2.7.3 HUD Layout

**上方 HUD**:

- 位置：畫面頂部
- 高度：60 px
- 內容：
  - 當前回合數
  - 剩餘敵人數量
  - 玩家生命值（5 條）

**下方 HUD**:

- 位置：畫面底部
- 高度：120 px
- 內容：
  - 可用特殊子彈列表（1-5 數字鍵對應，顯示可用/不可用狀態）
  - 攤位食材庫存提示（豆腐/珍珠/米血數量）
  - 當前特殊子彈效果（Buff 圖示和剩餘時間）
  - 擊殺計數總數（例：15 隻）
  - 彈夾數量（6/6）

**重要約束**:

- HUD 不可遮蓋遊戲活動區域
- HUD 背景需半透明或完全獨立於遊戲畫面

## 2.8 Game States

### 2.8.1 Victory Condition

**不存在勝利條件**（無盡模式）

目標：盡可能存活更多回合

### 2.8.2 Defeat Condition

**觸發條件**:

- 玩家生命值歸零（5 → 4 → 3 → 2 → 1 → 0）

**扣血機制**:

- 敵人（餓鬼或 Boss）到達底線（x = 384）扣 1 條生命
- 敵人消失，玩家生命值 -1

**結束行為**:

1. 遊戲暫停
2. 顯示結算畫面：
   - 存活回合數
   - 擊敗敵人總數
   - 使用特殊子彈次數
3. 提供選項：重新開始 / 結束遊戲

# 3. Consistency Layer

## 3.1 Patterns

**Entity 管理模式**:

所有遊戲物件繼承自 `Entity` 基礎類別：

- 每個實體擁有唯一 ID（自增整數轉字串）
- 使用 `active` 狀態管理物件池生命週期
- 建立時分配 ID，停用時返回物件池，啟用時重新使用

**資源流動模式**:

```
敵人死亡 → 掉落食材 → 自動進入攤位 → 提取到合成槽 → 消耗合成 → 特殊子彈
```

**事件驅動模式**:

遊戲使用 EventQueue 系統統一管理狀態變更和系統間通訊：

- 系統透過 `publish` 發佈事件，透過 `subscribe` 訂閱事件
- 延遲執行透過事件的 `delay` 參數指定（毫秒），由 EventQueue 統一處理
- 系統間解耦：發佈者不直接依賴訂閱者，透過事件類型間接通訊
- 事件流範例：
  ```
  Combat System 發佈 EnemyDeath 事件
    → Booth System 訂閱並儲存掉落食材
    → Wave System 訂閱並更新敵人計數
  ```

**時間驅動模式**:

透過 EventQueue 的延遲執行機制實現：

- 彈夾重裝：發佈 `ReloadComplete` 事件（延遲 3000ms）
- 特殊 Buff：發佈 `BuffExpired` 事件（延遲 2000ms）
- 回合轉換：發佈 `WaveComplete` 事件（延遲可配置，預設立即）
- 敵人移動：持續性移動（速度固定，不使用事件）

**自動觸發模式**:

透過事件訂閱實現自動化行為：

- 食材儲存：Booth System 訂閱 `EnemyDeath` 事件，自動儲存掉落食材
- 合成：Synthesis System 檢測到合成槽 3/3 時發佈 `SynthesisTriggered` 事件
- 重裝：Combat System 檢測到彈夾歸零時發佈 `ReloadComplete` 事件（延遲 3000ms）
- 回合進程：Wave System 檢測到敵人清空時發佈 `WaveComplete` 事件

## 3.2 Forms

**數值格式**:

- 速度：px/s（像素/秒）
- 時間：s（秒）
- 傷害：整數倍率（×1, ×1.2, ×2...）
- 生命值：整數（1, 3, 5）
- 儲存量：整數/最大值（3/6）

**狀態格式**:

- Entity ID：字串格式的整數（`"1"`, `"2"`, `"3"`...）
- Entity 狀態：`active: boolean`（true = 啟用，false = 停用）
- 彈夾：當前數/最大數（3/6）
- 合成槽：已放入數/容量（2/3）
- 攤位：食材數/容量（4/6）
- 生命值：當前數/最大數（3/5）

### 3.2.1 Vector

**Purpose**: 不可變的 2D 座標值物件，用於遊戲中所有位置和方向計算。

**Design Decisions**:

- **不可變（Immutable）**：所有操作返回新 Vector 實例，防止意外修改
- **整數座標**：像素對齊渲染，避免浮點精度問題
- **零向量正規化**：返回 (0, 0) 而非錯誤，優雅降級

**Core Operations**:

| 操作        | 簽章                               | 用途               |
| ----------- | ---------------------------------- | ------------------ |
| `add`       | `add(other: Vector): Vector`       | 向量加法，位置偏移 |
| `subtract`  | `subtract(other: Vector): Vector`  | 向量減法，計算方向 |
| `multiply`  | `multiply(scalar: number): Vector` | 純量乘法，縮放長度 |
| `normalize` | `normalize(): Vector`              | 正規化為單位向量   |
| `magnitude` | `magnitude(): number`              | 計算向量長度       |
| `distance`  | `distance(other: Vector): number`  | 計算兩點距離       |
| `dot`       | `dot(other: Vector): number`       | 點積運算，夾角判斷 |

**Error Handling**:

- 參數為 null/undefined：拋出 TypeError
- 參數為 NaN/Infinity：拋出 TypeError/RangeError
- 零向量正規化：返回 Vector(0, 0)（不拋出錯誤）

**詳細規格**: 參見 [docs/value.md](docs/value.md)

## 3.3 Contracts

**碰撞檢測協議**:

- 玩家與敵人：無效果（玩家不受傷）
- 子彈與敵人：敵人扣血，子彈消失（貫穿子彈除外）
- 敵人與寶箱：食材 -1，寶箱耐久度 -1，敵人消失（不掉落）
- 敵人與攤位：偷取 1 個食材（寶箱不存在時）
- 敵人與底線：扣玩家生命，敵人消失

**Entity 生命週期協議**:

- 所有遊戲物件（Player、Ghost、Boss、Bullet、Food）必須繼承 Entity
- Entity 建構時自動分配唯一 ID
- 物件池管理透過 `active` 狀態切換
- 停用的 Entity（`active = false`）應被系統忽略

**系統間通訊協議**:

所有系統間通訊透過 EventQueue 進行：

- **事件發佈契約**：
  - 發佈者調用 `eventQueue.publish(eventType, data?, delay?)`
  - `eventType` 必須為已定義的事件類型字串（參見 § 2.3.6 Event Types）
  - `data` 為可選的事件資料，型別依事件類型而定
  - `delay` 為可選的延遲時間（毫秒），預設為 0（立即執行）

- **事件訂閱契約**：
  - 訂閱者調用 `eventQueue.subscribe(eventType, handler)`
  - `handler` 簽章：`(data?: any) => void`
  - Handler 必須是冪等的（Idempotent）：重複執行不改變結果
  - Handler 不應拋出未處理的錯誤（錯誤應在內部處理）

- **系統範例**：
  - Combat System 發佈 `EnemyDeath` → Booth System 訂閱並儲存食材
  - Synthesis System 發佈 `SynthesisTriggered` → Combat System 訂閱並啟動 Buff
  - Wave System 發佈 `WaveComplete` → Upgrade System 訂閱並顯示升級選項
  - Combat System 發佈 `ReloadComplete`（延遲 3000ms）→ Combat System 自身訂閱並恢復彈夾

- **直接調用（非事件）**：
  - 合成系統 → 攤位系統：`booth.retrieveFood()` 提取食材（同步操作）
  - 升級系統 → 戰鬥系統：`combat.applyUpgrade()` 永久修改參數（同步操作）

**值物件契約**:

- **Vector**：不可變，所有操作返回新實例
  - 建構時強制整數座標（四捨五入）
  - 所有數學運算結果為整數（四捨五入）
  - 操作不修改原實例狀態

# 4. Technical Specifications

## 4.1 Technology Stack

**渲染引擎**:

- **Pixi.js v8.x**：2D WebGL 渲染引擎（唯一支援的渲染引擎）
- **用途**：場景渲染、精靈管理、動畫系統
- **物件池（Object Pool）**：用於管理子彈和敵人（最大池大小：子彈 100 個、敵人 50 個）

**開發工具**:

- **TypeScript**：型別安全的程式語言
- **Vite**：建置工具和開發伺服器
- **Vitest**：單元測試框架

**部署平台**:

- **Cloudflare Pages**：靜態網站託管

## 4.2 Pixi.js Architecture

### 4.2.1 Application Setup

**Canvas 設定**:

```typescript
{
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a1a,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true
}
```

**目標幀率**：60 FPS（使用 Pixi.Ticker）

### 4.2.2 Scene Structure

**Container 階層**:

```
Application.stage
├── Background Layer (z-index: 0)
│   └── 攤位區域背景
├── Game Layer (z-index: 1)
│   ├── Booth Container
│   │   ├── Booth 1 (珍珠)
│   │   ├── Booth 2 (豆腐)
│   │   └── Booth 3 (米血)
│   ├── Food Drops Container
│   │   └── Food Sprites (動態生成)
│   ├── Player Sprite
│   ├── Enemies Container
│   │   ├── Ghost Sprites (動態生成)
│   │   └── Boss Sprites (動態生成)
│   └── Bullets Container
│       ├── Normal Bullets (動態生成)
│       └── Special Bullets (動態生成)
└── UI Layer (z-index: 2)
    ├── Top HUD Container
    │   ├── Wave Counter Text
    │   ├── Enemy Counter Text
    │   └── Health Display
    └── Bottom HUD Container
        ├── Synthesis Slot Container
        ├── Buff Display
        └── Ammo Counter Text
```

### 4.2.3 Sprite Management

**Texture 資源**:

- 使用 `Pixi.Assets` 載入和管理紋理
- 支援 Sprite Sheet（Texture Atlas）
- 預載入所有遊戲資源

**Sprite Pool**:

- 子彈和敵人使用物件池模式（Object Pool）
- 減少 GC（垃圾回收）壓力
- 最大池大小：子彈 100 個、敵人 50 個

### 4.2.4 Animation System

**動畫類型**:

- **Sprite Animation**：使用 `AnimatedSprite` 播放序列幀動畫
- **Tween Animation**：平滑移動和數值變化（考慮使用 gsap 或自製）
- **Particle Effects**：使用 `@pixi/particle-emitter` 處理特效

**動畫幀率**：

- 角色動畫：12 FPS
- 特效動畫：24 FPS

### 4.2.5 Collision Detection

**碰撞檢測方式**:

- AABB（Axis-Aligned Bounding Box）矩形碰撞
- 每幀檢查所有活躍實體

**碰撞組合**:

| 物件 A | 物件 B | 檢測方式       | 回應               |
| ------ | ------ | -------------- | ------------------ |
| 子彈   | 敵人   | AABB           | 敵人扣血，子彈消失 |
| 敵人   | 攤位   | AABB           | 偷取食材           |
| 敵人   | 底線   | X 座標檢查     | 扣玩家生命         |
| 玩家   | 敵人   | 無碰撞（穿透） | 無效果             |
| 玩家   | 邊界   | 邊界座標限制   | 停止移動           |

### 4.2.6 Performance Optimization

**渲染優化**:

- 使用 `ParticleContainer` 處理大量相似物件（子彈、小型敵人）
- 關閉不需要的互動性（`interactive = false`）
- 使用 `cacheAsBitmap` 快取靜態元素（攤位、HUD 背景）

**記憶體管理**:

- 銷毀不再使用的紋理和精靈
- 使用物件池減少物件建立/銷毀
- 定期清理 Ticker 監聽器

**目標效能**:

- 60 FPS（16.67ms per frame）
- 50 隻敵人 + 100 發子彈同時存在
- 記憶體使用 < 200 MB

## 4.3 Browser Compatibility

**目標瀏覽器**：

- Chrome 120+
- Firefox 120+
- Safari 17+

**不支援**：

- Internet Explorer
- 行動裝置瀏覽器（此版本僅支援桌面）

**必需功能**:

- WebGL 2.0 支援
- ES2020+ 語法支援
- Keyboard API

## 4.4 Asset Requirements

**紋理格式**:

- PNG（支援透明）
- 建議使用 Sprite Sheet 減少 HTTP 請求

**音效格式**:

- MP3 或 WebM（跨瀏覽器相容）
- 背景音樂：循環播放，檔案大小 < 2 MB
- 音效：短促，檔案大小 < 100 KB

**總資產大小**:

- 目標：< 10 MB
- 上限：< 25 MB（Cloudflare Pages 限制）

## 4.5 Deployment

**建置流程**:

1. TypeScript 編譯
2. Vite 打包（生產模式）
3. 資產最佳化（壓縮圖片、音效）
4. 部署至 Cloudflare Pages

**環境變數**:

- `VITE_VERSION`：遊戲版本號
- `VITE_ENVIRONMENT`：development / production

**Cloudflare Pages 設定**:

- 建置指令：`npm run build`
- 輸出目錄：`dist`
- Node 版本：18.x

# 5. Appendix

## 5.1 Open Questions

**待澄清的設計細節**:

1. 玩家角色視覺設計（大小、外觀）
2. 敵人生成位置（右側畫面外多遠？）
3. 食材掉落位置（敵人死亡位置？隨機偏移？）
4. 子彈飛行距離上限（穿透類子彈何時消失？）
5. 夜市總匯閃電跳躍距離（多遠內的敵人可被連鎖？）
6. 升級選項池大小（是否只有 3 種升級？）
7. 音效和背景音樂規格
8. 視覺風格（像素風、手繪風、3D 渲染？）
9. 敵人生成間隔（同時生成還是逐個生成？）
10. 合成失敗提示（食材不足時的 UI 反饋）
11. Sprite Sheet 規格（每個精靈的尺寸和佈局）
12. 粒子特效細節（爆炸、拾取、合成特效）
