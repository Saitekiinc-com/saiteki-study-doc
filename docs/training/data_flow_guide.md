# データの流れとシステム設計 (Data Flow & System Design)

アプリケーション開発において、フロントエンドとバックエンドは別々の存在ではありません。
**「ユーザーの入力したデータを、安全にデータベースに保存し、必要な時に取り出して表示する」** という一つの目的のために連携するチームです。

このドキュメントでは、アプリケーション全体を「データの流れ」として捉え、各フェーズで意識すべき観点を解説します。

## 1. 全体像: データの旅

ユーザーが「保存ボタン」を押してから、データがデータベースに格納され、再び画面に表示されるまでの旅を見てみましょう。

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FE as ⚛️ Frontend (Client)
    participant API as 🛡️ API / Boundary
    participant BE as ⚙️ Backend (Server)
    participant DB as 🗄️ Database

    Note over User, FE: 1. Input & Action
    User->>FE: フォーム入力 & 送信

    Note over FE: 2. UI/UX & Validation
    FE->>FE: 入力チェック (必須, 文字数)
    FE->>API: HTTP Request (POST /data)

    Note over API: 3. Security & Interface
    API->>API: 認証 (Who?) & 認可 (Can?)
    API->>API: データ検証 (型, 形式)

    Note over BE: 4. Business Logic
    API->>BE: 処理実行
    BE->>BE: 計算, 加工, 外部連携

    Note over DB: 5. Persistence
    BE->>DB: INSERT / UPDATE
    DB-->>BE: Result

    BE-->>API: Response Data
    API-->>FE: HTTP Response (200 OK)

    Note over FE: 6. Feedback
    FE->>User: 完了メッセージ / 画面更新
```

## 2. 各フェーズの役割と観点

### ① Frontend: 最高のユーザー体験 (UX) を作る
データの入り口であり、出口です。ユーザーがストレスなくデータを入力・閲覧できるようにすることが使命です。

*   **即座のフィードバック**:
    *   サーバーに送る前に、明らかな間違い（必須漏れ、メール形式など）を検知し、その場でユーザーに教える。
*   **操作性 (Usability)**:
    *   入力しやすいフォーム、分かりやすいエラーメッセージ。
    *   ローディング表示（処理中であることを伝える）。

### ② API / Boundary: 鉄壁の守り (Security)
インターネットという「公道」と、システム内部の「私有地」の境界線です。ここで不正な侵入を防ぎます。

*   **認証 (Authentication)**:
    *   「あなたは誰ですか？」 (ログイン状態の確認)。
*   **認可 (Authorization)**:
    *   「あなたにその権限はありますか？」 (他人のデータを書き換えようとしていないか)。
*   **バリデーション (Validation)**:
    *   フロントエンドのチェックは「親切」のためですが、APIのチェックは「安全」のためです。**フロントエンドからのデータは決して信用してはいけません。**

### ③ Backend: ビジネスロジックの要 (Logic)
データの加工や、複雑なルールの適用を行います。

*   **整合性 (Consistency)**:
    *   「在庫を減らす」と「注文履歴を作る」をセットで行う（トランザクション）。
*   **計算と加工**:
    *   合計金額の計算、メールの送信、外部決済システムとの連携。

### ④ Database: 資産の保管庫 (Persistence)
システムの中で最も重要な「データ資産」を永続的に守ります。

*   **正規化 (Normalization)**:
    *   データの重複をなくし、矛盾が起きないように設計する。
*   **スケーラビリティ (Scalability)**:
    *   データ量が100万件、1000万件になっても検索できるように、インデックスを貼る。
    *   将来の機能拡張（カラム追加など）に耐えられる設計にする。

## まとめ
フロントエンドエンジニアも「このデータはDBにどう保存されるか？」を想像し、
バックエンドエンジニアも「ユーザーはこのデータをどう使うか？」を想像する。

お互いの領域を理解し、**「データのバケツリレー」** をスムーズにすることが、良いアプリケーションを作る鍵です。
