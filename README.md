# 20260815_AI_work

This is a workspace for AI work.

- Commit test: Success!

## プロジェクト概要 (Overview)
AIを活用した開発や実験を行うためのワークスペースです。

## セットアップ (Setup)
このリポジトリをローカル環境で利用・開発するためのガイドラインです。

### 必要なツール
- Git
- GitHub CLI (gh)

### 開発の進め方
1. 変更を加えたら、ローカルでコミットします。
2. `git push` で GitHub に反映させます。

---

## Git 概念学習ゲーム「Git Quest」
Gitの基本操作を視覚的に体験できるWebゲームを同梱しています。

### 起動方法
ブラウザで直接 `index.html` を開くか、以下の手順でローカルサーバーを起動してアクセスしてください。

1. **ブラウザで直接開く場合**
   - フォルダ内の [index.html](file:///c:/Users/you23/Desktop/20260815_AI_work/index.html) をダブルクリックして開きます。

2. **ローカルサーバーで起動する場合（推奨）**
   - VS Codeなどの拡張機能（Live Server等）を使用するか、ターミナルで以下を実行します：
     ```bash
     npx http-server -p 8080
     ```
   - 起動後、ブラウザで [http://localhost:8080](http://localhost:8080) にアクセスします。

### ステージ紹介
- **Stage 1**: 最初のコミット（ワーキングツリー ➔ ステージング ➔ コミットの基本フロー）
- **Stage 2**: タイムトラベル（Checkoutによる過去の履歴への移動）
- **Stage 3**: 新たな世界（Branchingによる歴史の分岐）
- **Stage 4**: 統合の時（Mergeによる歴史の合流）
