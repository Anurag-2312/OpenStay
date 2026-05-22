if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env"),
  });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const geocodeLocation = require("../utils/geocode.js");

const MONGO_URL = process.env.ATLASDB_URL;

const PICKS = [
  { index: 0, category: "amazing-pools" },
  { index: 1, category: "iconic-cities" },
  { index: 2, category: "mountains" },
  { index: 3, category: "trending" },
  { index: 4, category: "camping" },
  { index: 8, category: "arctic" },
  { index: 9, category: "farms" },
  { index: 18, category: "castles" },
];

async function main() {
  if (!MONGO_URL) {
    console.error("ATLASDB_URL is not set in .env");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URL);
  console.log("connected to DB");

  const owner = await User.findOne({}).sort({ _id: 1 });
  if (!owner) {
    console.error("No user found in DB. Sign up at least one user first, then re-run.");
    process.exit(1);
  }
  console.log(`Using owner: ${owner.username} (${owner._id})`);

  const listings = PICKS.map(({ index, category }) => {
    const src = initData.data[index];
    if (!src) throw new Error(`data.js index ${index} missing`);
    return { ...src, category, owner: owner._id };
  });

  console.log("Geocoding...");
  for (const listing of listings) {
    const geometry = await geocodeLocation(`${listing.location}, ${listing.country}`);
    if (geometry) listing.geometry = geometry;
    process.stdout.write(`  ${listing.title} ${geometry ? "✓" : "—"}\n`);
  }

  await Listing.deleteMany({});
  await Listing.insertMany(listings);
  console.log(`\nSeeded ${listings.length} listings owned by ${owner.username}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
