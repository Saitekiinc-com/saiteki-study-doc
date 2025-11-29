# 01. 基礎モジュール: React & TypeScript の土台作り

このモジュールでは、モダンなフロントエンド開発に必要な基礎知識を習得します。

## 1. HTML/CSS/JavaScript (ES6+) の復習
Reactを学ぶ前に、Web標準技術の理解が不可欠です。

*   **HTML**: セマンティックなマークアップ、アクセシビリティ（a11y）の基本。
*   **CSS**: Flexbox, Grid, レスポンシブデザイン, CSS Variables。
*   **JavaScript (ES6+)**:
    *   `const` / `let`
    *   アロー関数
    *   分割代入 (Destructuring)
    *   スプレッド構文 (`...`)
    *   Modules (`import` / `export`)
    *   非同期処理 (`Promise`, `async/await`)
    *   配列メソッド (`map`, `filter`, `reduce`)

## 2. TypeScript 入門
型安全性を持つJavaScriptとしてのTypeScriptを学びます。

*   **基本型**: `string`, `number`, `boolean`, `array`, `object`。
*   **型推論**: TypeScriptがどのように型を推論するか。
*   **インターフェースと型エイリアス**: `interface` vs `type`。
*   **関数と型**: 引数と戻り値の型定義。
*   **ジェネリクス (Generics)**: 柔軟で再利用可能なコードの記述。
*   **Union Types & Intersection Types**: 型の組み合わせ。
*   **Optional Chaining & Nullish Coalescing**: 安全なプロパティアクセス。

## 3. React コアコンセプト
Reactの宣言的なUI構築手法を学びます。

*   **JSX**: JavaScriptの中にマークアップを書く構文。
*   **コンポーネント**: UIを独立した再利用可能な部品に分割する。
*   **Props**: 親コンポーネントから子コンポーネントへのデータ受け渡し。
    *   TypeScriptでのPropsの型定義。
*   **State (useState)**: コンポーネント内部の状態管理。
*   **Side Effects (useEffect)**: データの取得や購読などの副作用の扱い。
*   **イベントハンドリング**: ユーザー操作への応答。
*   **リストとキー**: 配列データのレンダリング。

## 課題
*   TypeScriptを使って、基本的な計算機関数を作成し、型定義を行う。
*   Reactを使って、カウンターアプリを作成する（`useState`を使用）。
*   APIからデータを取得してリスト表示するコンポーネントを作成する（`useEffect`を使用）。
