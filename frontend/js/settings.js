async function loadProfile() {
  try {
    const { user } = await api.get("/auth/profile");
    document.getElementById("profileName").value = user.name || "";
    document.getElementById("profilePhone").value = user.phone || "";
    document.getElementById("profileAddress").value = user.address || "";
    document.getElementById("profileLicense").value = user.licenseNumber || "";
    document.getElementById("profileEmail").value = user.email || "";
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const user = Auth.getUser();
  try {
    const { user: updated } = await api.put(`/users/${user._id}`, {
      name: document.getElementById("profileName").value,
      phone: document.getElementById("profilePhone").value,
      address: document.getElementById("profileAddress").value,
      licenseNumber: document.getElementById("profileLicense").value,
    });
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(updated));
    Utils.toast("Profile updated.", "success");
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

function loadVoicePrefs() {
  const prefs = JSON.parse(localStorage.getItem("dla_voice_prefs") || "{}");
  document.getElementById("prefVoiceEnabled").checked = prefs.enabled !== false;
  document.getElementById("prefVoiceLang").value = prefs.lang || "en";
  document.getElementById("prefVoiceFrequency").value = prefs.frequency || "normal";
}

function saveVoicePrefs() {
  const prefs = {
    enabled: document.getElementById("prefVoiceEnabled").checked,
    lang: document.getElementById("prefVoiceLang").value,
    frequency: document.getElementById("prefVoiceFrequency").value,
  };
  localStorage.setItem("dla_voice_prefs", JSON.stringify(prefs));
  Utils.toast("Voice co-driver preferences saved.", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("settings", "Settings");
  if (!user) return;
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("voicePrefsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveVoicePrefs();
  });
  loadProfile();
  loadVoicePrefs();
});
