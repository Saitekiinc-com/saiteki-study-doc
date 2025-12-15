/**
 * Google Books API 定義
 */
const declaration = {
  name: "searchGoogleBooks",
  parameters: {
    type: "OBJECT",
    properties: {
      query: {
        type: "STRING",
        description: "Search query for finding books (e.g., 'project management', 'javascript beginner')."
      }
    },
    required: ["query"]
  }
};

/**
 * Google Books API を検索する
 * @param {string} query - 検索クエリ
 * @returns {Promise<any[]>} 書籍リスト
 */
async function searchBooks(query) {
  console.error(`[Tool Call] Searching Google Books for: "${query}"`);
  try {
    const apiRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=ja`);
    const data = await apiRes.json();

    const books = data.items ? data.items.map(item => ({
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      description: item.volumeInfo.description ? item.volumeInfo.description.substring(0, 200) + "..." : "No description",
      infoLink: item.volumeInfo.infoLink
    })) : [];

    console.error(`[Tool Result] Found ${books.length} books.`);
    return { books: books };
  } catch (e) {
    console.error("[Error] Google Books Search Failed:", e);
    return { error: "Search failed" };
  }
}

module.exports = {
  declaration,
  searchBooks
};
