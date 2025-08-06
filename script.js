window.onload = () => {
  const episodes = getAllEpisodes(); // Your data source function

  // Root element to hold heading, attribution, and episodes container
  const root = document.getElementById("root");
  root.innerHTML = "";

  // Heading
  const heading = document.createElement("h1");
  heading.textContent = "TV Show Episodes";
  root.appendChild(heading);

  // Attribution with link to TVMaze
  const attribution = document.createElement("p");
  attribution.innerHTML = `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank" rel="noopener noreferrer">TVMaze.com</a>`;
  root.appendChild(attribution);

  // Container where episodes will be rendered
  const episodesContainer = document.createElement("div");
  episodesContainer.id = "episodesContainer";
  episodesContainer.className = "episode-container";
  root.appendChild(episodesContainer);

  // Reference UI elements for search, select and match count
  const searchInput = document.getElementById("searchInput");
  const episodeSelect = document.getElementById("episodeSelect");
  const matchCount = document.getElementById("matchCount");

  // Render episodes inside the container
  function renderEpisodes(episodeList) {
    episodesContainer.innerHTML = "";
    episodeList.forEach(ep => {
      const card = createEpisodeCard(ep);
      episodesContainer.appendChild(card);
    });
  }

  // Create options for the episode selector dropdown
  function populateEpisodeSelect(episodeList) {
    // Clear all but the default 'all' option
    episodeSelect.innerHTML = '<option value="all">All episodes</option>';
    episodeList.forEach(ep => {
      const option = document.createElement("option");
      option.value = ep.id;
      option.textContent = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")} - ${ep.name}`;
      episodeSelect.appendChild(option);
    });
  }

  // Filter episodes by search term (case-insensitive on name or summary)
  function filterEpisodes(searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    return episodes.filter(ep =>
      ep.name.toLowerCase().includes(lowerTerm) ||
      (ep.summary && ep.summary.toLowerCase().includes(lowerTerm))
    );
  }

  // Handle live search input changes
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    let filtered = [];

    if (term === "") {
      filtered = episodes;
    } else {
      filtered = filterEpisodes(term);
    }

    renderEpisodes(filtered);
    matchCount.textContent = `Episodes found: ${filtered.length}`;
    episodeSelect.value = "all"; // Reset dropdown to 'all' on search
  });

  // Handle episode selector dropdown changes
  episodeSelect.addEventListener("change", () => {
    const selectedId = episodeSelect.value;

    if (selectedId === "all") {
      renderEpisodes(episodes);
      matchCount.textContent = `Episodes found: ${episodes.length}`;
      searchInput.value = ""; // Clear search input when showing all
    } else {
      const selectedEpisode = episodes.find(ep => ep.id == selectedId);
      if (selectedEpisode) {
        renderEpisodes([selectedEpisode]);
        matchCount.textContent = `Showing episode: ${selectedEpisode.name}`;
        searchInput.value = ""; // Clear search input when filtering by dropdown
      }
    }
  });

  // Create an episode card element from template and episode data
  function createEpisodeCard(episode) {
    const template = document.getElementById("episode-card-template");
    const card = template.content.cloneNode(true);

    const img = card.querySelector("img");
    img.src = episode.image?.medium || ""; // optional chaining in case image is missing
    img.alt = episode.name;

    card.querySelector(".episode-title").textContent = episode.name;

    const code = `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
    card.querySelector(".episode-code").textContent = code;

    card.querySelector(".episode-summary").innerHTML = episode.summary || "No summary available.";

    const link = card.querySelector(".episode-link");
    link.href = episode.url;

    return card;
  }

  // Initial population of dropdown and episode list
  populateEpisodeSelect(episodes);
  renderEpisodes(episodes);
  matchCount.textContent = `Episodes found: ${episodes.length}`;
};
