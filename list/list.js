const container = document.getElementById("events-container");
const select = document.getElementById("city-select");
const categorySelect = document.getElementById("category-select");
const title = document.getElementById("city-title");
const loader = document.getElementById("list-loader");
const list = document.querySelector(".events-grid");

function hideLoader() {
  if (!loader) return;

  loader.classList.add("hidden");

  setTimeout(() => {
    loader.style.display = "none";
  }, 300);
}

function showList() {
  if (list) list.classList.add("visible");
}

let allEvents = [];

async function loadEvents() {

  const { data: events, error } = await supabaseClient
    .from("events")
    .select(
      "id, title, institution, end_date, location, cover_image, category"
    )
    .gte(
      "end_date",
      new Date().toISOString().split("T")[0]
    )
    .limit(50);

  if (error) {
    console.error("Events error:", error);
    return [];
  }

  return events || [];
}


// =======================
// 🎯 FILTROWANIE
// =======================

function renderEvents(events, city, category) {

  const filtered = events.filter(event => {

    // 🏙️ FILTR MIASTA
    const matchesCity =
      !city ||
      event.location
        ?.toLowerCase()
        .includes(city.toLowerCase());

    // 🎨 FILTR KATEGORII
    const matchesCategory =
      !category ||
      event.category === category;

    // oba warunki muszą być spełnione
    return matchesCity && matchesCategory;
  });


  // =======================
  // ❌ BRAK WYNIKÓW
  // =======================

  if (!filtered.length) {

    container.innerHTML =
      "Brak wydarzeń dla wybranych filtrów";

    if (title) {
      title.textContent = "wydarzenia";
    }

    return;
  }


  // =======================
  // 🧹 CZYSZCZENIE
  // =======================

  container.innerHTML = "";


  // =======================
  // 🏷️ TYTUŁ
  // =======================

  if (title) {

    if (city && category) {

      title.textContent =
        `${city} • ${category}`;

    } else if (city) {

      title.textContent = city;

    } else if (category) {

      title.textContent = category;

    } else {

      title.textContent = "wydarzenia";

    }
  }


  // =======================
  // 🎫 KARTY
  // =======================

  filtered.forEach(event => {

    const card =
      document.createElement("div");

    card.classList.add("event-card");


    const formatDate = (dateStr) => {

      if (!dateStr) return "";

      const [year, month, day] =
        dateStr.split("-");

      return `${day}.${month}.${year}`;
    };


    card.innerHTML = `

      <div class="event-card-text">

        <h3>
          ${event.title || ""}
        </h3>

        <p>
          ${event.institution || ""}
        </p>

        ${
          event.category
            ? `<p>${event.category}</p>`
            : ""
        }

        <div class="event-card-date">
          do ${formatDate(event.end_date)}
        </div>

      </div>

      ${
        event.cover_image
          ? `<img
              loading="lazy"
              src="${event.cover_image}"
              alt="${event.title || ""}"
            >`
          : ""
      }

    `;


    card.addEventListener(
      "click",
      () => {
        window.location.href =
          `/event?id=${event.id}`;
      }
    );


    container.appendChild(card);

  });
}


// =======================
// 🚀 START
// =======================

(async () => {

  try {

    const events =
      await loadEvents();

    allEvents = events;

    renderEvents(
      allEvents,
      "",
      ""
    );

    showList();
    hideLoader();

  } catch (err) {

    console.error(err);

  }

})();


// =======================
// 🏙️ FILTR MIASTA
// =======================

if (select) {

  select.addEventListener(
    "change",
    () => {

      renderEvents(
        allEvents,
        select.value,
        categorySelect?.value || ""
      );

    }
  );

}


// =======================
// 🎨 FILTR KATEGORII
// =======================

if (categorySelect) {

  categorySelect.addEventListener(
    "change",
    () => {

      renderEvents(
        allEvents,
        select?.value || "",
        categorySelect.value
      );

    }
  );

}