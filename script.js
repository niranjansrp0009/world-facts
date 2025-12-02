// Simple in-browser 'AI-style' article generator.
// No back-end, no API keys, no maintenance.
// Everything runs client-side and generates human-like text
// using templates + randomisation.

// ------- Data setup -------

const TOPICS = [
  {
    id: "tech",
    name: "Tech & Gadgets",
    emoji: "💻",
    description: "Trends in phones, laptops, apps, and the future of everyday tech.",
    toneWords: ["sleek", "intuitive", "groundbreaking", "frictionless", "immersive"],
    focusWords: ["smartphones", "laptops", "AI tools", "productivity apps", "wearables"]
  },
  {
    id: "health",
    name: "Health & Fitness",
    emoji: "💪",
    description: "Simple routines, movement, and realistic health habits.",
    toneWords: ["sustainable", "energising", "gentle", "grounded", "science-backed"],
    focusWords: ["workouts", "morning walks", "meal planning", "hydration", "sleep"]
  },
  {
    id: "money",
    name: "Money & Personal Finance",
    emoji: "💰",
    description: "Budgeting, saving, side hustles and smarter money decisions.",
    toneWords: ["practical", "calm", "intentional", "long-term", "low-stress"],
    focusWords: ["budgeting", "emergency funds", "debt payoff", "side income", "investing"]
  },
  {
    id: "travel",
    name: "Travel & Adventure",
    emoji: "✈️",
    description: "Slow travel ideas, hidden corners, and mindful exploring.",
    toneWords: ["curious", "unhurried", "playful", "serendipitous", "colourful"],
    focusWords: ["hidden cafes", "local food", "street walks", "sunset spots", "weekend trips"]
  },
  {
    id: "self",
    name: "Self-Improvement",
    emoji: "🌱",
    description: "Tiny habits, mindset shifts, and building a kinder life.",
    toneWords: ["gentle", "reflective", "honest", "actionable", "optimistic"],
    focusWords: ["habits", "self-talk", "boundaries", "learning", "courage"]
  },
  {
    id: "productivity",
    name: "Study & Productivity",
    emoji: "📚",
    description: "Deep focus, smart notes, and actually finishing things.",
    toneWords: ["clear", "structured", "realistic", "focused", "simple"],
    focusWords: ["time blocking", "notes", "deadlines", "energy", "distraction"]
  },
  {
    id: "lifestyle",
    name: "Lifestyle & Relationships",
    emoji: "🏡",
    description: "Everyday life, friendships, dating, and tiny routines.",
    toneWords: ["warm", "relatable", "messy", "human", "comforting"],
    focusWords: ["conversations", "house routines", "friendships", "family", "dating"]
  },
  {
    id: "business",
    name: "Marketing & Business",
    emoji: "📈",
    description: "Online business, content and small-brand storytelling.",
    toneWords: ["strategic", "playful", "data-aware", "authentic", "scrappy"],
    focusWords: ["audience", "content", "offers", "funnels", "email list"]
  },
  {
    id: "mindfulness",
    name: "Mindfulness & Mental Health",
    emoji: "🧘‍♀️",
    description: "Slowing down, noticing your mind, and finding breathing room.",
    toneWords: ["soft", "non-judgmental", "steady", "soothing", "compassionate"],
    focusWords: ["breath", "overthinking", "anxiety", "journaling", "tiny pauses"]
  },
  {
    id: "facts",
    name: "Random Facts & Curiosities",
    emoji: "✨",
    description: "Snack-sized ideas, history twists, and unexpected connections.",
    toneWords: ["nerdy", "fun", "curious", "surprising", "light"],
    focusWords: ["history quirks", "science facts", "language", "everyday objects", "space"]
  }
];

const OPENERS = [
  "Let’s be honest, most of us know what we “should” be doing here, but the hard part is actually showing up.",
  "If you’ve felt a strange mix of inspiration and overwhelm lately, you’re not alone.",
  "Some ideas land like a quiet reminder rather than a dramatic life change—and those are often the ones that stick.",
  "There’s a gentler way to approach this, one that doesn’t demand perfection from day one.",
  "Think of this less as a strict rulebook and more as a set of tiny experiments you can run in real life."
];

const TRANSITIONS = [
  "Here’s a simple way to think about it:",
  "In practice, that can look surprisingly small and doable:",
  "Instead of trying to fix everything at once, try this:",
  "You don’t need a thirty‑step plan—just a few anchors:",
  "A few ideas that tend to hold up in the real world:"
];

