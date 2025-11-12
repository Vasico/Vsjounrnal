// src/data.js
export const posts = [];

export async function loadPosts() {
  const blogFiles = [
    "into-the-ridge.txt",
    "steel-and-rain.txt",
    "neon-skies.txt",
  ];

  const loaded = await Promise.all(
    blogFiles.map(async (file, i) => {
      const res = await fetch(`/blogs/${file}`);
      const text = await res.text();
      const lines = text.split("\n");
      const [title, date, image, tagLine, ...rest] = lines;
      const body = rest.join("\n").trim();
      const tags = tagLine ? tagLine.split(",").map(t => t.trim()).filter(Boolean) : [];
      return { id: i + 1, title, date, image, tags, body };
    })
  );

  loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
  posts.push(...loaded);
}
