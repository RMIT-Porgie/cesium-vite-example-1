import {
  Cartesian3,
  Math as CesiumMath,
  Terrain,
  Viewer,
  createOsmBuildingsAsync,
} from "cesium";
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

// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
  orientation: {
    heading: CesiumMath.toRadians(0.0),
    pitch: CesiumMath.toRadians(-15.0),
  },
});

// Add Cesium OSM Buildings, a global 3D buildings layer.
createOsmBuildingsAsync().then((buildingTileset) => {
  viewer.scene.primitives.add(buildingTileset);
});