const BULLET_LEADS = [
  "Start by",
  "Experiment with",
  "Pay attention to",
  "Gently question",
  "Protect"
];

const CLOSERS = [
  "You don’t have to get this perfect. You just have to keep coming back to it in a way that feels human, not heroic.",
  "The goal isn’t to impress anyone. The goal is to build a life that quietly works for you, most days of the week.",
  "If you treat this as an experiment rather than an exam, you’ll give yourself room to iterate instead of giving up.",
  "Progress here rarely goes viral—but it does compound quietly in the background while you live your actual life.",
  "You’re allowed to move slowly. You’re also allowed to start again as many times as you need."
];

const TITLE_TEMPLATES = [
  "A Gentle Guide to {focus}",
  "How to Rethink {focus} Without Burning Out",
  "You’re Probably Overcomplicating {focus}",
  "Tiny Ways to Make {focus} Feel Lighter",
  "What No One Tells You About Everyday {focus}"
];

// In-memory article history per topic: { [topicId]: { currentIndex, list: Article[] } }
const articleStore = {};
let currentTopicId = null;
let currentArticle = null;

// favorites in localStorage: array of { id, topicId, title, preview, savedAt }
const FAVORITES_KEY = "ai-article-hub-favorites";

// ------- Utility helpers -------

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(d) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString(undefined, options);
}

function estimateReadingTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 190));
  return `${minutes} min read`;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load favorites", e);
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {
    console.warn("Failed to save favorites", e);
  }
}

function isArticleFavorited(article) {
  const favs = loadFavorites();
  return favs.some(f => f.id === article.id);
}

// ------- Article generation -------

