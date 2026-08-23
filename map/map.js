
document.addEventListener("DOMContentLoaded", () => {

  const loader = document.getElementById("map-loader");
  const mapEl = document.getElementById("map");
  const categoryDropdown =
  document.getElementById("category-dropdown");

const categoryButton =
  document.getElementById("category-dropdown-button");

const categoryCheckboxes =
  document.querySelectorAll(
    "#category-dropdown-menu input[type='checkbox']"
  );

  if (!mapEl) return;


  

  const map = L.map(mapEl).setView(
    [52.2297, 21.0122],
    6
  );

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© OpenStreetMap & CartoDB'
    }
  ).addTo(map);


  

  const params =
    new URLSearchParams(window.location.search);

  const address = params.get("address");

  if (address) {

    fetch(
      `${window.GEOCODE_URL}?q=${encodeURIComponent(address)}`
    )
      .then(res => res.json())
      .then(data => {

        if (!Array.isArray(data) || !data.length) {
          return;
        }

        const place = data[0];

        map.setView(
          [
            Number(place.lat),
            Number(place.lon)
          ],
          13
        );

      })
      .catch(console.error);
  }


  

  function hideLoader() {

    if (!loader) return;

    loader.style.display = "none";

    mapEl.classList.add("visible");
  }


  

  const customIcon = L.icon({

    iconUrl: "/assets/pin.png",

    iconSize: [40, 40],

    iconAnchor: [20, 40]

  });



  function formatDate(dateString) {

    if (!dateString) return "";

    const [y, m, d] =
      dateString.split("-");

    return `${d}.${m}.${y}`;
  }


 window.openEvent = function (eventLink) {
  if (!eventLink) return;

  window.location.href = eventLink;
};


  

  let allEvents = [];

  let markers = [];


  

  async function loadEvents() {

    try {

      const {
        data: events,
        error
      } = await supabaseClient

        .from("events")

        .select(
          "id, title, lat, lon, institution, end_date, cover_image, category, link"
        )

        .gte(
          "end_date",
          new Date()
            .toISOString()
            .split("T")[0]
        )

        .order(
          "end_date",
          {
            ascending: true
          }
        );


      if (error) {

        console.error(
          "Events error:",
          error
        );

        hideLoader();

        return;
      }


      allEvents = events || [];

      renderMarkers();


    } catch (error) {

      console.error(
        "Load events error:",
        error
      );

      hideLoader();

    }

  }


  

  function renderMarkers() {

    // usuwamy poprzednie markery

    markers.forEach(marker => {

      map.removeLayer(marker);

    });

    markers = [];


    

 const selectedCategories =
  Array.from(categoryCheckboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value.toLowerCase());

const filteredEvents =
  allEvents.filter(event => {

    // Nic nie zaznaczone → wszystkie wydarzenia
    if (selectedCategories.length === 0) {
      return true;
    }

    // Pokazujemy wydarzenia z wybranych kategorii
    return (
      event.category &&
      selectedCategories.includes(
        event.category.toLowerCase()
      )
    );

  });


    

    filteredEvents.forEach(event => {

      if (
        event.lat == null ||
        event.lon == null
      ) {
        return;
      }


      const lat = Number(event.lat);
      const lon = Number(event.lon);


      if (
        isNaN(lat) ||
        isNaN(lon)
      ) {
        return;
      }


      const marker =
        L.marker(
          [lat, lon],
          {
            icon: customIcon
          }
        ).addTo(map);


marker.bindPopup(`
  <div
    class="popup-card"
    onclick="window.openEvent('${event.link}')"
  >

    <div class="popup-title">
      ${event.title}
    </div>

    <div class="popup-content">

      <div class="popup-text">

        <div class="popup-place">
          ${event.institution || ""}
        </div>

        <div class="popup-date">
          do ${formatDate(event.end_date)}
        </div>

      </div>

      ${
        event.cover_image
          ? `
            <img
              class="popup-img"
              loading="lazy"
              src="${event.cover_image}"
            >
          `
          : ""
      }

    </div>

  </div>
`);

      


      markers.push(marker);

    });


    hideLoader();

  }


  
if (categoryButton) {

  categoryButton.addEventListener(
    "click",
    () => {

      categoryDropdown.classList.toggle("open");

    }
  );

}


categoryCheckboxes.forEach(checkbox => {

  checkbox.addEventListener(
    "change",
    () => {

      const selected =
        Array.from(categoryCheckboxes)
          .filter(checkbox => checkbox.checked);

      if (selected.length === 0) {

        categoryButton.textContent =
          "wszystkie kategorie";

      } else if (selected.length === 1) {

        categoryButton.textContent =
          selected[0].nextElementSibling.textContent;

      } else {

        categoryButton.textContent =
          `${selected.length} kategorii`;

      }

      renderMarkers();

    }
  );

});

document.addEventListener(
  "click",
  event => {

    if (
      categoryDropdown &&
      !categoryDropdown.contains(event.target)
    ) {

      categoryDropdown.classList.remove("open");

    }

  }
);

  

  map.whenReady(() => {

    loadEvents();

  });

});