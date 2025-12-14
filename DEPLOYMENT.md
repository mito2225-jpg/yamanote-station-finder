# 🚀 山手線診断アプリ デプロイガイド

## Vercel + Railway 無料デプロイ手順

### 前提条件
- GitHubアカウント
- Vercelアカウント（GitHubでサインアップ可能）
- Railwayアカウント（GitHubでサインアップ可能）

## 📋 デプロイ手順

### 1. GitHubリポジトリ作成
1. GitHub.comで新しいリポジトリを作成
2. ローカルでリモートを追加：
```bash
git remote add origin https://github.com/yourusername/yamanote-station-finder.git
git push -u origin main
```

### 2. Railway（バックエンド）デプロイ
1. [Railway.app](https://railway.app) にアクセス
2. "Login with GitHub"でサインアップ/ログイン
3. "New Project" → "Deploy from GitHub repo"
4. リポジトリを選択
5. **重要**: Root Directoryを `backend` に設定
6. 環境変数を設定：
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `CORS_ORIGIN` = `*` (後でVercelのURLに変更)

### 3. Vercel（フロントエンド）デプロイ
1. [Vercel.com](https://vercel.com) にアクセス
2. "Continue with GitHub"でサインアップ/ログイン
3. "New Project" → GitHubリポジトリを選択
4. 設定：
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 環境変数を設定：
   - `VITE_API_BASE_URL` = `https://your-railway-url.railway.app/api`

### 4. 最終設定
1. RailwayのURLをコピー
2. Vercelの環境変数 `VITE_API_BASE_URL` を更新
3. RailwayのCORS_ORIGINをVercelのURLに更新

## 🔧 トラブルシューティング

### よくある問題
1. **CORS エラー**: CORS_ORIGIN環境変数を確認
2. **API接続エラー**: VITE_API_BASE_URL環境変数を確認
3. **ビルドエラー**: package.jsonの依存関係を確認

### デバッグ方法
- Railway: Deployタブでログを確認
- Vercel: Functionsタブでログを確認

## 💰 無料枠の制限
- **Railway**: 月$5クレジット（通常のアプリなら十分）
- **Vercel**: 100GB帯域/月、1000回ビルド/月

## 🔄 自動デプロイ
GitHubにプッシュすると自動的に両方のサービスがデプロイされます。