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
    setupShowSearchListener();     
    renderShowsList(showsCache);   
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
    showsCache = shows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    localStorage.setItem("shows", JSON.stringify(showsCache));
  }

  
  const showSelect = document.getElementById("showSelect");
  if (showSelect) {
    showSelect.innerHTML = "";
    showsCache.forEach(show => {
      const option = document.createElement("option");
      option.value = show.id;
      option.textContent = show.name;
      showSelect.appendChild(option);
    });
  }
}

async function loadEpisodesForShow(showId) {
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
  
  const showSelect = document.getElementById("showSelect");
  if (showSelect) {
    showSelect.addEventListener("change", async e => {
      resetFilters();
      await loadEpisodesForShow(e.target.value);
      showEpisodesView(e.target.value);
    });
  }

 
  document.getElementById("searchInput").addEventListener("input", e => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = term
      ? allEpisodes.filter(ep =>
          ep.name.toLowerCase().includes(term) ||
          (ep.summary || "").toLowerCase().includes(term) ||
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

  
  document.getElementById("backToShows")?.addEventListener("click", showShowsView);
}

function setupShowSearchListener() {
  const input = document.getElementById("showSearchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    
    const episodesVisible = getComputedStyle(document.getElementById("root")).display !== "none";
    if (episodesVisible) showShowsView();

    const term = input.value.trim().toLowerCase();
    if (!term) {
      renderShowsList(showsCache);
      return;
    }

    const filtered = showsCache.filter(show => {
      const name = (show.name || "").toLowerCase();
      const genres = (show.genres || []).join(" ").toLowerCase();
      const summaryText = (show.summary || "").replace(/<[^>]*>/g, "").toLowerCase();
      return name.includes(term) || genres.includes(term) || summaryText.includes(term);
    });

    renderShowsList(filtered);
  });
}


function renderShowsList(shows) {
  const showsEl = document.getElementById("showsContainer");
  const episodesEl = document.getElementById("root");
  const backBtn = document.getElementById("backToShows");

  
  showsEl.style.display = "grid";
  episodesEl.style.display = "none";
  if (backBtn) backBtn.style.display = "none";

  showsEl.innerHTML = "";

  shows.forEach(show => {
    const cleanSummary = (show.summary || "No summary available.").replace(/<[^>]*>/g, "");
    const genres = (show.genres || []).join(", ");
    const status = show.status || "N/A";
    const rating = show.rating?.average ?? "N/A";
    const runtime = show.runtime ?? "N/A";
    const imgSrc = show.image?.medium || FALLBACK_IMAGE;

    const card = document.createElement("section");
    card.className = "episode-card";
    card.setAttribute("role", "button");   
    card.tabIndex = 0;                     
    card.innerHTML = `
      <div class="episode-title-bar">
        <div class="episode-title">${show.name}</div>
      </div>
      <img src="${imgSrc}" alt="${show.name}">
      <div class="episode-summary">${cleanSummary}</div>
      <p><strong>Genres:</strong> ${genres}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Rating:</strong> ${rating}</p>
      <p><strong>Runtime:</strong> ${runtime} min</p>
    `;

    
    card.addEventListener("click", () => showEpisodesView(show.id));

   
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showEpisodesView(show.id);
      }
    });

    showsEl.appendChild(card);
  });

  
  showsEl.focus();
}

async function showEpisodesView(showId) {
  const showsEl = document.getElementById("showsContainer");
  const episodesEl = document.getElementById("root");
  const backBtn = document.getElementById("backToShows");

  showsEl.style.display = "none";
  episodesEl.style.display = "grid";
  if (backBtn) backBtn.style.display = "inline-block";

  resetFilters();
  episodesEl.innerHTML = `<p role="status" aria-live="polite" style="font-weight:bold;">Loading episodes…</p>`;

  try {
    await loadEpisodesForShow(showId);
  } catch {
    showError("Failed to load episodes. Please try again.");
  }

  
  episodesEl.focus();
}

function showShowsView() {
  const showsEl = document.getElementById("showsContainer");
  const episodesEl = document.getElementById("root");
  const backBtn = document.getElementById("backToShows");

 
  episodesEl.style.display = "none";
  if (backBtn) backBtn.style.display = "none";
  showsEl.style.display = "grid";


  document.getElementById("searchInput").value = "";
  document.getElementById("episodeSelect").value = "all";


  showsEl.focus();
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



function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("episodeSelect").value = "all";
}

function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function updateCount(displayed, total) {
  const el = document.getElementById("matchCount");
  if (el) el.textContent = `Displaying ${displayed} / ${total} episodes`;
}

function showLoading() {
  const shows = document.getElementById("showsContainer");
  const episodes = document.getElementById("root");

  
  if (episodes) episodes.style.display = "none";
  if (shows) {
    shows.style.display = "grid";
    shows.innerHTML = `<p role="status" aria-live="polite" style="font-weight:bold;">Loading shows…</p>`;
  }
}

function showError(message) {
  const shows = document.getElementById("showsContainer");
  const episodes = document.getElementById("root");

  
  if (getComputedStyle(shows).display !== "none") {
    shows.innerHTML = `<p role="alert" style="color:#b91c1c; font-weight:bold;">${message}</p>`;
    return;
  }
  episodes.style.display = "";
  episodes.innerHTML = `<p role="alert" style="color:#b91c1c; font-weight:bold;">${message}</p>`;
}

