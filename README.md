# SecureAuth - Client-Side Password Hashing Login/Register

This project adds a browser-only Register/Login system to the original password-hashing coursework.

## What was added

- Register page
- Login page
- Password confirmation
- Show/Hide password buttons
- Random 16-byte salt per account
- PBKDF2-HMAC-SHA-256 password hashing with 210,000 iterations
- Local storage of only username + salt + hash + hashing metadata
- Password verification during login
- Logout state
- Responsive HTML/CSS design
- No Python, Flask, database, build tools, or server required
- Ready for GitHub Pages

## Important note about the original three programs

The supplied ZIP contains three Flask/Python demonstrations:

1. Argon2id
2. bcrypt
3. scrypt

Those algorithms depend on Python packages in the original projects. A GitHub Pages site cannot execute that Python backend. The new static login/register interface therefore uses the browser Web Crypto API and PBKDF2-HMAC-SHA-256 so the project can run directly as a static GitHub Pages website.

The original three projects are preserved in `original-hashing-programs/` for reference.

## Run locally

You can simply open `index.html` in a modern browser. For the most reliable Web Crypto behavior, you can also use a local static server.

## GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, `README.md`, and `original-hashing-programs/`.
3. Open **Settings -> Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and the `/ (root)` folder.
6. Save and wait for GitHub Pages to publish the site.

## Where the password is stored

The browser stores a JSON array under the localStorage key `secureAuthUsers`. A record looks conceptually like:

```text
username
salt
hash
algorithm
iterations
createdAt
```

The plaintext password is never placed into localStorage.

## Security limitation

This is an educational frontend authentication demo, not a production authentication system. localStorage is controlled by the browser and is not a secure server-side user database. A production application should use a backend, HTTPS, secure sessions/cookies, rate limiting, account recovery controls, and server-side password hashing.
