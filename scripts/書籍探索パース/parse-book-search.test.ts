import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { extractValue, parseBookSearchIssue, formatUserRequest, BookSearchInput } from './parse-book-search.js';

describe('parse-book-search.ts 単体テスト', () => {

    describe('extractValue (フィールド抽出)', () => {
        const sampleBody = `### 役割
Frontend Engineer

### 経験年数
3年

### 達成したい目標
個人開発でメモアプリを作りたい

### わかっていること
- React: コンポーネントの作成、Props/Stateの管理はできる。
- Backend: REST APIの概念は理解している。

### わかっていないこと
- React: useEffectの依存配列の挙動が怪しい。
- Backend: DBのインデックス設計がわからない。
`;

        it('役割を正しく抽出できること', () => {
            const result = extractValue(sampleBody, '役割');
            assert.strictEqual(result, 'Frontend Engineer');
        });

        it('経験年数を正しく抽出できること', () => {
            const result = extractValue(sampleBody, '経験年数');
            assert.strictEqual(result, '3年');
        });

        it('達成したい目標を正しく抽出できること', () => {
            const result = extractValue(sampleBody, '達成したい目標');
            assert.strictEqual(result, '個人開発でメモアプリを作りたい');
        });

        it('複数行の値を正しく抽出できること（わかっていること）', () => {
            const result = extractValue(sampleBody, 'わかっていること');
            assert.ok(result.includes('React: コンポーネントの作成'));
            assert.ok(result.includes('Backend: REST APIの概念は理解している'));
        });

        it('複数行の値を正しく抽出できること（わかっていないこと）', () => {
            const result = extractValue(sampleBody, 'わかっていないこと');
            assert.ok(result.includes('useEffectの依存配列'));
            assert.ok(result.includes('DBのインデックス設計'));
        });

        it('存在しないフィールドの場合は空文字を返すこと', () => {
            const result = extractValue(sampleBody, '存在しないフィールド');
            assert.strictEqual(result, '');
        });

        it('空の本文から抽出を試みた場合は空文字を返すこと', () => {
            const result = extractValue('', '役割');
            assert.strictEqual(result, '');
        });
    });

    describe('parseBookSearchIssue (Issue パース)', () => {
        const sampleBody = `### 役割
SRE

### 経験年数
5年

### 達成したい目標
Kubernetes運用を効率化したい

### わかっていること
基本的なk8sリソースの操作

### わかっていないこと
Helm chartの設計パターン
`;

        it('すべてのフィールドを正しくパースできること', () => {
            const result = parseBookSearchIssue(sampleBody);

            assert.strictEqual(result.role, 'SRE');
            assert.strictEqual(result.experience, '5年');
            assert.strictEqual(result.objective, 'Kubernetes運用を効率化したい');
            assert.strictEqual(result.currentUnderstanding, '基本的なk8sリソースの操作');
            assert.strictEqual(result.currentUnknowns, 'Helm chartの設計パターン');
        });

        it('空の本文でもエラーにならず空のオブジェクトを返すこと', () => {
            const result = parseBookSearchIssue('');

            assert.strictEqual(result.role, '');
            assert.strictEqual(result.experience, '');
            assert.strictEqual(result.objective, '');
            assert.strictEqual(result.currentUnderstanding, '');
            assert.strictEqual(result.currentUnknowns, '');
        });
    });

    describe('formatUserRequest (USER_REQUEST フォーマット)', () => {
        it('正しいフォーマットで出力されること', () => {
            const input: BookSearchInput = {
                role: 'Frontend Engineer',
                experience: '3年',
                objective: 'メモアプリを作りたい',
                currentUnderstanding: 'Reactの基本',
                currentUnknowns: 'パフォーマンスチューニング',
            };

            const result = formatUserRequest(input);

            assert.ok(result.includes('【役割】: Frontend Engineer'));
            assert.ok(result.includes('【経験年数】: 3年'));
            assert.ok(result.includes('【達成したい目標】: メモアプリを作りたい'));
            assert.ok(result.includes('【わかっていること】: Reactの基本'));
            assert.ok(result.includes('【わかっていないこと】: パフォーマンスチューニング'));
        });

        it('空の入力でもフォーマット構造は維持されること', () => {
            const input: BookSearchInput = {
                role: '',
                experience: '',
                objective: '',
                currentUnderstanding: '',
                currentUnknowns: '',
            };

            const result = formatUserRequest(input);

            assert.ok(result.includes('【役割】:'));
            assert.ok(result.includes('【経験年数】:'));
        });
    });
});
