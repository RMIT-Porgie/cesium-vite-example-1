// Simulation component logic for Cesium light shadows
export default function SimulationComponent() {
  const button = document.createElement("button");
  button.id = "shadowToggleBtn";
  button.className = `
    bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg
    shadow-lg transition-all duration-200 transform hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
  `;
  button.textContent = "Enable Light Shadows";

  let shadowsEnabled = false;

  button.addEventListener("click", () => {
    const viewer = window._mainViewer;
    if (!viewer) {
      console.error("Cesium viewer not found");
      return;
    }

    if (!shadowsEnabled) {
      // Enable shadows
      enableShadows(viewer);
      button.textContent = "Disable Light Shadows";
      button.className = `
        bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg
        shadow-lg transition-all duration-200 transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
      `;
      shadowsEnabled = true;
    } else {
      // Disable shadows
      disableShadows(viewer);
      button.textContent = "Enable Light Shadows";
      button.className = `
        bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg
        shadow-lg transition-all duration-200 transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      `;
      shadowsEnabled = false;
    }
  });

  return button;
}

function enableShadows(viewer) {
  try {
    // Enable shadow mapping
    viewer.scene.shadowMap.enabled = true;

    // Configure shadow map settings
    viewer.scene.shadowMap.size = 2048; // Shadow map resolution
    viewer.scene.shadowMap.maximumDistance = 10000.0; // Maximum shadow distance

    // Enable shadows for the globe
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.shadows = true;

    // Set up directional light for shadows
    const light = viewer.scene.light;
    if (light) {
      light.direction = new window.Cesium.Cartesian3(0.5, 0.5, -1.0);
      light.intensity = 1.0;
    }

    // Enable shadows for all entities and primitives
    viewer.scene.globe.enableLighting = true;

    console.log("Light shadows enabled successfully");
  } catch (error) {
    console.error("Error enabling shadows:", error);
  }
}

function disableShadows(viewer) {
  try {
    // Disable shadow mapping
    viewer.scene.shadowMap.enabled = false;

    // Disable lighting on globe
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.shadows = false;

    console.log("Light shadows disabled successfully");
  } catch (error) {
    console.error("Error disabling shadows:", error);
  }
}
