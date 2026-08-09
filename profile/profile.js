const init = async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "/auth";
    return;
  }

  setupUI();
  loadProfile();
  loadCreatedEvents();
  loadSavedEvents(); // 🔥 TU
};

init();


// 🎯 UI + EVENTY
function setupUI() {
 

    const modal = document.getElementById("profile-modal");
    const editBtn = document.getElementById("edit-profile");
    const closeBtn = document.getElementById("close-profile");
    const profileBox = document.querySelector(".profile-box");
    const saveBtn = document.getElementById("save-profile");
    const handleInput = document.getElementById("handle-input");
const handleStatus = document.getElementById("handle-status");

let handleAvailable = true;

    // 🔥 OTWIERANIE MODALA
    if (editBtn) {
      editBtn.onclick = () => {
        if (modal) {
  modal.classList.add("active");
}

        // focus UX
        document.getElementById("name-input").focus();
      };
    }

    // ❌ ZAMYKANIE X
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.remove("active");
    }

    // ❌ KLIK POZA MODAL
    if (modal && profileBox) {
      modal.addEventListener("click", (e) => {
        if (!profileBox.contains(e.target)) {
          modal.classList.remove("active");
        }
      });

      profileBox.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
// 🔎 SPRAWDZANIE HANDLE

if (handleInput) {

  handleInput.addEventListener("input", async () => {

    let handle =
      handleInput.value
        .trim()
        .toLowerCase();

    if (!handle) {

      handleStatus.textContent = "";
      handleStatus.className = "";

      handleAvailable = false;

      return;
    }

    // usuwamy @ z początku
    handle = handle.replace(/^@+/, "");

    // dodajemy jedno @
    handle = "@" + handle;

    handleStatus.textContent = "Sprawdzanie...";
    handleStatus.className = "checking";

    const {
      data: userData
    } = await supabaseClient.auth.getUser();

    const user = userData?.user;

    if (!user) return;


    // 🔎 sprawdzamy, czy handle należy do KOGOŚ INNEGO

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select("user_id")
      .eq("handle", handle)
      .neq("user_id", user.id)
      .maybeSingle();


    if (error) {

      console.error(
        "Błąd sprawdzania handle:",
        error
      );

      handleStatus.textContent =
        "Nie udało się sprawdzić handle";

      handleStatus.className = "taken";

      handleAvailable = false;

      return;
    }


    if (data) {

      handleStatus.textContent =
        "Ten handle jest już zajęty";

      handleStatus.className = "taken";

      handleAvailable = false;

    } else {

      handleStatus.textContent =
        "Handle jest dostępny";

      handleStatus.className = "available";

      handleAvailable = true;

    }

  });

}
    if (saveBtn) {
  saveBtn.onclick = async () => {

    const name =
      document
        .getElementById("name-input")
        .value
        .trim();

    let handle =
      document
        .getElementById("handle-input")
        .value
        .trim();

    const file =
      document
        .getElementById("avatar-input")
        .files[0];


    // 🔥 sanitizacja @

    handle =
      handle
        .replace(/^@+/, "")
        .toLowerCase();

    if (handle) {
      handle = "@" + handle;
    }


    // 🔒 NIE POZWALAMY ZAPISAĆ ZAJĘTEGO HANDLE

    if (!handle) {

      alert("Podaj handle.");
      return;

    }

    if (!handleAvailable) {

      alert("Ten handle jest już zajęty.");
      return;

    }


    let imageBase64 = null;

    if (file) {

      imageBase64 =
        await new Promise((resolve) => {

          const reader =
            new FileReader();

          reader.onload =
            (e) => resolve(e.target.result);

          reader.readAsDataURL(file);

        });

    }


    await saveProfile(
      name,
      handle,
      imageBase64
    );


    modal.classList.remove("active");


    document
      .getElementById("avatar-input")
      .value = "";


    loadProfile();

  };
}

  
}


