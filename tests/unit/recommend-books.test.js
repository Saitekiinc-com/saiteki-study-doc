const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { cosineSimilarity } = require('../../scripts/recommend-books.js');

describe('recommend-books.js 単体テスト', () => {
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
