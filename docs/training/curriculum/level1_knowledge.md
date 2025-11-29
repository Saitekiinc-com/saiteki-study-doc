# Lv.1 基礎: ドキュメントの理解と仕組みの把握

Lv.1のゴールは、<strong>「公式ドキュメントを読み解き、技術の仕組み（Why/What）を正しく理解できること」</strong>です。
コードをコピペして動かすのではなく、そのコードが「なぜ動くのか」「背後で何が起きているのか」を説明できる状態を目指します。

## 1. Web標準の仕組み (The Why)
フレームワーク（React）を学ぶ前に、その土台となるWebの仕組みを理解する必要があります。

### 学習項目
*   **MDN Web Docsの歩き方**:
    *   一次情報（MDN）と二次情報（ブログ記事など）の違いを理解する。
    *   わからないことがあったらまずMDNを検索する癖をつける。
*   **ブラウザのレンダリング**:
    *   HTMLがどのように解析され、DOMツリーが構築されるか。
    *   CSSOMとDOMが合わさって描画される仕組み。
*   **HTTP/HTTPS**:
    *   リクエストとレスポンスの構造（ヘッダー、ボディ、ステータスコード）。
    *   REST APIの基本的な概念。

### チェックリスト
- [ ] MDNで `Array.prototype.map` の仕様を調べ、引数と戻り値を説明できる。
- [ ] ブラウザのアドレスバーにURLを入力してからページが表示されるまでの流れを説明できる。
- [ ] HTTPステータスコードの 200, 400, 401, 403, 404, 500 の違いを説明できる。

## 2. JavaScript/TypeScript (The Logic)
言語仕様を「なんとなく」ではなく「正確に」理解します。

### 学習項目
*   **ECMAScript仕様**:
    *   JavaScriptのバージョン（ES6/ES2015, ES2020など）の意味。
*   **非同期処理の概念**:
    *   シングルスレッドとイベントループの仕組み。
    *   なぜ `await` が必要なのか、Promiseの状態（Pending, Fulfilled, Rejected）。
*   **TypeScriptの型システム**:
    *   「型定義ファイル (`.d.ts`)」の役割。
    *   コンパイル時と実行時の違い（型は実行時には消える）。

### チェックリスト
- [ ] `const`, `let`, `var` のスコープの違いを図解できる。
- [ ] `Promise` を使った非同期処理のコードを見て、実行順序を正しく予測できる。
- [ ] TypeScriptの `interface` と `type` の使い分け（または違い）を説明できる。

## 3. Reactのメンタルモデル (The Mental Model)
React特有の「考え方」を身につけます。

### 学習項目
*   **宣言的UI vs 命令的UI**:
    *   jQuery（DOMを直接操作する）とReact（状態を定義してUIを導出する）の違い。
    *   「UI = f(state)」という数式の意味。
*   **仮想DOMとレンダリング**:
    *   Reactがなぜ速いのか（差分検知の仕組み）。
    *   再レンダリングが発生するトリガー（State変更、Props変更、親の再レンダリング）。
*   **コンポーネントのライフサイクル**:
    *   マウント（表示）、アップデート（更新）、アンマウント（非表示）の流れ。
    *   `useEffect` がどのタイミングで実行されるか。

### チェックリスト
- [ ] 「宣言的UI」のメリットを、具体的な例（ボタンの活性/非活性など）を使って説明できる。
- [ ] 親コンポーネントが再レンダリングされたとき、子コンポーネントがどうなるか説明できる。
- [ ] `useEffect` の依存配列（dependency array）の役割を説明できる。

## 推奨学習リソース

### 動画教材 (Udemy)
体系的に学びたい場合におすすめです。
*   **[【React18対応】モダンJavaScriptの基礎から始める挫折しないためのReact入門](https://boldjp.udemy.com/course/modern_javascipt_react_beginner/)**
    *   JavaScriptの基礎からReactの導入まで、挫折せずに学ぶための入門講座。
*   **[【完全保存版】React Hooksを完全に理解するHooksマスター講座【React18~19対応】](https://www.udemy.com/course/react-hooks-complete-course/)**
    *   `useState`, `useEffect` などのHooksを深く理解し、使いこなすための講座。
*   **[【世界で7万人が受講】Understanding TypeScript 日本語版](https://www.udemy.com/course/understanding-typescript-jp/)**
    *   TypeScriptの基礎から高度な型定義までを網羅的に学べるベストセラー講座。

### 公式ドキュメント (必読)
*   **[React公式: UIの記述 (Describing the UI)](https://ja.react.dev/learn/describing-the-ui)**
    *   コンポーネント、JSX、Propsなど、ReactでUIを構築するための基本概念。
*   **[TypeScript公式: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)**
    *   `Partial`, `Pick`, `Omit` など、型を便利に操作するための組み込み型。
*   **[MDN Web Docs](https://developer.mozilla.org/ja/)**
    *   Web標準（HTML/CSS/JS）の辞書として常に参照しましょう。

