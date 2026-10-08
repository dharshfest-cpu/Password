const STORAGE_KEY = "secureAuthUsers";
const PBKDF2_ITERATIONS = 210000;
const HASH_ALGORITHM = "PBKDF2-HMAC-SHA-256";

const $ = (id) => document.getElementById(id);
const registerForm = $("registerForm");
const loginForm = $("loginForm");
const registerTab = $("registerTab");
const loginTab = $("loginTab");
const message = $("message");
const accountPanel = $("accountPanel");
const accountName = $("accountName");

function getUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function setMessage(text, type = "success") {
  message.textContent = text;
  message.className = `message ${type}`;
}

function clearMessage() {
  message.textContent = "";
  message.className = "message hidden";
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function randomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

async function derivePasswordHash(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return new Uint8Array(bits);
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

async function hashPassword(password, salt = randomSalt()) {
  const hash = await derivePasswordHash(password, salt);
  return { salt, hash };
}

function switchTab(tab) {
  const registering = tab === "register";
  registerForm.classList.toggle("hidden", !registering);
  loginForm.classList.toggle("hidden", registering);
  registerTab.classList.toggle("active", registering);
  loginTab.classList.toggle("active", !registering);
  registerTab.setAttribute("aria-selected", String(registering));
  loginTab.setAttribute("aria-selected", String(!registering));
  clearMessage();
}

registerTab.addEventListener("click", () => switchTab("register"));
loginTab.addEventListener("click", () => switchTab("login"));

document.querySelectorAll(".show-btn").forEach(button => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.textContent = visible ? "Show" : "Hide";
  });
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const username = normalizeUsername($("registerUsername").value);
  const password = $("registerPassword").value;
  const confirmation = $("confirmPassword").value;

  if (username.length < 3) return setMessage("Username must contain at least 3 characters.", "error");
  if (password.length < 8) return setMessage("Password must contain at least 8 characters.", "error");
  if (password !== confirmation) return setMessage("Passwords do not match.", "error");

  const users = getUsers();
  if (users.some(user => user.username === username)) {
    return setMessage("That username already exists. Please choose another one.", "error");
  }

  try {
    const { salt, hash } = await hashPassword(password);
    users.push({
      username,
      salt: bytesToBase64(salt),
      hash: bytesToBase64(hash),
      algorithm: HASH_ALGORITHM,
      iterations: PBKDF2_ITERATIONS,
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
    registerForm.reset();
    setMessage("Account created. Your password was hashed and only the hash is stored locally.", "success");
    setTimeout(() => switchTab("login"), 900);
  } catch (error) {
    setMessage("Your browser could not create the password hash. Please use a modern browser.", "error");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const username = normalizeUsername($("loginUsername").value);
  const password = $("loginPassword").value;
  const user = getUsers().find(item => item.username === username);

  if (!user) return setMessage("Invalid username or password.", "error");

  try {
    const salt = base64ToBytes(user.salt);
    const storedHash = base64ToBytes(user.hash);
    const derivedHash = await derivePasswordHash(password, salt);

    if (!constantTimeEqual(derivedHash, storedHash)) {
      return setMessage("Invalid username or password.", "error");
    }

    loginForm.reset();
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    document.querySelector(".tabs").classList.add("hidden");
    accountName.textContent = username;
    accountPanel.classList.remove("hidden");
    setMessage("Login successful.", "success");
  } catch (error) {
    setMessage("Unable to verify the password in this browser.", "error");
  }
});

$("logoutBtn").addEventListener("click", () => {
  accountPanel.classList.add("hidden");
  document.querySelector(".tabs").classList.remove("hidden");
  switchTab("login");
  setMessage("You have been logged out.", "success");
});
