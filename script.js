// Level 300 - TV Show Episodes with API fetch

let allEpisodes = [];

async function setup() {
  showLoading();
  try {
    const episodes = await fetchEpisodes();
    allEpisodes = episodes;
    populateEpisodeSelect(allEpisodes);
    renderEpisodes(allEpisodes);
    setupSearchListener();
    setupDropdownListener();
    updateCount(allEpisodes.length, allEpisodes.length);
  } catch (error) {
    showError("Failed to load episodes. Please try again later.");
  }
}

async function fetchEpisodes() {
  const url = "https://api.tvmaze.com/shows/82/episodes";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function showLoading() {
  const container = document.getElementById("root");
  container.innerHTML = `<p role="status" aria-live="polite" style="font-weight: bold;">Loading episodes...</p>`;
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
  const code = `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
  titleElement.textContent = `${episode.name} - ${code}`;

  const img = card.querySelector("img");
  img.src = episode.image?.medium || "";
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
    const code = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`;
    option.value = ep.id;
    option.textContent = `${code} - ${ep.name}`;
    select.appendChild(option);
  });
}

function setupSearchListener() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    const filtered = term === ""
      ? allEpisodes
      : allEpisodes.filter(ep =>
          ep.name.toLowerCase().includes(term) ||
          ep.summary.toLowerCase().includes(term) ||
          `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`.toLowerCase().includes(term)
        );
    renderEpisodes(filtered);
    updateCount(filtered.length, allEpisodes.length);
    document.getElementById("episodeSelect").value = "all";
  });
}

function setupDropdownListener() {
  const select = document.getElementById("episodeSelect");
  select.addEventListener("change", () => {
    const selectedId = select.value;
    if (selectedId === "all") {
      renderEpisodes(allEpisodes);
      updateCount(allEpisodes.length, allEpisodes.length);
    } else {
      const selected = allEpisodes.find(ep => ep.id == selectedId);
      if (selected) {
        renderEpisodes([selected]);
        updateCount(1, allEpisodes.length);
      }
    }
    document.getElementById("searchInput").value = "";
  });
}

function updateCount(displayed, total) {
  document.getElementById("matchCount").textContent = `Displaying ${displayed} / ${total} episodes`;
}

function showError(message) {
  const container = document.getElementById("root");
  container.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
}

window.onload = setup;
