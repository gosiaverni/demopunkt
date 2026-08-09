
document.addEventListener("DOMContentLoaded", () => {

  const loader = document.getElementById("map-loader");
  const mapEl = document.getElementById("map");
  const categorySelect =
    document.getElementById("map-category-select");

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
          16
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
        )

        .limit(30);


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


    

    const selectedCategory =
      categorySelect
        ? categorySelect.value
        : "";


    

    const filteredEvents =
      allEvents.filter(event => {

        if (!selectedCategory) {
          return true;
        }

        return (
          event.category &&
          event.category.toLowerCase() ===
          selectedCategory.toLowerCase()
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
    class="popup-content"
    onclick="window.openEvent('${event.link}')"
  >

    <div class="popup-text">

      <div class="popup-title">
        ${event.title}
      </div>

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
`);


      


      markers.push(marker);

    });


    hideLoader();

  }


  

  if (categorySelect) {

    categorySelect.addEventListener(
      "change",
      () => {

        renderMarkers();

      }
    );

  }


  

  map.whenReady(() => {

    loadEvents();

  });

});