function generateArticle(topic) {
  const now = new Date();
  const focus = randomFrom(topic.focusWords);
  const tone = randomFrom(topic.toneWords);

  const titleTemplate = randomFrom(TITLE_TEMPLATES);
  const title = titleTemplate.replace("{focus}", focus);

  const opener = randomFrom(OPENERS);
  const transition = randomFrom(TRANSITIONS);

  // Create 2-3 middle paragraphs plus a bullet list
  const middleCount = randomInt(2, 3);
  const middleParas = [];

  for (let i = 0; i < middleCount; i++) {
    const sentence1 = `In the context of ${topic.name.toLowerCase()}, ${focus} usually shows up in much smaller ways than we imagine.`;
    const sentence2 = `Instead of chasing a dramatic reset, most people do better when they make ${tone} adjustments they can repeat on an ordinary Tuesday.`;
    const sentence3 = `The real magic is rarely a secret tool—it’s the boring consistency that slowly rewires what “normal” looks like for you.`;
    const variants = [
      `${sentence1} ${sentence2}`,
      `${sentence2} ${sentence3}`,
      `${sentence1} ${sentence3}`,
      `${sentence1} ${sentence2} ${sentence3}`
    ];
    middleParas.push(randomFrom(variants));
  }

  // Bullet-style paragraph
  const bulletLines = [];
  const bulletCount = randomInt(3, 4);
  for (let i = 0; i < bulletCount; i++) {
    const lead = randomFrom(BULLET_LEADS);
    const detail = randomFrom(topic.focusWords);
    bulletLines.push(`• ${lead} how ${detail} actually fits into the week you’re living right now.`);
  }
  const bulletPara = `${transition}\n${bulletLines.join("\n")}`;

  const closer = randomFrom(CLOSERS);

  const paragraphs = [
    opener,
    ...middleParas,
    bulletPara,
    closer
  ];

  const fullText = paragraphs.join(" ");
  const readingTime = estimateReadingTime(fullText);

  const article = {
    id: `${topic.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    topicId: topic.id,
    topicName: topic.name,
    title,
    date: formatDate(now),
    readingTime,
    paragraphs
  };

  return article;
}

// ------- Rendering -------

function renderTopics() {
  const grid = document.getElementById("topicGrid");
  grid.innerHTML = "";
  TOPICS.forEach(topic => {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.dataset.topicId = topic.id;

    const pill = document.createElement("div");
    pill.className = "topic-pill";
    pill.innerHTML = `<span>${topic.emoji}</span><span>${topic.id.toUpperCase()}</span>`;

    const title = document.createElement("h3");
    title.className = "topic-card-title";
    title.textContent = topic.name;

    const desc = document.createElement("p");
    desc.className = "topic-card-desc";
    desc.textContent = topic.description;

    const meta = document.createElement("div");
    meta.className = "topic-card-meta";
    meta.innerHTML = `
      <span>∞ fresh articles</span>
      <span class="topic-badge-count">Tap to begin</span>
    `;

    const glow = document.createElement("div");
    glow.className = "topic-glow";

    card.appendChild(pill);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(glow);

    card.addEventListener("click", () => {
      openTopic(topic.id);
    });

    grid.appendChild(card);
  });
}

function showView(viewId) {
  const views = document.querySelectorAll(".view");
  views.forEach(v => v.classList.remove("view-active"));
  document.getElementById(viewId).classList.add("view-active");
}

function openTopic(topicId) {
  currentTopicId = topicId;
  const topic = TOPICS.find(t => t.id === topicId);
  if (!articleStore[topicId]) {
    articleStore[topicId] = { currentIndex: -1, list: [] };
  }
  const store = articleStore[topicId];

  if (store.currentIndex === -1) {
    const art = generateArticle(topic);
    store.list.push(art);
    store.currentIndex = 0;
  }

  currentArticle = store.list[store.currentIndex];
  renderCurrentArticle();
  showView("articleView");
}

function renderCurrentArticle() {
  if (!currentArticle) return;
  const topicLabel = document.getElementById("articleTopicLabel");
  const timeLabel = document.getElementById("articleTimeLabel");
  const titleEl = document.getElementById("articleTitle");
  const dateEl = document.getElementById("articleDate");
  const bodyEl = document.getElementById("articleBody");
  const prevBtn = document.getElementById("prevArticleBtn");

  topicLabel.textContent = currentArticle.topicName;
  timeLabel.textContent = currentArticle.readingTime;
  titleEl.textContent = currentArticle.title;
  dateEl.textContent = `Generated on ${currentArticle.date}`;
  bodyEl.innerHTML = "";

  currentArticle.paragraphs.forEach(p => {
    if (p.startsWith("•")) {
      // Split bullets
      const lines = p.split("\n").filter(Boolean);
      const introLine = lines.shift();
      const introP = document.createElement("p");
      introP.textContent = introLine.replace("•", "").trim();
      bodyEl.appendChild(introP);

      const ul = document.createElement("ul");
      ul.style.marginLeft = "1.2rem";
      ul.style.marginBottom = "0.5rem";
      ul.style.fontSize = "14px";
      ul.style.color = "#e5e7eb";

      lines.forEach(line => {
        const li = document.createElement("li");
        li.textContent = line.replace(/^•\s*/, "");
        ul.appendChild(li);
      });
      bodyEl.appendChild(ul);
    } else {
      const pEl = document.createElement("p");
      pEl.textContent = p;
      bodyEl.appendChild(pEl);
    }
  });

  // Prev button state
  const store = articleStore[currentTopicId];
  prevBtn.disabled = !store || store.currentIndex <= 0;

  updateFavoriteButtonState();
}

function handleNextArticle() {
  const topic = TOPICS.find(t => t.id === currentTopicId);
  if (!topic) return;

  const store = articleStore[currentTopicId];
  const nextIndex = store.currentIndex + 1;

  if (nextIndex < store.list.length) {
    store.currentIndex = nextIndex;
    currentArticle = store.list[store.currentIndex];
  } else {
    const newArticle = generateArticle(topic);
    store.list.push(newArticle);
    store.currentIndex = store.list.length - 1;
    currentArticle = newArticle;
  }

  renderCurrentArticle();
}

function handlePrevArticle() {
  const store = articleStore[currentTopicId];
  if (!store || store.currentIndex <= 0) return;
  store.currentIndex -= 1;
  currentArticle = store.list[store.currentIndex];
  renderCurrentArticle();
}

// ------- Favorites -------

function updateFavoriteButtonState() {
  const heart = document.getElementById("favoriteIcon");
  const text = document.getElementById("favoriteText");
  if (!currentArticle) return;

  if (isArticleFavorited(currentArticle)) {
    heart.classList.add("favorited");
    text.textContent = "Favorited";
  } else {
    heart.classList.remove("favorited");
    text.textContent = "Add to Favorites";
  }
}

function toggleFavorite() {
  if (!currentArticle) return;
  const favs = loadFavorites();
  const idx = favs.findIndex(f => f.id === currentArticle.id);

  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    const previewText = currentArticle.paragraphs[0].slice(0, 120) + "…";
    favs.unshift({
      id: currentArticle.id,
      topicId: currentArticle.topicId,
      title: currentArticle.title,
      topicName: currentArticle.topicName,
      preview: previewText,
      savedAt: new Date().toISOString()
    });
  }
  saveFavorites(favs);
  updateFavoriteButtonState();
  renderFavoritesList();
}

function renderFavoritesList() {
  const container = document.getElementById("favoritesList");
  const favs = loadFavorites();
  container.innerHTML = "";

  if (!favs.length) {
    const empty = document.createElement("p");
    empty.textContent = "No favorites yet. Tap the heart icon on any article to save it.";
    empty.style.fontSize = "13px";
    empty.style.color = "#9ca3af";
    container.appendChild(empty);
    return;
  }

  favs.forEach(fav => {
    const card = document.createElement("div");
    card.className = "favorite-card";
    card.dataset.articleId = fav.id;
    card.dataset.topicId = fav.topicId;

    const title = document.createElement("div");
    title.className = "favorite-title";
    title.textContent = fav.title;

    const meta = document.createElement("div");
    meta.className = "favorite-meta";
    const when = new Date(fav.savedAt);
    meta.innerHTML = `
      <span>${fav.topicName}</span>
      <span>Saved ${formatDate(when)}</span>
    `;

    const preview = document.createElement("div");
    preview.style.fontSize = "12px";
    preview.style.color = "#9ca3af";
    preview.style.marginTop = "3px";
    preview.textContent = fav.preview;

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(preview);

    card.addEventListener("click", () => {
      openFavoriteArticle(fav);
    });

    container.appendChild(card);
  });
}

function openFavoriteArticle(fav) {
  const topic = TOPICS.find(t => t.id === fav.topicId);
  if (!topic) return;

  if (!articleStore[fav.topicId]) {
    articleStore[fav.topicId] = { currentIndex: -1, list: [] };
  }
  const store = articleStore[fav.topicId];
  const existingIndex = store.list.findIndex(a => a.id === fav.id);

  if (existingIndex >= 0) {
    store.currentIndex = existingIndex;
    currentArticle = store.list[existingIndex];
  } else {
    // Minimal reconstruction: generate a fresh article with same title as a stand‑in.
    const generated = generateArticle(topic);
    generated.id = fav.id;
    generated.title = fav.title;
    store.list.push(generated);
    store.currentIndex = store.list.length - 1;
    currentArticle = generated;
  }

  currentTopicId = fav.topicId;
  renderCurrentArticle();
  showView("articleView");
}

// ------- Sharing -------

async function handleShare() {
  if (!currentArticle) return;
  const shareData = {
    title: currentArticle.title,
    text: `${currentArticle.title}\n\n${currentArticle.paragraphs[0]}`
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      // User cancelled or share failed silently
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}`);
      alert("Article preview copied to clipboard. You can paste it anywhere to share.");
    } catch (e) {
      alert("Sharing is not supported on this device. Please copy the text manually.");
    }
  }
}

// ------- Navigation -------

function initNavigation() {
  const homeButton = document.getElementById("homeButton");
  const favoritesButton = document.getElementById("favoritesButton");
  const backToHome = document.getElementById("backToHome");
  const backFromFavorites = document.getElementById("backFromFavorites");
  const nextBtn = document.getElementById("nextArticleBtn");
  const prevBtn = document.getElementById("prevArticleBtn");
  const favBtn = document.getElementById("favoriteBtn");
  const shareBtn = document.getElementById("shareBtn");

  homeButton.addEventListener("click", () => {
    showView("homeView");
  });

  favoritesButton.addEventListener("click", () => {
    renderFavoritesList();
    showView("favoritesView");
  });

  backToHome.addEventListener("click", () => {
    showView("homeView");
  });

  backFromFavorites.addEventListener("click", () => {
    showView("homeView");
  });

  nextBtn.addEventListener("click", handleNextArticle);
  prevBtn.addEventListener("click", handlePrevArticle);
  favBtn.addEventListener("click", toggleFavorite);
  shareBtn.addEventListener("click", handleShare);
}

// ------- Init -------

document.addEventListener("DOMContentLoaded", () => {
  renderTopics();
  initNavigation();
  renderFavoritesList();
});
