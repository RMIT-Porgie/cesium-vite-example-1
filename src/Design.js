// Design component logic with Cesium and Tailwind
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Color,
  Cartographic,
  Cartesian3,
} from "cesium";

export default function DesignComponent() {
  // Use the global Cesium viewer from main.js
  let rectangleEntity = null;
  let handler = null;

  // UI setup (button, etc.)
  const div = document.createElement("div");
  div.className = "p-4";
  const roiBtn = document.createElement("button");
  roiBtn.textContent = "Region of Interest";
  roiBtn.className =
    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4";

  // Info display for width, length, area
  const infoDiv = document.createElement("div");
  infoDiv.className = "mb-2 text-gray-700";
  div.appendChild(infoDiv);
  div.appendChild(roiBtn);

  // PV array configuration UI (hidden until ROI is set)
  const pvConfigDiv = document.createElement("div");
  pvConfigDiv.className = "mb-2 flex gap-4 items-center";
  pvConfigDiv.style.display = "none";
  const rowLabel = document.createElement("label");
  rowLabel.textContent = "Rows:";
  const rowInput = document.createElement("input");
  rowInput.type = "number";
  rowInput.min = 1;
  rowInput.value = 2;
  rowInput.className = "border rounded px-2 py-1 w-16";
  const colLabel = document.createElement("label");
  colLabel.textContent = "Columns:";
  const colInput = document.createElement("input");
  colInput.type = "number";
  colInput.min = 1;
  colInput.value = 2;
  colInput.className = "border rounded px-2 py-1 w-16";
  pvConfigDiv.appendChild(rowLabel);
  pvConfigDiv.appendChild(rowInput);
  pvConfigDiv.appendChild(colLabel);
  pvConfigDiv.appendChild(colInput);
  div.appendChild(pvConfigDiv);

  // Store PV rectangles for cleanup
  let pvEntities = [];

  function startDrawingRectangle() {
    const viewer = window._mainViewer;

    // Helper for distance between two Cartesian3 points
    function cartesianDistance(a, b) {
      return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
          Math.pow(a.y - b.y, 2) +
          Math.pow(a.z - b.z, 2),
      );
    }

    // Rectangle drawing with 3 clicks: origin, width, length (perpendicular)
    let origin = null;
    let widthPoint = null;
    let lengthPoint = null;
    let tempLineEntity = null;
    let tempRectEntity = null;

    // Remove previous entities
    if (rectangleEntity) {
      viewer.entities.remove(rectangleEntity);
      rectangleEntity = null;
    }
    // Remove previous PV entities
    if (pvEntities.length > 0) {
      pvEntities.forEach((e) => viewer.entities.remove(e));
      pvEntities = [];
    }
    if (
      handler &&
      typeof handler.destroy === "function" &&
      (!handler.isDestroyed ||
        (typeof handler.isDestroyed === "function" && !handler.isDestroyed()))
    ) {
      handler.destroy();
    }

    // Clear info display at start
    infoDiv.innerHTML = "";

    handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Mouse move animation for width and length
    function updateTempLine(positions) {
      if (tempLineEntity) {
        viewer.entities.remove(tempLineEntity);
        tempLineEntity = null;
      }
      tempLineEntity = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 2,
          material: Color.YELLOW,
        },
      });
    }

    function updateTempRect(corners) {
      if (tempRectEntity) {
        viewer.entities.remove(tempRectEntity);
        tempRectEntity = null;
      }
      tempRectEntity = viewer.entities.add({
        polygon: {
          hierarchy: corners,
          material: Color.YELLOW.withAlpha(0.2),
          outline: true,
          outlineColor: Color.YELLOW,
        },
      });
    }

    function clearTempEntities() {
      if (tempLineEntity) {
        viewer.entities.remove(tempLineEntity);
        tempLineEntity = null;
      }
      if (tempRectEntity) {
        viewer.entities.remove(tempRectEntity);
        tempRectEntity = null;
      }
    }

    // Mouse move handler for animation
    const moveHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Click handler
    // --- Move helper functions to top of function scope ---
    // Remove PV helpers from here; will be redefined in ROI completion block
    // --- End move ---

    handler.setInputAction(function (click) {
      const cartesian = viewer.scene.pickPosition(click.position);
      if (!cartesian) {
        return;
      }
      const cartographic = Cartographic.fromCartesian(cartesian);
      if (!origin) {
        // First click: set origin
        origin = cartographic;
        // Enable width animation
        moveHandler.setInputAction(function (movement) {
          const moveCartesian = viewer.scene.pickPosition(movement.endPosition);
          if (!moveCartesian) {
            return;
          }
          updateTempLine([
            Cartesian3.fromRadians(
              origin.longitude,
              origin.latitude,
              origin.height,
            ),
            moveCartesian,
          ]);
        }, ScreenSpaceEventType.MOUSE_MOVE);
      } else if (!widthPoint) {
        // Second click: set width point
        widthPoint = cartographic;
        clearTempEntities();
        if (
          moveHandler &&
          typeof moveHandler.removeInputAction === "function" &&
          (!moveHandler.isDestroyed ||
            (typeof moveHandler.isDestroyed === "function" &&
              !moveHandler.isDestroyed()))
        ) {
          moveHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        }
        // Enable length animation (perpendicular)
        moveHandler.setInputAction(function (movement) {
          const moveCartesian = viewer.scene.pickPosition(movement.endPosition);
          if (!moveCartesian) {
            return;
          }
          // Calculate perpendicular direction
          const o = Cartesian3.fromRadians(
            origin.longitude,
            origin.latitude,
            origin.height,
          );
          const w = Cartesian3.fromRadians(
            widthPoint.longitude,
            widthPoint.latitude,
            widthPoint.height,
          );
          const m = moveCartesian;
          // Vector from origin to width
          const vWidth = Cartesian3.subtract(w, o, new Cartesian3());
          // Vector from origin to mouse
          const vMouse = Cartesian3.subtract(m, o, new Cartesian3());
          // Project vMouse onto vWidth to get the parallel component
          const vWidthNorm = Cartesian3.normalize(vWidth, new Cartesian3());
          const dot = Cartesian3.dot(vMouse, vWidthNorm);
          const vParallel = Cartesian3.multiplyByScalar(
            vWidthNorm,
            dot,
            new Cartesian3(),
          );
          // Perpendicular component
          const vPerp = Cartesian3.subtract(
            vMouse,
            vParallel,
            new Cartesian3(),
          );
          // Rectangle corners: origin, width, width+perp, origin+perp
          const c0 = o;
          const c1 = w;
          const c2 = Cartesian3.add(w, vPerp, new Cartesian3());
          const c3 = Cartesian3.add(o, vPerp, new Cartesian3());
          updateTempRect([c0, c1, c2, c3, c0]);
        }, ScreenSpaceEventType.MOUSE_MOVE);
      } else if (!lengthPoint) {
        // Third click: set length (perpendicular)
        lengthPoint = cartographic;
        clearTempEntities();
        moveHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        // Calculate perpendicular direction
        const o = Cartesian3.fromRadians(
          origin.longitude,
          origin.latitude,
          origin.height,
        );
        const w = Cartesian3.fromRadians(
          widthPoint.longitude,
          widthPoint.latitude,
          widthPoint.height,
        );
        const l = Cartesian3.fromRadians(
          lengthPoint.longitude,
          lengthPoint.latitude,
          lengthPoint.height,
        );
        const vWidth = Cartesian3.subtract(w, o, new Cartesian3());
        const vMouse = Cartesian3.subtract(l, o, new Cartesian3());
        const vWidthNorm = Cartesian3.normalize(vWidth, new Cartesian3());
        const dot = Cartesian3.dot(vMouse, vWidthNorm);
        const vParallel = Cartesian3.multiplyByScalar(
          vWidthNorm,
          dot,
          new Cartesian3(),
        );
        const vPerp = Cartesian3.subtract(vMouse, vParallel, new Cartesian3());
        // Rectangle corners
        const c0 = o;
        const c1 = w;
        const c2 = Cartesian3.add(w, vPerp, new Cartesian3());
        const c3 = Cartesian3.add(o, vPerp, new Cartesian3());
        rectangleEntity = viewer.entities.add({
          polygon: {
            hierarchy: [c0, c1, c2, c3, c0],
            material: Color.RED.withAlpha(0.3),
            outline: true,
            outlineColor: Color.RED,
          },
        });

        // Calculate and display width, length, and area
        // Width: distance from c0 to c1, Length: distance from c0 to c3
        const widthMeters = cartesianDistance(c0, c1);
        const lengthMeters = cartesianDistance(c0, c3);
        const areaSqMeters = widthMeters * lengthMeters;
        infoDiv.innerHTML =
          `<b>Width:</b> ${widthMeters.toFixed(2)} m<br>` +
          `<b>Length:</b> ${lengthMeters.toFixed(2)} m<br>` +
          `<b>Area:</b> ${areaSqMeters.toFixed(2)} m²`;

        // Show PV config UI
        pvConfigDiv.style.display = "flex";

        // --- PV helpers in ROI scope ---
        const clearPVEntities = () => {
          if (pvEntities.length > 0) {
            pvEntities.forEach((e) => viewer.entities.remove(e));
            pvEntities = [];
          }
        };
        const generatePVLayout = (rows, cols) => {
          clearPVEntities();
          // PV size in meters
          const pvWidth = 1.0;
          const pvLength = 1.7;
          // Rectangle basis vectors
          const o = c0;
          const w = c1;
          const l = c3;
          // Vector along width and length
          const vWidth = Cartesian3.subtract(w, o, new Cartesian3());
          const vLength = Cartesian3.subtract(l, o, new Cartesian3());
          // Normalize
          const vWidthNorm = Cartesian3.normalize(vWidth, new Cartesian3());
          const vLengthNorm = Cartesian3.normalize(vLength, new Cartesian3());
          // Total width/length in meters
          const totalWidth = cartesianDistance(c0, c1);
          const totalLength = cartesianDistance(c0, c3);
          // Spacing between PVs (no gap)
          const stepWidth = totalWidth / cols;
          const stepLength = totalLength / rows;
          // For each row/col, place a PV rectangle
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              // Cell origin
              const cellOrigin = Cartesian3.add(
                o,
                Cartesian3.add(
                  Cartesian3.multiplyByScalar(
                    vWidthNorm,
                    c * stepWidth,
                    new Cartesian3(),
                  ),
                  Cartesian3.multiplyByScalar(
                    vLengthNorm,
                    r * stepLength,
                    new Cartesian3(),
                  ),
                  new Cartesian3(),
                ),
                new Cartesian3(),
              );
              // PV corners (centered in cell)
              const pvCenter = Cartesian3.add(
                cellOrigin,
                Cartesian3.add(
                  Cartesian3.multiplyByScalar(
                    vWidthNorm,
                    stepWidth / 2,
                    new Cartesian3(),
                  ),
                  Cartesian3.multiplyByScalar(
                    vLengthNorm,
                    stepLength / 2,
                    new Cartesian3(),
                  ),
                  new Cartesian3(),
                ),
                new Cartesian3(),
              );
              // PV rectangle corners
              const halfW = pvWidth / 2;
              const halfL = pvLength / 2;
              // Four corners relative to center
              const corner1 = Cartesian3.add(
                pvCenter,
                Cartesian3.add(
                  Cartesian3.multiplyByScalar(
                    vWidthNorm,
                    -halfW,
                    new Cartesian3(),
                  ),
                  Cartesian3.multiplyByScalar(
                    vLengthNorm,
                    -halfL,
                    new Cartesian3(),
                  ),
                  new Cartesian3(),
                ),
                new Cartesian3(),
              );
              const corner2 = Cartesian3.add(
                pvCenter,
                Cartesian3.add(
                  Cartesian3.multiplyByScalar(
                    vWidthNorm,
                    halfW,
                    new Cartesian3(),
                  ),
                  Cartesian3.multiplyByScalar(
                    vLengthNorm,
                    -halfL,
                    new Cartesian3(),
                  ),
                  new Cartesian3(),
                ),
                new Cartesian3(),
              );
              const corner3 = Cartesian3.add(
                pvCenter,
                Cartesian3.add(
                  Cartesian3.multiplyByScalar(
                    vWidthNorm,
                    halfW,
                    new Cartesian3(),
                  ),
                  Cartesian3.multiplyByScalar(
                    vLengthNorm,
                    halfL,
                    new Cartesian3(),
                  ),
                  new Cartesian3(),
                ),
                new Cartesian3(),
              );
              const corner4 = Cartesian3.add(
                pvCenter,
                Cartesian3.add(
                  Cartesian3.multiplyByScalar(
                    vWidthNorm,
                    -halfW,
                    new Cartesian3(),
                  ),
                  Cartesian3.multiplyByScalar(
                    vLengthNorm,
                    halfL,
                    new Cartesian3(),
                  ),
                  new Cartesian3(),
                ),
                new Cartesian3(),
              );
              // Add PV entity
              const pvEntity = viewer.entities.add({
                polygon: {
                  hierarchy: [corner1, corner2, corner3, corner4, corner1],
                  material: Color.BLUE.withAlpha(0.7),
                  outline: true,
                  outlineColor: Color.BLACK,
                },
              });
              pvEntities.push(pvEntity);
            }
          }
        };
        const onPVInputChange = () => {
          const rows = Math.max(1, Number(rowInput.value));
          const cols = Math.max(1, Number(colInput.value));
          generatePVLayout(rows, cols);
        };
        // --- End PV helpers ---

        // Initial PV layout
        generatePVLayout(Number(rowInput.value), Number(colInput.value));

        // Update PV layout on input change
        rowInput.addEventListener("input", onPVInputChange);
        colInput.addEventListener("input", onPVInputChange);

        if (
          handler &&
          typeof handler.destroy === "function" &&
          (!handler.isDestroyed ||
            (typeof handler.isDestroyed === "function" &&
              !handler.isDestroyed()))
        ) {
          handler.destroy();
        }
        if (
          moveHandler &&
          typeof moveHandler.destroy === "function" &&
          (!moveHandler.isDestroyed ||
            (typeof moveHandler.isDestroyed === "function" &&
              !moveHandler.isDestroyed()))
        ) {
          moveHandler.destroy();
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  roiBtn.addEventListener("click", () => {
    // Hide PV config until ROI is set
    pvConfigDiv.style.display = "none";
    startDrawingRectangle();
  });

  return div;
}
