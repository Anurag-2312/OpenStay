# OpenStay

OpenStay is a full-stack vacation rental web application inspired by Airbnb. Users can browse property listings, sign up, list their own stays with photos and locations, and leave reviews on places they've visited.

Built with **Node.js**, **Express**, **MongoDB**, and **EJS**, with image hosting on **Cloudinary** and geocoding via **Photon (Komoot)**.

---

## Features

- **Property listings** — create, view, edit and delete stays with title, description, price, location, country and category.
- **User authentication** — signup, login and logout powered by Passport.js with `passport-local-mongoose`. Email is used as the username.
- **Password reset over email** — forgot-password flow with time-limited token, delivered via Nodemailer (Gmail SMTP).
- **Image uploads** — listing photos uploaded to Cloudinary using Multer + `multer-storage-cloudinary`.
- **Reviews and ratings** — logged-in users can post reviews (1–5 stars) on listings; only the author can delete their own review.
- **Authorization** — only the owner of a listing can edit or delete it. Reviews follow the same author-only rule.
- **Search and category filter** — filter listings by free-text search (title, location, country, description) or by category (`mountains`, `castles`, `amazing-pools`, etc.).
- **Geocoding** — listing locations are converted to latitude/longitude using the Photon API and stored as GeoJSON points for future map use.
- **Server-side validation** — request bodies validated with Joi schemas before hitting the database.
- **Flash messages** — success and error banners via `connect-flash`.
- **Session persistence** — sessions stored in MongoDB using `connect-mongo`.
- **Security hardening**:
  - `helmet` for HTTP security headers
  - Request body size limits (`10kb`)
  - File upload size limit (`5MB`) and allowed-format whitelist
  - Input sanitization middleware
  - Rate limiting on `/login`, `/signup`, `/forgot` and `/reset` via `express-rate-limit`
  - Open-redirect protection on post-login redirects
  - HTTP-only, `SameSite=Lax` session cookies; `Secure` flag in production

---

## Tech Stack

