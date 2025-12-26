import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { cosineSimilarity, getSystemInstruction, getUserPrompt } from './recommend-books.js';

describe('recommend-books.ts 単体テスト', () => {
    describe('getSystemInstruction (システムインストラクション生成)', () => {
        it('組織ガイドのプレースホルダーが含まれること', () => {
            const result = getSystemInstruction('テスト組織のガイドライン');

            // 修正: 引数が正しく展開されていることを確認
            assert.ok(result.includes('テスト組織のガイドライン'), 'aiNativeGuideの内容が展開されていること');
            assert.ok(result.includes('あなたは、企業の成長とメンバーの幸福を最大化'), '役割定義が含まれるべき');
            assert.ok(result.includes('<organization_guide>'), '組織ガイドセクションが存在すべき');
        });

        it('必須セクションが含まれること', () => {
            const result = getSystemInstruction(''); // 空文字でもその他は出る

            assert.ok(result.includes('出力フォーマット'), '出力フォーマットセクションが必須');
            assert.ok(result.includes('📚 推奨書籍'), '推奨書籍セクションが必須');
            assert.ok(result.includes('ギャップ分析'), 'ギャップ分析セクションが必須');
            assert.ok(result.includes('絶対的なルール'), '絶対的なルールセクションが必須');
        });

        it('searchGoogleBooks ツールの使用が指示されていること', () => {
            const result = getSystemInstruction('');

            assert.ok(result.includes('searchGoogleBooks'), 'searchGoogleBooksツールの記載が必要');
            assert.ok(result.includes('searchKnowledgeBase'), 'searchKnowledgeBaseツールの記載が必要');
        });
    });

    describe('getUserPrompt (ユーザープロンプト生成)', () => {
        it('ユーザーリクエストがプロンプトに含まれること', () => {
            const userRequest = 'RAGシステムを構築したい';
            const result = getUserPrompt(userRequest);

            // 修正: 引数が正しく展開されていることを確認
            assert.ok(result.includes('RAGシステムを構築したい'), 'ユーザーリクエストの内容が展開されていること');
            assert.ok(result.includes('ユーザーリクエスト'), 'ユーザーリクエストセクションが必須');
        });

        it('手順が含まれること', () => {
            const result = getUserPrompt('テスト');

            assert.ok(result.includes('手順'), '手順セクションが必須');
            assert.ok(result.includes('searchGoogleBooks'), 'searchGoogleBooksの使用指示が必要');
            assert.ok(result.includes('searchInternalReviews'), 'searchInternalReviewsの使用指示が必要');
        });
    });

    describe('cosineSimilarity (コサイン類似度)', () => {
        it('完全に一致するベクトルの場合は1を返すこと', () => {
            const vecA = [1, 2, 3];
            const vecB = [1, 2, 3];
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result - 1.0) < 0.0001);
        });

        it('直交するベクトルの場合は0を返すこと', () => {
            const vecA = [1, 0];
            const vecB = [0, 1];
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result) < 0.0001);
        });

        it('反対向きのベクトルの場合は-1を返すこと', () => {
            const vecA = [1, 1];
            const vecB = [-1, -1];
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result - (-1.0)) < 0.0001);
        });

        it('異なる長さのベクトルを処理できること（実装仕様として短い方に合わせる）', () => {
            // 基本実装では vecA.length までループします。
            // vecB が短い場合、undefined (NaN) との乗算になる可能性がありますが、
            // 現在の単純な実装では vecA のインデックスのみを参照しています。
            // このテストは現在の挙動を文書化するためのものです。
            const vecA = [1, 0];
            const vecB = [1, 0, 0];
            // 実装詳細:
            // A[0]*B[0] = 1*1 = 1
            // A[1]*B[1] = 0*0 = 0
            // dot = 1.
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result - 1.0) < 0.0001);
        });
    });
});
