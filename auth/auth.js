let isLogin = true;

const title = document.getElementById("auth-title");
const btn = document.getElementById("auth-btn");
const toggle = document.getElementById("toggle-auth");
const usernameInput =
  document.getElementById("username");

const handleStatus =
  document.getElementById("handle-status");

let handleAvailable = false;

toggle.onclick = () => {
  isLogin = !isLogin;

  if (isLogin) {
    title.textContent = "Logowanie";
    btn.textContent = "zaloguj się";
    toggle.textContent = "Rejestracja";
  } else {
    title.textContent = "Rejestracja";
    btn.textContent = "zarejestruj się";
    toggle.textContent = "Logowanie";
  }

  document
    .querySelectorAll(".register-only")
    .forEach(el => {

      el.style.display =
        isLogin ? "none" : "block";

    });
};

document.getElementById("auth-form").onsubmit = async (e) => {
  e.preventDefault();

  const email =
  document.getElementById("email").value.trim();

const password =
  document.getElementById("password").value;

const displayName =
  document.getElementById("display-name")?.value?.trim() || "";

let username =
  document.getElementById("username")?.value?.trim().toLowerCase() || "";

  if (isLogin) {

    // 🔐 LOGOWANIE
    const { error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      alert("Błąd logowania");
      console.error(error);
      return;
    }

    window.location.href = "/map";

  } else {

    // 📝 WALIDACJA

    if (!displayName) {
      alert("Podaj nazwę użytkownika.");
      return;
    }

   if (!username) {
  alert("Podaj handle.");
  return;
}

username = username.replace(/^@+/, "");
username = "@" + username;


   

   if (!handleAvailable) {

  alert("Wybierz wolny handle.");

  return;

}

    // 📝 REJESTRACJA

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      alert("Błąd rejestracji");
      console.error(error);
      return;
    }

    if (data.user) {

      const { error: profileError } =
        await supabaseClient
          .from("profiles")
          .insert([{
            user_id: data.user.id,
            name: displayName,
            handle: username,
            avatar_url: null
          }]);

      if (profileError) {
  console.error(profileError);
  alert("Nie udało się utworzyć profilu.");
  return;
}

    }

    alert("Konto utworzone! Sprawdź swojego maila.");

    isLogin = true;

title.textContent = "Logowanie";
btn.textContent = "zaloguj się";
toggle.textContent = "Rejestracja";

document
  .querySelectorAll(".register-only")
  .forEach(el => {
    el.style.display = "none";
  });

document.getElementById("auth-form").reset();

handleStatus.textContent = "";
handleStatus.className = "";

handleAvailable = false;

  }

};



if (usernameInput) {

  usernameInput.addEventListener(
    "input",
    async () => {

      let handle =
        usernameInput.value
          .trim()
          .toLowerCase();

      if (!handle) {

        handleStatus.textContent = "";
        handleStatus.className = "";

        handleAvailable = false;

        return;
      }

      handle =
        handle.replace(/^@+/, "");

      handle =
        "@" + handle;

      handleStatus.textContent =
        "Sprawdzanie...";

      handleStatus.className =
        "checking";

      const { data } =
        await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("handle", handle)
          .maybeSingle();

      if (data) {

        handleStatus.textContent =
          "❌ Ten handle jest już zajęty";

        handleStatus.className =
          "taken";

        handleAvailable = false;

      } else {

        handleStatus.textContent =
          "✅ Handle jest dostępny";

        handleStatus.className =
          "available";

        handleAvailable = true;

      }

    }
  );

}
const forgotBtn = document.getElementById("forgot-password");

if (forgotBtn) {
  forgotBtn.onclick = async () => {
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Podaj email, aby zresetować hasło.");
      return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password"
    });

    if (error) {
      console.error(error);
      alert("Nie udało się wysłać maila.");
      return;
    }

    alert("Sprawdź swojego maila.");
  };
}