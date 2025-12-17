const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { cosineSimilarity } = require('../../scripts/recommend-books.js');

describe('recommend-books.js Unit Tests', () => {
    describe('cosineSimilarity', () => {
        it('should return 1 for identical vectors', () => {
            const vecA = [1, 2, 3];
            const vecB = [1, 2, 3];
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result - 1.0) < 0.0001);
        });

        it('should return 0 for orthogonal vectors', () => {
            const vecA = [1, 0];
            const vecB = [0, 1];
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result) < 0.0001);
        });

        it('should return -1 for opposite vectors', () => {
            const vecA = [1, 1];
            const vecB = [-1, -1];
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result - (-1.0)) < 0.0001);
        });

        it('should handle different lengths (although not expected in valid use case)', () => {
            // Basic implementation iterates up to vecA.length.
            // If vecB is shorter, it multiplies by undefined (NaN).
            // This test just documents current behavior or ensures robustness if needed.
            // For now, let's just assume valid inputs for simple unit test.
            const vecA = [1, 0];
            const vecB = [1, 0, 0];
            // Implementation: dotProduct will process index 0, 1. (Length of vecA is 2).
            // A[0]*B[0] = 1*1 = 1
            // A[1]*B[1] = 0*0 = 0
            // dot = 1.
            // normA = 1+0 = 1. sqrt(1)=1.
            // normB = 1+0 = 1 (loop only goes to vecA.length). sqrt(1)=1.
            // Result 1. This essentially ignores extra elements of B.
            const result = cosineSimilarity(vecA, vecB);
            assert.ok(Math.abs(result - 1.0) < 0.0001);
        });
    });
});
