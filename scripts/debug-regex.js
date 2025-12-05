const body = `
### お名前

杉本

### 役割 (Role)

フロントエンド

### 経験年数

8年

### 達成したい目標 (Objective / Goal)

チームの意見をまとめたい

### わかっていること (Current Understanding)

Pros/Consでまとめると有効であること

### わかっていないこと (Current Challenges/Unknowns)

Pros/Cons以外の方法をしらない
`;

function extractValue(label) {
  // Match ### Label (anything until newline) \n\n (Value) \n\n (next ### or end)
  const regex = new RegExp(`###\\s*${label}[^\\n]*\\n+([\\s\\S]*?)(?:###|$)`);
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

console.log("Name:", extractValue('お名前'));
console.log("Role:", extractValue('役割'));
console.log("Experience:", extractValue('経験年数'));
console.log("Objective:", extractValue('達成したい目標'));
console.log("Understanding:", extractValue('わかっていること'));
console.log("Unknowns:", extractValue('わかっていないこと'));
