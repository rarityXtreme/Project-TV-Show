function setup() {
  const episodes = getAllEpisodes();
  renderAllEpisodes(episodes);
}

function renderAllEpisodes(episodes) {
  const root = document.getElementById("root");

  const heading = document.createElement("h1");
  heading.textContent = "TV Show Episodes";
  root.appendChild(heading);

  const attribution = document.createElement("p");
  attribution.innerHTML =
    `Data originally from <a href="https://www.tvmaze.com/api#licensing" target="_blank">TVMaze.com</a>`;
  root.appendChild(attribution);

  const container = document.createElement("div");
  container.className = "episode-container";
  root.appendChild(container);

  const episodeCards = episodes.map(createEpisodeCard);
  container.append(...episodeCards); // spread operator to append all cards
}

function createEpisodeCard(episode) {
  const template = document.getElementById("episode-card-template");
  const card = template.content.cloneNode(true);

  const img = card.querySelector("img");
  img.src = episode.image.medium;
  img.alt = episode.name;

  card.querySelector(".episode-title").textContent = episode.name;

  const code = `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`;
  card.querySelector(".episode-code").textContent = code;

  card.querySelector(".episode-summary").innerHTML = episode.summary;

  const link = card.querySelector(".episode-link");
  link.href = episode.url;

  return card;
}

window.onload = setup;

