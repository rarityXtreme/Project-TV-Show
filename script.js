let allEpisodes = [];
let showsCache = [];
let episodesCache = {};
const FALLBACK_IMAGE = "https://via.placeholder.com/250x140?text=No+Image";

window.onload = setup;

async function setup() {
  showLoading();
  try {
    await fetchShows();
    setupEventListeners();
    const firstShowId = document.getElementById("showSelect").value;
    await loadEpisodesForShow(firstShowId);
  } catch (error) {
    showError("Failed to load shows. Please try again later.");
  }
}

async function fetchShows() {
  const cached = localStorage.getItem("shows");
  if (cached) {
    showsCache = JSON.parse(cached);
  } else {
    const url = "https://api.tvmaze.com/shows";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const shows = await response.json();
    showsCache = shows.sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem("shows", JSON.stringify(showsCache));
  }

  const showSelect = document.getElementById("showSelect");
  showsCache.forEach(show => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelect.appendChild(option);
  });
}

async function loadEpisodesForShow(showId) {
  showLoading();
  if (episodesCache[showId]) {
    allEpisodes = episodesCache[showId];
  } else {
    const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const episodes = await response.json();
    episodesCache[showId] = episodes;
    allEpisodes = episodes;
  }
  populateEpisodeSelect(allEpisodes);
  renderEpisodes(allEpisodes);
  updateCount(allEpisodes.length, allEpisodes.length);
}

function setupEventListeners() {
  document.getElementById("showSelect").addEventListener("change", async e => {
    resetFilters();
    await loadEpisodesForShow(e.target.value);
  });

  document.getElementById("searchInput").addEventListener("input", e => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = term
      ? allEpisodes.filter(ep =>
          ep.name.toLowerCase().includes(term) ||
          ep.summary?.toLowerCase().includes(term) ||
          formatEpisodeCode(ep.season, ep.number).toLowerCase().includes(term)
        )
      : allEpisodes;
    renderEpisodes(filtered);
    updateCount(filtered.length, allEpisodes.length);
    document.getElementById("episodeSelect").value = "all";
  });

  document.getElementById("episodeSelect").addEventListener("change", e => {
    const selectedId = e.target.value;
    if (selectedId === "all") {
      renderEpisodes(allEpisodes);
      updateCount(allEpisodes.length, allEpisodes.length);
    } else {
      const selected = allEpisodes.find(ep => ep.id == selectedId);
      renderEpisodes(selected ? [selected] : []);
      updateCount(selected ? 1 : 0, allEpisodes.length);
    }
    document.getElementById("searchInput").value = "";
  });
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("episodeSelect").value = "all";
}

function renderEpisodes(episodeList) {
  const container = document.getElementById("root");
  container.innerHTML = "";
  episodeList.forEach(episode => {
    const card = createEpisodeCard(episode);
    container.appendChild(card);
  });
}

function createEpisodeCard(episode) {
  const template = document.getElementById("episode-card-template");
  const card = template.content.cloneNode(true);

  const titleElement = card.querySelector(".episode-title");
  titleElement.textContent = `${episode.name} - ${formatEpisodeCode(episode.season, episode.number)}`;

  const img = card.querySelector("img");
  img.src = episode.image?.medium || FALLBACK_IMAGE;
  img.alt = episode.name;

  card.querySelector(".episode-summary").innerHTML = episode.summary || "No summary available.";
  card.querySelector(".episode-link").href = episode.url;

  return card;
}

function populateEpisodeSelect(episodes) {
  const select = document.getElementById("episodeSelect");
  select.innerHTML = '<option value="all">All episodes</option>';
  episodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep.id;
    option.textContent = `${formatEpisodeCode(ep.season, ep.number)} - ${ep.name}`;
    select.appendChild(option);
  });
}

function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function updateCount(displayed, total) {
  document.getElementById("matchCount").textContent = `Displaying ${displayed} / ${total} episodes`;
}

function showLoading() {
  const container = document.getElementById("root");
  container.innerHTML = `<p role="status" aria-live="polite" style="font-weight: bold;">Loading...</p>`;
}

function showError(message) {
  const container = document.getElementById("root");
  container.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
}