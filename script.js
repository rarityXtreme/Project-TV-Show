let initialized = false;
let episodesViewActive = false;

let allEpisodes = [];
let showsCache = [];
const episodesCache = {};

const FALLBACK_IMAGE = "https://via.placeholder.com/250x140?text=No+Image";

window.onload = async function () {
  if (initialized) return;
  initialized = true;

  showLoading();
  try {
    await fetchShows();
    setupEventListeners();
    setupShowSearchListener();
    renderShowsList(showsCache);
  } catch (e) {
    console.error("Startup error:", e);
    showError("Failed to load shows. Please try again later.");
  }
};

async function fetchShows() {
  const cached = localStorage.getItem("shows");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) {
        showsCache = parsed;
        populateShowSelect(showsCache);
        return;
      } else {
        localStorage.removeItem("shows");
      }
    } catch (err) {
      console.warn("Invalid shows cache, refetching:", err);
      localStorage.removeItem("shows");
    }
  }

  const res = await fetch("https://api.tvmaze.com/shows", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);

  const shows = await res.json();
  showsCache = shows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  try {
    localStorage.setItem("shows", JSON.stringify(showsCache));
  } catch (e) {
    console.warn("Could not cache shows:", e);
  }

  populateShowSelect(showsCache);
}


async function loadEpisodesForShow(showId) {
  if (episodesCache[showId]) {
    allEpisodes = episodesCache[showId];
    afterEpisodesLoaded();
    return;
  }
  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const episodes = await res.json();
  episodesCache[showId] = episodes;
  allEpisodes = episodes;
  afterEpisodesLoaded();
}

function afterEpisodesLoaded() {
  populateEpisodeSelect(allEpisodes);
  const container = document.getElementById("root");
  if (!allEpisodes.length) {
    container.innerHTML = '<p>No episodes found.</p>';
    updateCount(0, 0);
    return;
  }
  renderEpisodes(allEpisodes);
  updateCount(allEpisodes.length, allEpisodes.length);
}

function renderEpisodes(episodeList) {
  const container = document.getElementById("root");
  container.innerHTML = "";
  episodeList.forEach(ep => container.appendChild(createEpisodeCard(ep)));
}

function createEpisodeCard(episode) {
  const template = document.getElementById("episode-card-template");
  const card = template.content.cloneNode(true);

  card.querySelector(".episode-title").textContent =
    `${episode.name} - ${formatEpisodeCode(episode.season, episode.number)}`;

  const img = card.querySelector("img");
  img.src = episode.image?.medium || FALLBACK_IMAGE;
  img.alt = episode.name;

  card.querySelector(".episode-summary").innerHTML = episode.summary || "No summary available.";
  card.querySelector(".episode-link").href = episode.url;

  return card;
}


function renderShowsList(shows) {
  const showsEl = document.getElementById("showsContainer");
  const episodesEl = document.getElementById("root");
  const backBtn = document.getElementById("backToShows");

  showsEl.style.display = "grid";
  episodesEl.style.display = "none";
  backBtn.style.display = "none";
  episodesViewActive = false;

  updateControls("shows");
  showsEl.innerHTML = "";

  shows.forEach(show => {
    const cleanSummary = (show.summary || "No summary available.").replace(/<[^>]*>/g, "");
    const imgSrc = show.image?.medium || FALLBACK_IMAGE;
    const genres = show.genres?.join(", ") || "N/A";
    const status = show.status || "N/A";
    const rating = show.rating?.average ?? "N/A";
    const runtime = show.runtime ?? "N/A";

    const card = document.createElement("section");
    card.className = "episode-card";
    card.innerHTML = `
      <div class="episode-title-bar">
        <div class="episode-title show-name">${show.name}</div>
      </div>
      <img src="${imgSrc}" alt="${show.name}">
      <div class="episode-summary">${cleanSummary}</div>
      <ul class="meta">
        <li><span>Genres</span><span>${genres}</span></li>
        <li><span>Status</span><span>${status}</span></li>
        <li class="rating"><span>Rating</span><span>${rating}</span></li>
        <li><span>Runtime</span><span>${runtime} min</span></li>
      </ul>
    `;

    card.querySelector(".show-name").addEventListener("click", async () => {
      switchToEpisodesView();
      document.getElementById("root").innerHTML = "<p>Loading episodes…</p>";
      resetEpisodeFilters();
      try {
        await loadEpisodesForShow(show.id);
      } catch {
        showError("Failed to load episodes. Please try again.");
      }
    });

    showsEl.appendChild(card);
  });
}


