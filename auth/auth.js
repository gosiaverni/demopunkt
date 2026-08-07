let isLogin = true;

const title = document.getElementById("auth-title");
const btn = document.getElementById("auth-btn");
const toggle = document.getElementById("toggle-auth");

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

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const displayName =
    document.getElementById("display-name")?.value.trim();

  let username =
    document.getElementById("username")?.value.trim().toLowerCase();

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

    // 🔍 sprawdzenie czy handle istnieje

    const { data: existing } =
      await supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("handle", username)
        .maybeSingle();

    if (existing) {
      alert("Ten handle jest już zajęty.");
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
      }

    }

    alert("Konto utworzone! Sprawdź swojego maila.");

  }

};

username = username.replace(/^@+/, "");
username = "@" + username;
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