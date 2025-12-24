/* =======================
   STEP 1: MAP SETUP
======================= */
const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

/* =======================
   STEP 2: STATE
======================= */
let pointA = null;
let pointB = null;
let markerA = null;
let markerB = null;
let routeControl = null;

let vehicleMarker = null;
let roadPoints = [];
let index = 0;
let moveInterval = null;
let isPaused = false;

let totalDistanceKm = 0;
let totalTimeMin = 0;

/* =======================
   STEP 3: MAP CLICK
======================= */
map.on("click", function (e) {

  // reset if already used
  if (pointA && pointB) resetAll();

  // POINT A
  if (!pointA) {
    pointA = e.latlng;
    markerA = L.marker(pointA)
      .addTo(map)
      .bindPopup("Point A")
      .openPopup();
    return;
  }

  // POINT B
  if (!pointB) {
    pointB = e.latlng;
    markerB = L.marker(pointB)
      .addTo(map)
      .bindPopup("Point B")
      .openPopup();

    routeControl = L.Routing.control({
      waypoints: [
        L.latLng(pointA.lat, pointA.lng),
        L.latLng(pointB.lat, pointB.lng)
      ],
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: "green", weight: 5 }]
      }
    }).addTo(map);

    routeControl.on("routesfound", function (e) {
      const route = e.routes[0];

      // REAL distance & time
      totalDistanceKm = route.summary.totalDistance / 1000;
      totalTimeMin = route.summary.totalTime / 60;

      roadPoints = route.coordinates;
      index = 0;

      updatePanel(totalDistanceKm, totalTimeMin);
      startVehicle();
    });
  }
});

/* =======================
   STEP 4: VEHICLE MOVE
======================= */
function startVehicle() {
  if (vehicleMarker) map.removeLayer(vehicleMarker);

  vehicleMarker = L.circleMarker(
    [roadPoints[0].lat, roadPoints[0].lng],
    {
      radius: 6,
      color: "blue",
      fillColor: "blue",
      fillOpacity: 1
    }
  ).addTo(map);

  moveInterval = setInterval(() => {
    if (isPaused) return;

    if (index >= roadPoints.length) {
      clearInterval(moveInterval);
      return;
    }

    vehicleMarker.setLatLng([
      roadPoints[index].lat,
      roadPoints[index].lng
    ]);

    const progress = index / roadPoints.length;
    const remainingDistance = totalDistanceKm * (1 - progress);
    const remainingTime = totalTimeMin * (1 - progress);

    updatePanel(remainingDistance, remainingTime);
    index++;

  }, 120);
}

/* =======================
   STEP 5: INFO PANEL
======================= */
function updatePanel(distanceKm, timeMin) {
  document.getElementById("distance").innerText =
    distanceKm.toFixed(2);
  document.getElementById("eta").innerText =
    timeMin.toFixed(1);

  const speed =
    distanceKm / (timeMin / 60 || 1);
  document.getElementById("speed").innerText =
    speed.toFixed(1);
}

/* =======================
   STEP 6: CONTROLS
======================= */
document.getElementById("pause-btn").onclick = () => {
  isPaused = true;
};

document.getElementById("resume-btn").onclick = () => {
  isPaused = false;
};

document.getElementById("reset-btn").onclick = resetAll;

/* =======================
   STEP 7: RESET
======================= */
function resetAll() {
  if (markerA) map.removeLayer(markerA);
  if (markerB) map.removeLayer(markerB);
  if (vehicleMarker) map.removeLayer(vehicleMarker);
  if (routeControl) map.removeControl(routeControl);

  clearInterval(moveInterval);

  pointA = pointB = null;
  markerA = markerB = null;
  routeControl = null;
  vehicleMarker = null;
  roadPoints = [];
  index = 0;
  isPaused = false;

  document.getElementById("distance").innerText = "-";
  document.getElementById("speed").innerText = "-";
  document.getElementById("eta").innerText = "-";
}