function setupEventListeners() {
  document.getElementById("showSelect").addEventListener("change", async e => {
    const showId = e.target.value;
    if (!showId) return;
    switchToEpisodesView();
    document.getElementById("root").innerHTML = "<p>Loading episodes…</p>";
    resetEpisodeFilters();
    try {
      await loadEpisodesForShow(showId);
    } catch {
      showError("Failed to load episodes. Please try again.");
    }
  });

  document.getElementById("searchInput").addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    const filtered = term
      ? allEpisodes.filter(ep =>
          (ep.name || "").toLowerCase().includes(term) ||
          (ep.summary || "").toLowerCase().includes(term) ||
          formatEpisodeCode(ep.season, ep.number).toLowerCase().includes(term)
        )
      : allEpisodes;

    renderEpisodes(filtered);
    updateCount(filtered.length, allEpisodes.length);
    document.getElementById("episodeSelect").value = "all";
  });

  document.getElementById("episodeSelect").addEventListener("change", e => {
    const id = e.target.value;
    if (id === "all") {
      renderEpisodes(allEpisodes);
      updateCount(allEpisodes.length, allEpisodes.length);
    } else {
      const selected = allEpisodes.find(ep => String(ep.id) === id);
      renderEpisodes(selected ? [selected] : []);
      updateCount(selected ? 1 : 0, allEpisodes.length);
    }
    document.getElementById("searchInput").value = "";
  });

  document.getElementById("backToShows").addEventListener("click", switchToShowsView);
}

function setupShowSearchListener() {
  const input = document.getElementById("showSearchInput");
  input.addEventListener("input", () => {
    if (episodesViewActive) switchToShowsView();
    const term = input.value.toLowerCase();
    if (!term) return renderShowsList(showsCache);
    const filtered = showsCache.filter(show =>
      show.name.toLowerCase().includes(term) ||
      (show.genres?.join(" ").toLowerCase() || "").includes(term) ||
      (show.summary || "").replace(/<[^>]*>/g, "").toLowerCase().includes(term)
    );
    renderShowsList(filtered);
  });
}

function updateControls(view) {
  const showSearch = document.getElementById("showSearchInput");
  const episodeSearch = document.getElementById("searchInput");
  const episodeSelect = document.getElementById("episodeSelect");
  const match = document.getElementById("matchCount");

  if (view === "shows") {
    showSearch.style.display = "";
    episodeSearch.style.display = "none";
    episodeSelect.style.display = "none";
    match.style.display = "none";
    document.getElementById("showSelect").value = "";
  } else {
    showSearch.style.display = "none";
    episodeSearch.style.display = "";
    episodeSelect.style.display = "";
    match.style.display = "";
  }
}


function populateEpisodeSelect(episodes) {
  const select = document.getElementById("episodeSelect");
  select.innerHTML = '<option value="all">All episodes</option>';
  episodes.forEach(ep => {
    const opt = document.createElement("option");
    opt.value = ep.id;
    opt.textContent = `${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}`;
    select.appendChild(opt);
  });
}

function populateShowSelect(shows) {
  const select = document.getElementById("showSelect");
  select.innerHTML = '<option value="" disabled selected>Select a show...</option>';
  shows.forEach(show => {
    const opt = document.createElement("option");
    opt.value = show.id;
    opt.textContent = show.name;
    select.appendChild(opt);
  });
}

function resetEpisodeFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("episodeSelect").value = "all";
}

function formatEpisodeCode(s, n) {
  return `S${String(s).padStart(2, "0")}E${String(n).padStart(2, "0")}`;
}

function updateCount(displayed, total) {
  document.getElementById("matchCount").textContent = `Displaying ${displayed} / ${total} episodes`;
}


function switchToEpisodesView() {
  document.getElementById("showsContainer").style.display = "none";
  document.getElementById("root").style.display = "grid";
  document.getElementById("backToShows").style.display = "inline-block";
  episodesViewActive = true;
  updateControls("episodes");
}

function switchToShowsView() {
  document.getElementById("showsContainer").style.display = "grid";
  document.getElementById("root").style.display = "none";
  document.getElementById("backToShows").style.display = "none";
  episodesViewActive = false;
  updateControls("shows");
}

function showLoading() {
  document.getElementById("showsContainer").innerHTML = "<p>Loading shows…</p>";
}

function showError(msg) {
  const shows = document.getElementById("showsContainer");
  const episodes = document.getElementById("root");
  if (!episodesViewActive) {
    shows.innerHTML = `<p style="color:red">${msg}</p>`;
  } else {
    episodes.innerHTML = `<p style="color:red">${msg}</p>`;
  }
}





