// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesBtn = document.getElementById('getImagesBtn');
const gallery = document.getElementById('gallery');
const spaceFactEl = document.getElementById('spaceFact');

// Modal elements
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// -----------------------------------------------------------------
// NASA API setup
// -----------------------------------------------------------------
// You can request your own key at https://api.nasa.gov and swap it in below.
// DEMO_KEY works for testing but has low rate limits.
const NASA_API_KEY = 'DEMO_KEY';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// -----------------------------------------------------------------
// Random "Did You Know?" space facts
// -----------------------------------------------------------------
const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'Neutron stars can spin at a rate of 600 rotations per second.',
  'There are more stars in the universe than grains of sand on every beach on Earth.',
  'The footprints on the Moon will likely stay there for millions of years since there is no wind to blow them away.',
  'One million Earths could fit inside the Sun.',
  'Space is completely silent because there is no atmosphere to carry sound waves.',
  'The Sun accounts for about 99.86% of the mass in our solar system.',
  'A full NASA space suit costs about $12 million, most of which is the backpack and control module.',
  'Jupiter has 95 known moons.',
  'The largest known star, UY Scuti, is roughly 1,700 times the size of the Sun.',
  'It takes about 8 minutes and 20 seconds for sunlight to reach Earth.',
  'The International Space Station travels at about 17,500 miles per hour.'
];

function showRandomSpaceFact() {
  const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
  spaceFactEl.innerHTML = `<strong>Did You Know?</strong> ${fact}`;
}

// Show a fact as soon as the page loads
showRandomSpaceFact();

// -----------------------------------------------------------------
// Fetching APOD data
// -----------------------------------------------------------------
async function fetchApodRange(startDate, endDate) {
  const url = `${APOD_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA API request failed with status ${response.status}`);
  }

  const data = await response.json();

  // The API can return a single object instead of an array if the
  // start and end date are the same day - normalize that here.
  const entries = Array.isArray(data) ? data : [data];

  // Most recent first looks nicer in the gallery
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  return entries;
}

// -----------------------------------------------------------------
// Rendering the gallery
// -----------------------------------------------------------------
function showLoadingMessage() {
  gallery.innerHTML = `
    <div class="loading-message">
      🔄 Loading space photos…
    </div>
  `;
}

function renderGallery(entries) {
  gallery.innerHTML = '';

  if (entries.length === 0) {
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🔭</div>
        <p>No images found for that date range. Try a different range!</p>
      </div>
    `;
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    if (entry.media_type === 'video') {
      item.innerHTML = `
        <div class="video-thumb-placeholder">🎬</div>
        <h3>${entry.title}</h3>
        <p>${entry.date}</p>
        <span class="video-badge">Video</span>
      `;
    } else {
      item.innerHTML = `
        <div class="media-wrap">
          <img src="${entry.url}" alt="${entry.title}" />
        </div>
        <h3>${entry.title}</h3>
        <p>${entry.date}</p>
      `;
    }

    item.addEventListener('click', () => openModal(entry));
    gallery.appendChild(item);
  });
}

// -----------------------------------------------------------------
// Modal
// -----------------------------------------------------------------
function openModal(entry) {
  modalTitle.textContent = entry.title;
  modalDate.textContent = entry.date;
  modalExplanation.textContent = entry.explanation;

  if (entry.media_type === 'video') {
    // Try to embed if it's a YouTube link, otherwise show a link
    if (entry.url.includes('youtube.com') || entry.url.includes('youtu.be')) {
      modalMedia.innerHTML = `<iframe src="${entry.url}" allowfullscreen></iframe>`;
    } else {
      modalMedia.innerHTML = `<p><a href="${entry.url}" target="_blank" rel="noopener">Watch video ↗</a></p>`;
    }
  } else {
    const imgUrl = entry.hdurl || entry.url;
    modalMedia.innerHTML = `<img src="${imgUrl}" alt="${entry.title}" />`;
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  modalMedia.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// -----------------------------------------------------------------
// Button click handler
// -----------------------------------------------------------------
getImagesBtn.addEventListener('click', async () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🔭</div>
        <p>Please choose a start and end date first!</p>
      </div>
    `;
    return;
  }

  showLoadingMessage();

  try {
    const entries = await fetchApodRange(startDate, endDate);
    renderGallery(entries);
  } catch (error) {
    console.error(error);
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">⚠️</div>
        <p>Something went wrong fetching space images. Please try again.</p>
      </div>
    `;
  }
});