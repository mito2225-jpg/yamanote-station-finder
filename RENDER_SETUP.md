# 🚀 Render デプロイ設定ガイド

## 基本設定

### Web Service作成
1. [Render.com](https://render.com) → **"Get Started for Free"**
2. **GitHub** でサインアップ
3. **"New +"** → **"Web Service"**
4. **"Connect a repository"** → `yamanote-station-finder` を選択

### 必須設定項目

| 項目 | 設定値 | 重要度 |
|------|--------|--------|
| **Name** | `yamanote-backend` | 必須 |
| **Environment** | **Node** | ⭐ 言語設定 |
| **Region** | `Oregon (US West)` | 推奨 |
| **Branch** | `main` | 必須 |
| **Root Directory** | `backend` | ⭐ 重要 |
| **Build Command** | `npm ci && npm run build` | 必須 |
| **Start Command** | `npm start` | 必須 |

## 環境変数設定

**Advanced** セクションで追加：

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `*` |

## 自動検出される設定

Renderは以下を自動検出します：
- ✅ **Node.js バージョン** (package.json の engines から)
- ✅ **依存関係** (package.json から)
- ✅ **ポート番号** (環境変数 PORT = 10000)

## デプロイ後の確認

1. **Deploy** ボタンをクリック
2. **Logs** でビルド状況を確認
3. **URL** が生成されたらアクセステスト
4. `/api/health` エンドポイントで動作確認

## トラブルシューティング

### よくある問題
- **Build失敗**: Root Directory が `backend` になっているか確認
- **Start失敗**: package.json に `start` スクリプトがあるか確認
- **Port エラー**: アプリが `process.env.PORT` を使用しているか確認

### 解決方法
1. **Logs** タブでエラー詳細を確認
2. **Settings** で設定を再確認
3. **Manual Deploy** で再デプロイ