# Lv.1 基礎: Webアプリケーションの仕組みと原理原則

Lv.1のゴールは、<strong>「フロントエンド・バックエンドを区別せず、Webアプリケーション全体が動く仕組み（Why/What）を正しく理解できること」</strong>です。
特定のフレームワーク（Reactなど）を学ぶ前に、その土台となるWeb標準、言語仕様、データベースの概念を習得します。

## 1. Web標準とHTTP (The Infrastructure)
Webアプリケーションが通信する共通のルールを理解します。

### 学習項目
*   **HTTP/HTTPS**:
    *   リクエストとレスポンスの構造（ヘッダー、ボディ、ステータスコード）。
    *   メソッドの使い分け（GET vs POST, 副作用の有無）。
    *   ステートレスとは何か。
*   **ブラウザのレンダリング**:
    *   HTMLが解析され、DOMツリーが構築される流れ。
    *   JavaScriptが実行されるタイミング。

### チェックリスト
- [ ] ブラウザのアドレスバーにURLを入力してからページが表示されるまでの流れを、DNS、サーバー、DBを含めて説明できる。
- [ ] HTTPステータスコードの 200, 400, 401, 403, 404, 500 の違いを説明できる。
- [ ] GETとPOSTの違いを、副作用（Side Effect）の観点から説明できる。

## 2. JavaScript/TypeScript (The Language)
フロントエンドでもバックエンド（Node.js）でも共通して使われる言語仕様を理解します。

### 学習項目
*   **ECMAScript仕様**:
    *   `const`, `let`, `var` のスコープ。
    *   アロー関数と `this` の挙動。
*   **非同期処理**:
    *   イベントループの仕組み。
    *   `Promise`, `async/await` の使い方とエラーハンドリング。
*   **TypeScriptの型システム**:
    *   静的型付けのメリット（コンパイル時の安全性）。
    *   `interface` と `type` の使い分け。

### チェックリスト
- [ ] `Promise` を使った非同期処理のコードを見て、実行順序を正しく予測できる。
- [ ] TypeScriptの型定義ファイル (`.d.ts`) の役割を説明できる。

## 3. フロントエンドのメンタルモデル (The UI)
Reactなどのライブラリが解決しようとしている課題を理解します。

### 学習項目
*   **宣言的UI vs 命令的UI**:
    *   jQuery（DOM直接操作）とReact（状態駆動）の違い。
    *   「UI = f(state)」という考え方。
*   **コンポーネント指向**:
    *   再利用性とカプセル化。
    *   Propsによるデータの受け渡し。

### チェックリスト
- [ ] 「宣言的UI」のメリットを説明できる。
- [ ] 親コンポーネントが再レンダリングされたときの影響範囲を説明できる。

## 4. バックエンドとデータベース (The Data)
データがどのように保存され、守られているかを理解します。

### 学習項目
*   **RDBMS (Relational Database)**:
    *   テーブル、カラム、レコードの関係。
    *   リレーションシップ（1対多、多対多）と正規化。
    *   基本的なSQL (SELECT, INSERT, UPDATE, DELETE)。
*   **API設計**:
    *   RESTfulなURL設計。
    *   JSONデータの構造。
*   **セキュリティ（認証・認可）**:
    *   「誰か（Authentication）」と「権限があるか（Authorization）」の違い。
    *   パスワードのハッシュ化保存の必要性。

### チェックリスト
- [ ] 1対多、多対多のリレーションシップを図解できる。
- [ ] トランザクションが必要な場面（銀行の送金など）を説明できる。
- [ ] HTTPSを使わない通信でログイン情報を送る危険性を説明できる。

## 推奨学習リソース

### 共通・基礎
*   **[MDN Web Docs](https://developer.mozilla.org/ja/)**: Web標準の辞書。
*   **[Understanding TypeScript](https://www.udemy.com/course/understanding-typescript-jp/)**: 型システムの理解に。

### フロントエンド
*   **[React公式: UIの記述](https://ja.react.dev/learn/describing-the-ui)**: コンポーネントの基礎。

### バックエンド・DB
*   **[SQL書き方ドリル](https://www.amazon.co.jp/dp/B00J7F5G84)**: SQLの基礎練習。
*   **[Webを支える技術](https://gihyo.jp/book/2010/978-4-7741-4204-3)**: HTTPとRESTのバイブル。