| Layer            | Tools                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Runtime          | Node.js                                                               |
| Web framework    | Express 5                                                             |
| Database         | MongoDB Atlas via Mongoose                                            |
| Templating       | EJS + `ejs-mate` layouts                                              |
| Auth             | Passport, `passport-local`, `passport-local-mongoose`                 |
| Sessions         | `express-session` + `connect-mongo`                                   |
| File uploads     | Multer + `multer-storage-cloudinary` + Cloudinary                     |
| Validation       | Joi                                                                   |
| Email            | Nodemailer (Gmail SMTP)                                               |
| Geocoding        | Photon API (https://photon.komoot.io)                                 |
| Security         | Helmet, `express-rate-limit`, custom sanitize middleware              |
| Frontend         | Bootstrap (via EJS templates), custom CSS, vanilla JS                 |

---

## Project Structure

```
OpenStay/
├── app.js                  # App entry point: config, middleware, routes, error handlers
├── middleware.js           # Auth guards (isLoggedIn, isOwner, isReviewAuthor) + Joi validators
├── schemas.js              # Joi schemas for listings and reviews
├── cloudConfig.js          # Cloudinary + Multer storage setup
├── controllers/            # Route handlers
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
├── routes/                 # Express routers
│   ├── listings.js
│   ├── review.js
│   └── users.js
├── models/                 # Mongoose models
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── views/                  # EJS templates
│   ├── layouts/boilerplate.ejs
│   ├── includes/           # navbar, footer, flash
│   ├── listings/           # index, show, new, edit
│   ├── users/              # login, signup, forgot, reset
│   └── error.ejs
├── public/                 # Static assets (CSS, JS, favicon)
├── utils/
│   ├── ExpressError.js     # Custom error class
│   ├── wrapAsync.js        # Async route wrapper
│   ├── sanitize.js         # Request body sanitizer
│   ├── geocode.js          # Photon geocoding helper
│   └── email.js            # Nodemailer transport + password-reset email
├── init/                   # Seed script
│   ├── data.js
│   └── index.js
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- Node.js (v18+ recommended — `geocode.js` uses the native `fetch` API)
- A MongoDB instance (a free MongoDB Atlas cluster works well)
- A Cloudinary account
- A Gmail account with an App Password (for the password-reset emails)

### 2. Clone and install

```bash
git clone https://github.com/Anurag-2312/OpenStay.git
cd OpenStay
npm install
```

### 3. Environment variables

Create a `.env` file in the project root with the following keys:

```env
ATLASDB_URL=mongodb+srv://<user>:<password>@<cluster>/OpenStay
SECRET=<a long random string for sessions>

CLOUD_NAME=<cloudinary cloud name>
CLOUD_API_KEY=<cloudinary api key>
CLOUD_API_SECRET=<cloudinary api secret>

GMAIL_USER=<your gmail address>
GMAIL_APP_PASSWORD=<16-character gmail app password>

# optional
PORT=8080
NODE_ENV=development
```

`.env` is already listed in `.gitignore` — do not commit it.

### 4. Run the app

```bash
node app.js
```

The server listens on `http://localhost:8080` and redirects `/` to `/listings`.

### 5. (Optional) Seed sample listings

The seed script picks a handful of sample stays from `init/data.js`, geocodes them, and assigns them to the first user in your database — so sign up at least one user first via the UI, then run:

```bash
node init/index.js
```

---

## Routes

### Listings
| Method | Path                          | Auth        | Description              |
| ------ | ----------------------------- | ----------- | ------------------------ |
| GET    | `/listings`                   | public      | Browse + search + filter |
| GET    | `/listings/new`               | logged in   | Render new-listing form  |
| POST   | `/listings`                   | logged in   | Create a listing         |
| GET    | `/listings/:id`               | logged in   | Show one listing         |
| GET    | `/listings/:id/edit`          | owner only  | Render edit form         |
| PUT    | `/listings/:id`               | owner only  | Update a listing         |
| DELETE | `/listings/:id`               | owner only  | Delete a listing         |

### Reviews
| Method | Path                                       | Auth         |
| ------ | ------------------------------------------ | ------------ |
| POST   | `/listings/:id/reviews`                    | logged in    |
| DELETE | `/listings/:id/reviews/:reviewId`          | author only  |

### Auth
| Method | Path             | Description              |
| ------ | ---------------- | ------------------------ |
| GET    | `/signup`        | Signup form              |
| POST   | `/signup`        | Create account           |
| GET    | `/login`         | Login form               |
| POST   | `/login`         | Local auth               |
| POST   | `/logout`        | End session              |
| GET    | `/forgot`        | Forgot-password form     |
| POST   | `/forgot`        | Send reset email         |
| GET    | `/reset/:token`  | Reset-password form      |
| POST   | `/reset/:token`  | Set new password         |

---

## Data Models

**User** — `email` (unique, lowercase), `username`, hashed password (managed by `passport-local-mongoose`), `resetPasswordToken`, `resetPasswordExpires`.

**Listing** — `title`, `description`, `price`, `location`, `country`, `category`, `image { url, filename }`, `owner` (ref User), `reviews` (refs Review), `geometry` (GeoJSON `Point`). Deleting a listing cascades to its reviews.

**Review** — `comment`, `rating` (1–5), `createdAt`, `author` (ref User).

---

## Deployment Notes

- Set `NODE_ENV=production` in your hosting environment so that:
  - The `Secure` cookie flag is enabled
  - Generic error messages are returned for 5xx errors
- `app.set("trust proxy", 1)` is already configured for environments behind a reverse proxy (Render, Heroku, etc.).
- Sessions are persisted in MongoDB, so the app is safe to scale horizontally.

---

## License

ISC

---

## Author

Built by [Anurag-2312](https://github.com/Anurag-2312).
