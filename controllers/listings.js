const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const geocodeLocation = require("../utils/geocode.js");
const { cloudinary } = require("../cloudConfig.js");

module.exports.index = async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: regex },
      { location: regex },
      { country: regex },
      { description: regex },
    ];
  }
  if (category && category !== "all") {
    filter.category = category;
  }
  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", {
    allListings,
    q: q || "",
    category: category || "all",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  if (req.file) {
    newListing.image = { url: req.file.path, filename: req.file.filename };
  }
  const geometry = await geocodeLocation(
    `${req.body.listing.location}, ${req.body.listing.country}`,
  );
  if (geometry) newListing.geometry = geometry;
  await newListing.save();
  req.flash("success", "New listing created");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    listing.image = { url: req.file.path, filename: req.file.filename };
  }
  const geometry = await geocodeLocation(
    `${req.body.listing.location}, ${req.body.listing.country}`,
  );
  if (geometry) listing.geometry = geometry;
  await listing.save();
  req.flash("success", "Listing updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndDelete(id);
  if (listing && listing.image && listing.image.filename) {
    await cloudinary.uploader.destroy(listing.image.filename);
  }
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
};
