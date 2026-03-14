# みこクエスト - Quest Management PWA v1.1

## ファイル構成

```
quest-pwa/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── app.js              # アプリケーションロジック
├── sw.js               # Service Worker (PWAオフライン対応)
├── manifest.json       # PWAマニフェスト
├── README.md           # このファイル
└── assets/
    ├── background/
    │   └── background.png          # 背景画像 (1920×1080)
    ├── characters/
    │   ├── character-default.png   # デフォルト立ち絵 (800×1200以上, 透過PNG)
    │   ├── character-alt1.png      # 立ち絵2
    │   └── character-alt2.png      # 立ち絵3
    ├── effects/
    │   ├── quest-clear-stamp.png   # クリアスタンプ (1000×1000)
    │   └── sakura-petal.png        # 桜の花びら
    ├── icons/
    │   ├── icon-192.png            # PWAアイコン
    │   ├── icon-512.png            # PWAアイコン大
    │   └── icon-1024.png           # 高解像度アイコン
    └── audio/
        ├── main-bgm.mp3            # メインBGM (ループ)
        ├── quest-clear.mp3         # クエストクリアSE
        ├── subquest-clear.mp3      # サブクエストクリアSE
        ├── level-up.mp3            # レベルアップSE
        └── character/
            ├── voice01.mp3         # キャラボイス1
            ├── voice02.mp3         # キャラボイス2
            ├── voice03.mp3         # キャラボイス3
            └── voice04.mp3         # キャラボイス4
```

## GitHub Pages へのデプロイ手順

1. GitHubリポジトリを作成
2. 全ファイルをpush
3. Settings → Pages → Source: Deploy from a branch → main → / (root)
4. `https://<username>.github.io/<repo-name>/` でアクセス

## iPhoneへのホーム画面追加

1. Safariでアプリを開く
2. 共有ボタン → ホーム画面に追加
3. 「みこクエスト」という名前で追加される

## アセット素材について

### 画像素材が未配置の場合
- 立ち絵: 🌸 絵文字のフォールバック表示
- クリアスタンプ: テキスト表示 "QUEST CLEAR!"
- 背景: CSSグラデーション（既に適用済み）

### 音声素材が未配置の場合
- 音声なしでも全機能が動作します
- 素材配置後にブラウザキャッシュをクリアしてください

## 実装済み機能（v1.1）

### クエスト管理
- [x] 親クエスト作成・編集・削除
- [x] サブクエスト作成（クエスト追加時）
- [x] サブクエスト個別達成
- [x] 親クエスト達成（サブクエスト全完了時 or 単体）
- [x] 期限設定・期限切れ警告表示
- [x] IndexedDB による永続保存

### EXP・レベルシステム
- [x] サブクエスト達成: +10 EXP（デフォルト、変更可）
- [x] 親クエスト達成: +50 EXP（デフォルト、変更可）
- [x] レベルアップ判定（必要EXP = 100 + (Lv-1) × 50）
- [x] 余剰EXP持ち越し
- [x] EXPバー表示

### 演出
- [x] クエストクリアスタンプ演出
- [x] レベルアップオーバーレイ演出
- [x] 桜の花びら（常時 + クリア時バースト）
- [x] キャラクターバウンスアニメーション

### キャラクター
- [x] 画面左下固定表示
- [x] タップでランダムボイス再生
- [x] 同じボイスの連続再生防止
- [x] 多重再生防止
- [x] 設定画面でキャラクター切り替え

### サウンド
- [x] BGM ON/OFF・音量調整
- [x] SE ON/OFF
- [x] 各SEの音量個別調整
- [x] localStorage への設定保存

### PWA
- [x] Service Worker（オフラインキャッシュ）
- [x] manifest.json
- [x] iPhoneホーム画面追加対応
- [x] スタンドアロン表示
