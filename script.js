window.onload = () => {
  const episodes = getAllEpisodes();

  const root = document.getElementById("root");
  root.innerHTML = "";

  const episodesContainer = document.createElement("div");
  episodesContainer.id = "episodesContainer";
  episodesContainer.className = "episode-container";
  root.appendChild(episodesContainer);

  const searchInput = document.getElementById("searchInput");
  const episodeSelect = document.getElementById("episodeSelect");
  const matchCount = document.getElementById("matchCount");

  function renderEpisodes(episodeList) {
    episodesContainer.innerHTML = "";
    episodeList.forEach(ep => {
      const card = createEpisodeCard(ep);
      episodesContainer.appendChild(card);
    });
  }

  function populateEpisodeSelect(episodeList) {
    episodeSelect.innerHTML = '<option value="all">All episodes</option>';
    episodeList.forEach(ep => {
      const option = document.createElement("option");
      option.value = ep.id;
      option.textContent = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")} - ${ep.name}`;
      episodeSelect.appendChild(option);
    });
  }

  function filterEpisodes(searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    return episodes.filter(ep =>
      ep.name.toLowerCase().includes(lowerTerm) ||
      (ep.summary && ep.summary.toLowerCase().includes(lowerTerm))
    );
  }

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    const filtered = term === "" ? episodes : filterEpisodes(term);
    renderEpisodes(filtered);
    matchCount.textContent = `Displaying ${filtered.length} / ${episodes.length} episodes`;
    episodeSelect.value = "all";
  });

  episodeSelect.addEventListener("change", () => {
    const selectedId = episodeSelect.value;
    if (selectedId === "all") {
      renderEpisodes(episodes);
      matchCount.textContent = `Displaying ${episodes.length} / ${episodes.length} episodes`;
      searchInput.value = "";
    } else {
      const selectedEpisode = episodes.find(ep => ep.id == selectedId);
      if (selectedEpisode) {
        renderEpisodes([selectedEpisode]);
        matchCount.textContent = `Displaying 1 / ${episodes.length} episodes`;
        searchInput.value = "";
      }
    }
  });

function createEpisodeCard(episode) {
  const template = document.getElementById("episode-card-template");
  const card = template.content.cloneNode(true);

  const titleElement = card.querySelector(".episode-title");

  // Combine title and episode code in one line
  const code = `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
  titleElement.textContent = `${episode.name} - ${code}`;

  // Image
  const img = card.querySelector("img");
  img.src = episode.image?.medium || "";
  img.alt = episode.name;

  // Summary
  card.querySelector(".episode-summary").innerHTML = episode.summary || "No summary available.";

  // Link
  card.querySelector(".episode-link").href = episode.url;

  return card;
  }



  populateEpisodeSelect(episodes);
  renderEpisodes(episodes);
  matchCount.textContent = `Displaying ${episodes.length} / ${episodes.length} episodes`;
};
