/**
 * 書籍探索Issueのパース処理
 * book-search.yml ワークフロー内で使用されるパースロジックを切り出したもの
 */

export type BookSearchInput = {
    role: string;
    experience: string;
    objective: string;
    currentUnderstanding: string;
    currentUnknowns: string;
};

/**
 * Issue Form の本文から指定されたラベルの値を抽出します。
 * Issue Forms format: ### Label\n\nValue\n\n
 * 
 * @param body Issue の本文
 * @param label 抽出するラベル名
 * @returns 抽出された値（見つからない場合は空文字列）
 */
export function extractValue(body: string, label: string): string {
    // Match ### Label (anything until newline) \n\n (Value) \n\n (next ### or end)
    const regex = new RegExp(`###\\s*${label}[^\\n]*\\n+([\\s\\S]*?)(?:###|$)`);
    const match = body.match(regex);
    return match ? match[1].trim() : '';
}

/**
 * 書籍探索Issueの本文をパースして構造化データを返します。
 * 
 * @param body Issue の本文
 * @returns パースされた入力データ
 */
export function parseBookSearchIssue(body: string): BookSearchInput {
    return {
        role: extractValue(body, '役割'),
        experience: extractValue(body, '経験年数'),
        objective: extractValue(body, '達成したい目標'),
        currentUnderstanding: extractValue(body, 'わかっていること'),
        currentUnknowns: extractValue(body, 'わかっていないこと'),
    };
}

/**
 * パースされたデータをワークフロー用の USER_REQUEST 形式に変換します。
 * 
 * @param input パースされた入力データ
 * @returns USER_REQUEST 形式の文字列
 */
export function formatUserRequest(input: BookSearchInput): string {
    return `【役割】: ${input.role}
【経験年数】: ${input.experience}
【わかっていること】: ${input.currentUnderstanding}
【わかっていないこと】: ${input.currentUnknowns}
【達成したい目標】: ${input.objective}`;
}

// GitHub Actions Output Helper
function setOutput(name: string, value: string) {
    const filePath = process.env.GITHUB_OUTPUT;
    if (filePath) {
        const fs = require('fs');
        const os = require('os');
        fs.appendFileSync(filePath, `${name}=${value}${os.EOL}`);
    } else {
        // Fallback for local testing or old runner (though deprecated)
        console.log(`::set-output name=${name}::${value}`);
    }
}

// CLI 実行用（環境変数から Issue body を読み取る）
async function main() {
    const body = process.env.ISSUE_BODY;
    if (!body) {
        console.error('Error: ISSUE_BODY environment variable is required.');
        process.exit(1);
    }

    const parsed = parseBookSearchIssue(body);
    const userRequest = formatUserRequest(parsed);

    // GitHub Actions outputs として設定
    setOutput('role', parsed.role);
    setOutput('experience', parsed.experience);
    setOutput('objective', parsed.objective);
    setOutput('current_understanding', parsed.currentUnderstanding);
    setOutput('current_unknowns', parsed.currentUnknowns);
    setOutput('user_request', userRequest);

    // デバッグ用出力
    console.log('--- Parsed Values ---');
    console.log(`Role: ${parsed.role}`);
    console.log(`Experience: ${parsed.experience}`);
    console.log(`Objective: ${parsed.objective}`);
    console.log(`Understanding: ${parsed.currentUnderstanding}`);
    console.log(`Unknowns: ${parsed.currentUnknowns}`);
}

if (require.main === module) {
    main();
}