// 📥 LOAD PROFILE (z Supabase)
async function loadProfile() {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Błąd pobierania profilu:", error);
    return;
  }
  if (!data) {
  document.getElementById("profile-name").textContent = "Uzupełnij profil";
  document.getElementById("profile-handle").textContent = "";
  return;
}
  if (data) {
    document.getElementById("profile-name").textContent = data.name || "Brak nazwy";
    document.getElementById("profile-handle").textContent = data.handle || "";

    if (data.avatar_url) {
      document.getElementById("profile-image").src = data.avatar_url;
    }

    // 🔥 uzupełnij formularz
    document.getElementById("name-input").value = data.name || "";

    let handle = data.handle || "";
    if (handle.startsWith("@")) handle = handle.slice(1);
    document.getElementById("handle-input").value = handle;

const handleStatus =
  document.getElementById("handle-status");

if (handleStatus) {
  handleStatus.textContent = "";
  handleStatus.className = "";
}
  }
}


// 💾 SAVE PROFILE (UPSERT)
async function saveProfile(name, handle, image = null) {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { error } = await supabaseClient
    .from("profiles")
    .upsert([
      {
        user_id: user.id,
        name,
        handle,
        avatar_url: image
      }
    ], { onConflict: ["user_id"] });

  if (error) {
    console.error("Błąd zapisu:", error);
    alert("Nie udało się zapisać profilu");
    return;
  }


}

async function loadCreatedEvents() {

  const container = document.getElementById("created-events");
  if (!container) return;

  container.innerHTML = "Ładowanie...";

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data: events, error } = await supabaseClient
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("end_date", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Błąd ładowania</p>";
    return;
  }

  renderCreatedEvents(events);
}

async function loadSavedEvents() {
  const container = document.getElementById("saved-events");
  if (!container) return;

  container.innerHTML = "Ładowanie...";

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("saved_events")
    .select(`
      event_id,
      events (*)
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Błąd ładowania</p>";
    return;
  }

const today = new Date().toISOString().split("T")[0];

const events = data
  .map(item => item.events)
  .filter(event => event && event.end_date >= today);
  renderSavedEvents(events);
}

function renderCreatedEvents(events) {

  const container = document.getElementById("created-events");
  container.innerHTML = "";

  if (!events || events.length === 0) {
    container.innerHTML = "<p>Nie utworzono jeszcze żadnych wydarzeń</p>";
    return;
  }

  events.forEach(event => {

    const card = document.createElement("div");
    card.classList.add("event-card");

    const formatDate = (d) => {
      if (!d) return "";
      const [y, m, day] = d.split("-");
      return `${day}.${m}.${y}`;
    };

    card.innerHTML = `
      <div class="event-card-text">
        <h3>${event.title}</h3>
        <p>${event.institution || ""}</p>

        <div class="event-card-date">
          do ${formatDate(event.end_date)}
        </div>
      </div>

      ${
        event.images?.length
          ? `<img src="${event.images[0]}">`
          : ""
      }
    `;

    card.onclick = () => {
      window.location.href = `/event?id=${event.id}`;
    };

    container.appendChild(card);

  });

}
function renderSavedEvents(events) {
  const container = document.getElementById("saved-events");
  container.innerHTML = "";

  if (!events || events.length === 0) {
    container.innerHTML = "<p>Brak zapisanych wydarzeń</p>";
    return;
  }

  events.forEach(event => {
    const card = document.createElement("div");
    card.classList.add("event-card");

    const formatDate = (d) => {
      if (!d) return "";
      const [y, m, day] = d.split("-");
      return `${day}.${m}.${y}`;
    };

    card.innerHTML = `
      <div class="event-card-text">
        <h3>${event.title}</h3>
        <p>${event.institution || ""}</p>
        <div class="event-card-date">
          do ${formatDate(event.end_date)}
        </div>
      </div>

      ${event.images?.length 
        ? `<img src="${event.images[0]}">`
        : ""
      }
    `;

    card.onclick = () => {
      window.location.href = `/event?id=${event.id}`;
    };

    container.appendChild(card);
  });
}

