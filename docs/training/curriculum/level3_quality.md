# Lv.3 発展: 品質・保守性・パフォーマンス

Lv.3のゴールは、<strong>「保守性の高いコードやパフォーマンスを意識した設計ができること」</strong>です。
自分以外の人が見ても理解しやすく、将来の変更に強く、そしてユーザーにとって快適なアプリケーションを作ります。

## 1. テストと品質保証
「動く」ことを自動テストで保証します。

### 学習項目
*   **単体テスト (Jest/Vitest)**:
    *   純粋な関数（ロジック）のテスト。
*   **コンポーネントテスト (React Testing Library)**:
    *   ユーザーの操作（クリック、入力）をシミュレートしたテスト。
    *   実装詳細ではなく「振る舞い」をテストする重要性。
*   **E2Eテスト (Playwright/Cypress)**:
    *   ブラウザを実際に操作する統合的なテスト。

### チェックリスト
- [ ] ユーティリティ関数の単体テストを書ける。
- [ ] ボタンをクリックして表示が変わるコンポーネントのテストを書ける。
- [ ] テストのカバレッジ（網羅率）を意識できる。

## 2. パフォーマンス最適化
無駄を省き、高速なアプリを作ります。

### 学習項目
*   **再レンダリングの抑制**:
    *   `React.memo` によるコンポーネントのメモ化。
    *   `useMemo`, `useCallback` の適切な使用タイミング（何でもメモ化すれば良いわけではない）。
*   **コード分割 (Code Splitting)**:
    *   `React.lazy` と `Suspense` を使った遅延読み込み。
*   **Web Vitals**:
    *   LCP, FID, CLS などの指標の意味と改善方法。

### チェックリスト
- [ ] React DevToolsのProfilerを使って、レンダリングに時間がかかっているコンポーネントを特定できる。
- [ ] `useMemo` を使うべき場面とそうでない場面を説明できる。
- [ ] 初期ロード時間を短縮するための施策を提案できる。

## 3. 保守性の高い設計
「スパゲッティコード」を卒業します。

### 学習項目
*   **カスタムフックによるロジック分離**:
    *   View（見た目）とLogic（振る舞い）の分離。
    *   再利用可能なフックの設計。
*   **状態管理パターン**:
    *   Context API の適切な利用（Prop Drillingの回避）。
    *   Global State (Redux, Zustand, Recoil) の導入判断。
    *   Server State (TanStack Query, SWR) と Client State の分離。
*   **アクセシビリティ (a11y)**:
    *   セマンティックなHTML。
    *   WAI-ARIA属性 (`aria-label`, `role` など) の基本。
    *   キーボード操作への対応。

### チェックリスト
- [ ] 複雑なコンポーネントからロジックをカスタムフックに切り出せる。
- [ ] グローバルステートにするべきデータと、ローカルステートで良いデータの区別がつく。
- [ ] スクリーンリーダーで読み上げたときに意味が通じるマークアップができる。

## 推奨学習リソース
*   **[React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)**
*   **[TanStack Query Docs](https://tanstack.com/query/latest)**
*   **[Web Vitals (Google Developers)](https://web.dev/vitals/)**
