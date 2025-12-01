# Lv.4 エキスパート: アーキテクチャ・技術選定

Lv.4のゴールは、<strong>「アーキテクチャの設計や技術選定ができること」</strong>です。
プロジェクトの要件や規模に合わせて最適な技術スタックを選び、チーム全体が開発しやすい土台を作ります。

## 1. フロントエンドアーキテクチャ
大規模になっても破綻しない構造を設計します。

### 学習項目
*   **デザインパターン**:
    *   Container/Presentational Pattern。
    *   Render Props, HOC (Higher-Order Components) - ※現代ではHooksで代替されることも多いが知識として必要。
*   **ディレクトリ構成とアーキテクチャ**:
    *   **Atomic Design**: UIを原子・分子・生体などに分ける考え方。
    *   **Feature-Sliced Design (FSD)**: 機能（Feature）ごとに分割する、大規模向けアーキテクチャ。
    *   **Colocation**: 関連するファイル（テスト、スタイル、コンポーネント）を近くに置く原則。

### チェックリスト
- [ ] プロジェクトの規模感に合わせて、適切なディレクトリ構成を提案できる。
- [ ] Atomic Designのメリットとデメリットを説明できる。
- [ ] 循環参照を防ぐためのモジュール依存関係を設計できる。

## 2. 技術選定とエコシステム
流行り廃りではなく「適材適所」で技術を選びます。

### 学習項目
*   **レンダリング戦略**:
    *   CSR (Client-Side Rendering), SSR (Server-Side Rendering), SSG (Static Site Generation), ISR (Incremental Static Regeneration) の違いと使い分け。
    *   Next.js / Remix などのフレームワーク選定。
*   **スタイリング戦略**:
    *   CSS Modules, CSS-in-JS (Styled-components, Emotion), Utility-first (Tailwind CSS) の比較選定。
*   **ビルドツール**:
    *   Vite, Webpack, Turbopack の違い。

### チェックリスト
- [ ] SEOが重要なLPと、インタラクティブな管理画面で、それぞれ適したレンダリング戦略を選べる。
- [ ] チームのスキルセットを考慮して、CSSフレームワークを選定できる。

## 3. 開発プロセスとスケーラビリティ
チーム全体の生産性を向上させます。

### 学習項目
*   **マイクロフロントエンド**:
    *   巨大なアプリを複数の小さなアプリに分割する技術。
*   **モノレポ (Monorepo)**:
    *   Nx, TurboRepo などを使った複数プロジェクトの管理。
*   **開発体験 (DX) の向上**:
    *   ESLint, Prettier のカスタムルール設定。
    *   CI/CDパイプラインの構築（自動テスト、自動デプロイ、プレビュー環境）。
    *   Storybook によるUIカタログ管理。

### チェックリスト
- [ ] チーム内で統一されたコーディング規約を策定し、Linterで強制できる。
- [ ] GitHub Actionsを使って、Pull Request時に自動でテストが走るフローを構築できる。

## 推奨学習リソース
*   **[Feature-Sliced Design](https://feature-sliced.design/)**
*   **[Next.js Documentation](https://nextjs.org/docs)**
*   **[Atomic Design by Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)**
