module.exports = async function geocodeLocation(query) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features && data.features[0];
    if (!feature || !feature.geometry) return null;
    return {
      type: "Point",
      coordinates: feature.geometry.coordinates,
    };
  } catch {
    return null;
  }
};
