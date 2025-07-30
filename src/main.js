import { Cartesian3, Math as CesiumMath, Terrain, Viewer } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";

import { createToolbar } from "./toolbar.js";

createToolbar();

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
});
// Make the viewer globally accessible for other components (e.g., Design.js)
window._mainViewer = viewer;

// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(145.2678, -36.4369, 400),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-90.0),
  },
});
