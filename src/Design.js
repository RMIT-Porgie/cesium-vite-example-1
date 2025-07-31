// Design component logic with Cesium and Tailwind
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Color,
  Cartographic,
  Cartesian3,
  Matrix3,
  Quaternion,
} from "cesium";

export default function DesignComponent() {
  // Use the global Cesium viewer from main.js
  let rectangleEntity = null;
  let handler = null;

  // Modern UI setup with improved layout
  const div = document.createElement("div");
  div.className = "space-y-6";

  // Header section
  const header = document.createElement("div");
  header.className = "text-center mb-6";
  const title = document.createElement("h2");
  title.textContent = "Solar Panel Design";
  title.className = "text-2xl font-bold text-gray-800 mb-2";
  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Define your region of interest and configure solar panel layout";
  subtitle.className = "text-gray-600";
  header.appendChild(title);
  header.appendChild(subtitle);
  div.appendChild(header);

  // ROI Button with modern styling
  const roiBtn = document.createElement("button");
  roiBtn.textContent = "🎯 Define Region of Interest";
  roiBtn.className = "btn-modern w-full mb-6";

  // Info display for width, length, area with modern card
  const infoCard = document.createElement("div");
  infoCard.className = "modern-card p-4 mb-4";
  const infoTitle = document.createElement("h3");
  infoTitle.textContent = "Region Specifications";
  infoTitle.className = "text-lg font-semibold text-gray-800 mb-3";
  infoCard.appendChild(infoTitle);

  const infoDiv = document.createElement("div");
  infoDiv.className = "grid grid-cols-3 gap-4 text-sm";
  infoCard.appendChild(infoDiv);

  div.appendChild(infoCard);
  div.appendChild(roiBtn);

  // PV array configuration UI with modern styling
  const pvConfigCard = document.createElement("div");
  pvConfigCard.className = "modern-card p-4";
  pvConfigCard.style.display = "none";

  const pvTitle = document.createElement("h3");
  pvTitle.textContent = "Solar Panel Configuration";
  pvTitle.className = "text-lg font-semibold text-gray-800 mb-4";
  pvConfigCard.appendChild(pvTitle);

  const pvConfigDiv = document.createElement("div");
  pvConfigDiv.className = "space-y-4";

  // Input groups
  const inputGroup1 = document.createElement("div");
  inputGroup1.className = "grid grid-cols-2 gap-4";

  const rowGroup = document.createElement("div");
  const rowLabel = document.createElement("label");
  rowLabel.textContent = "Rows";
  rowLabel.className = "label-modern block";
  const rowInput = document.createElement("input");
  rowInput.type = "number";
  rowInput.min = 1;
  rowInput.value = 2;
  rowInput.className = "input-modern w-full";
  rowGroup.appendChild(rowLabel);
  rowGroup.appendChild(rowInput);

  const colGroup = document.createElement("div");
  const colLabel = document.createElement("label");
  colLabel.textContent = "Columns";
  colLabel.className = "label-modern block";
  const colInput = document.createElement("input");
  colInput.type = "number";
  colInput.min = 1;
  colInput.value = 2;
  colInput.className = "input-modern w-full";
  colGroup.appendChild(colLabel);
  colGroup.appendChild(colInput);

  inputGroup1.appendChild(rowGroup);
  inputGroup1.appendChild(colGroup);

  const heightGroup = document.createElement("div");
  const heightLabel = document.createElement("label");
  heightLabel.textContent = "Panel Height (meters)";
  heightLabel.className = "label-modern block";
  const heightInput = document.createElement("input");
  heightInput.type = "number";
  heightInput.min = 0;
  heightInput.step = 0.1;
  heightInput.value = 3;
  heightInput.className = "input-modern w-full";
  heightGroup.appendChild(heightLabel);
  heightGroup.appendChild(heightInput);

  pvConfigDiv.appendChild(inputGroup1);
  pvConfigDiv.appendChild(heightGroup);

  // Export buttons section
  const exportSection = document.createElement("div");
  exportSection.className = "border-t pt-4 mt-4";
  const exportTitle = document.createElement("h4");
  exportTitle.textContent = "Export Options";
  exportTitle.className = "text-md font-semibold text-gray-700 mb-3";
  exportSection.appendChild(exportTitle);

  const exportButtons = document.createElement("div");
  exportButtons.className = "flex gap-3";
  exportSection.appendChild(exportButtons);

  pvConfigCard.appendChild(pvConfigDiv);
  pvConfigCard.appendChild(exportSection);
  div.appendChild(pvConfigCard);

  // Store PV rectangles for cleanup
  let pvEntities = [];

  // Store current ROI corners for export functions
  let currentCorners = null;

  // Helper function for distance between two Cartesian3 points
  function cartesianDistance(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2),
    );
  }

  // Export functions moved to root level
  function exportROIToOBJ(corners) {
    if (!corners || corners.length < 4) {
      console.error("No valid ROI corners provided");
      return;
    }

    const [c0, c1, c2, c3] = corners;

    // Create a local flat coordinate system based on the ROI
    const roiCenter = Cartesian3.lerp(c0, c2, 0.5, new Cartesian3());
    const roiCenterCarto = Cartographic.fromCartesian(roiCenter);

    // Create local coordinate system at terrain height
    const localOrigin = Cartesian3.fromRadians(
      roiCenterCarto.longitude,
      roiCenterCarto.latitude,
      roiCenterCarto.height,
    );

    // Local axes based on ROI orientation
    const vWidth = Cartesian3.subtract(c1, c0, new Cartesian3());
    const vLength = Cartesian3.subtract(c3, c0, new Cartesian3());
    const vWidthNorm = Cartesian3.normalize(vWidth, new Cartesian3());
    const vLengthNorm = Cartesian3.normalize(vLength, new Cartesian3());

    // Ensure Z points up (perpendicular to the ground plane)
    const upVec = Cartesian3.normalize(
      Cartesian3.cross(vLengthNorm, vWidthNorm, new Cartesian3()),
      new Cartesian3(),
    );

    // Re-orthogonalize length vector
    const orthoLengthVec = Cartesian3.cross(
      upVec,
      vWidthNorm,
      new Cartesian3(),
    );

    // Function to convert global coordinates to local flat coordinates
    const toLocalCoords = (globalPos) => {
      const localPos = Cartesian3.subtract(
        globalPos,
        localOrigin,
        new Cartesian3(),
      );
      return {
        x: Cartesian3.dot(localPos, vWidthNorm),
        y: Cartesian3.dot(localPos, orthoLengthVec),
        z: Cartesian3.dot(localPos, upVec),
      };
    };

    // Export ROI as a closed box
    let obj = "";

    // ROI height for the box
    const roiHeight = 1.0; // 1 meter height

    // Top face vertices (at ground level)
    const top1 = c0;
    const top2 = c1;
    const top3 = c2;
    const top4 = c3;

    // Bottom face vertices (offset by height in upVec)
    const heightVec = Cartesian3.multiplyByScalar(
      upVec,
      roiHeight,
      new Cartesian3(),
    );
    const bottom1 = Cartesian3.add(c0, heightVec, new Cartesian3());
    const bottom2 = Cartesian3.add(c1, heightVec, new Cartesian3());
    const bottom3 = Cartesian3.add(c2, heightVec, new Cartesian3());
    const bottom4 = Cartesian3.add(c3, heightVec, new Cartesian3());

    // Convert to local coordinates and add vertices
    const localTop1 = toLocalCoords(top1);
    const localTop2 = toLocalCoords(top2);
    const localTop3 = toLocalCoords(top3);
    const localTop4 = toLocalCoords(top4);
    const localBottom1 = toLocalCoords(bottom1);
    const localBottom2 = toLocalCoords(bottom2);
    const localBottom3 = toLocalCoords(bottom3);
    const localBottom4 = toLocalCoords(bottom4);

    // Write vertices (top face first, then bottom face)
    obj += `v ${localTop1.x.toFixed(6)} ${localTop1.y.toFixed(6)} ${localTop1.z.toFixed(6)}\n`;
    obj += `v ${localTop2.x.toFixed(6)} ${localTop2.y.toFixed(6)} ${localTop2.z.toFixed(6)}\n`;
    obj += `v ${localTop3.x.toFixed(6)} ${localTop3.y.toFixed(6)} ${localTop3.z.toFixed(6)}\n`;
    obj += `v ${localTop4.x.toFixed(6)} ${localTop4.y.toFixed(6)} ${localTop4.z.toFixed(6)}\n`;
    obj += `v ${localBottom1.x.toFixed(6)} ${localBottom1.y.toFixed(6)} ${localBottom1.z.toFixed(6)}\n`;
    obj += `v ${localBottom2.x.toFixed(6)} ${localBottom2.y.toFixed(6)} ${localBottom2.z.toFixed(6)}\n`;
    obj += `v ${localBottom3.x.toFixed(6)} ${localBottom3.y.toFixed(6)} ${localBottom3.z.toFixed(6)}\n`;
    obj += `v ${localBottom4.x.toFixed(6)} ${localBottom4.y.toFixed(6)} ${localBottom4.z.toFixed(6)}\n`;

    // Write faces (OBJ is 1-indexed)
    // Top face: 1-2-3-4
    obj += `f 1 2 3 4\n`;
    // Bottom face: 5-6-7-8
    obj += `f 5 6 7 8\n`;
    // Sides
    obj += `f 1 2 6 5\n`;
    obj += `f 2 3 7 6\n`;
    obj += `f 3 4 8 7\n`;
    obj += `f 4 1 5 8\n`;

    // Download
    const blob = new Blob([obj], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "roi.obj";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportSolarPanelsToOBJ(corners) {
    if (!corners || corners.length < 4) {
      console.error("No valid ROI corners provided");
      return;
    }

    const [c0, c1, c2, c3] = corners;

    // Create a local flat coordinate system based on the ROI
    const roiCenter = Cartesian3.lerp(c0, c2, 0.5, new Cartesian3());
    const roiCenterCarto = Cartographic.fromCartesian(roiCenter);
    // Create local coordinate system at terrain height
    const localOrigin = Cartesian3.fromRadians(
      roiCenterCarto.longitude,
      roiCenterCarto.latitude,
      roiCenterCarto.height,
    );

    // Local axes based on ROI orientation
    const vWidth = Cartesian3.subtract(c1, c0, new Cartesian3());
    const vLength = Cartesian3.subtract(c3, c0, new Cartesian3());
    const vWidthNorm = Cartesian3.normalize(vWidth, new Cartesian3());
    const vLengthNorm = Cartesian3.normalize(vLength, new Cartesian3());

    // Ensure Z points up (perpendicular to the ground plane)
    const upVec = Cartesian3.normalize(
      Cartesian3.cross(vLengthNorm, vWidthNorm, new Cartesian3()),
      new Cartesian3(),
    );

    // Re-orthogonalize length vector
    const orthoLengthVec = Cartesian3.cross(
      upVec,
      vWidthNorm,
      new Cartesian3(),
    );

    // Function to convert global coordinates to local flat coordinates
    const toLocalCoords = (globalPos) => {
      const localPos = Cartesian3.subtract(
        globalPos,
        localOrigin,
        new Cartesian3(),
      );
      return {
        x: Cartesian3.dot(localPos, vWidthNorm),
        y: Cartesian3.dot(localPos, orthoLengthVec),
        z: Cartesian3.dot(localPos, upVec),
      };
    };

    // Panel rectangle size (meters)
    const panelWidth = 2; // width along ROI width axis
    const panelLength = 1; // length along ROI length axis

    // Get current PV configuration
    const rows = parseInt(rowInput.value);
    const cols = parseInt(colInput.value);
    const panelHeight = parseFloat(heightInput.value);

    // Calculate panel layout
    const totalWidth = cartesianDistance(c0, c1);
    const totalLength = cartesianDistance(c0, c3);

    // Calculate spacing
    const availableWidth = totalWidth - panelWidth;
    const availableLength = totalLength - panelLength;
    const spacingWidth = cols > 1 ? availableWidth / (cols - 1) : 0;
    const spacingLength = rows > 1 ? availableLength / (rows - 1) : 0;

    // Generate OBJ content
    let obj = "";
    let vertexIndex = 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Calculate panel center in local coordinates
        const localX = col * spacingWidth + panelWidth / 2;
        const localY = row * spacingLength + panelLength / 2;

        // Convert to global coordinates
        const localPos = Cartesian3.add(
          localOrigin,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(vWidthNorm, localX, new Cartesian3()),
            Cartesian3.multiplyByScalar(
              orthoLengthVec,
              localY,
              new Cartesian3(),
            ),
            new Cartesian3(),
          ),
          new Cartesian3(),
        );

        // Panel corners in global coordinates
        const panelHalfWidth = panelWidth / 2;
        const panelHalfLength = panelLength / 2;

        const panelC0 = Cartesian3.add(
          localPos,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(
              vWidthNorm,
              -panelHalfWidth,
              new Cartesian3(),
            ),
            Cartesian3.multiplyByScalar(
              orthoLengthVec,
              -panelHalfLength,
              new Cartesian3(),
            ),
            new Cartesian3(),
          ),
          new Cartesian3(),
        );

        const panelC1 = Cartesian3.add(
          localPos,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(
              vWidthNorm,
              panelHalfWidth,
              new Cartesian3(),
            ),
            Cartesian3.multiplyByScalar(
              orthoLengthVec,
              -panelHalfLength,
              new Cartesian3(),
            ),
            new Cartesian3(),
          ),
          new Cartesian3(),
        );

        const panelC2 = Cartesian3.add(
          localPos,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(
              vWidthNorm,
              panelHalfWidth,
              new Cartesian3(),
            ),
            Cartesian3.multiplyByScalar(
              orthoLengthVec,
              panelHalfLength,
              new Cartesian3(),
            ),
            new Cartesian3(),
          ),
          new Cartesian3(),
        );

        const panelC3 = Cartesian3.add(
          localPos,
          Cartesian3.add(
            Cartesian3.multiplyByScalar(
              vWidthNorm,
              -panelHalfWidth,
              new Cartesian3(),
            ),
            Cartesian3.multiplyByScalar(
              orthoLengthVec,
              panelHalfLength,
              new Cartesian3(),
            ),
            new Cartesian3(),
          ),
          new Cartesian3(),
        );

        // Top face vertices (at ground level)
        const top1 = panelC0;
        const top2 = panelC1;
        const top3 = panelC2;
        const top4 = panelC3;

        // Bottom face vertices (offset by height in upVec)
        const heightVec = Cartesian3.multiplyByScalar(
          upVec,
          panelHeight,
          new Cartesian3(),
        );
        const bottom1 = Cartesian3.add(panelC0, heightVec, new Cartesian3());
        const bottom2 = Cartesian3.add(panelC1, heightVec, new Cartesian3());
        const bottom3 = Cartesian3.add(panelC2, heightVec, new Cartesian3());
        const bottom4 = Cartesian3.add(panelC3, heightVec, new Cartesian3());

        // Convert to local coordinates and add vertices
        const localTop1 = toLocalCoords(top1);
        const localTop2 = toLocalCoords(top2);
        const localTop3 = toLocalCoords(top3);
        const localTop4 = toLocalCoords(top4);
        const localBottom1 = toLocalCoords(bottom1);
        const localBottom2 = toLocalCoords(bottom2);
        const localBottom3 = toLocalCoords(bottom3);
        const localBottom4 = toLocalCoords(bottom4);

        // Write vertices (top face first, then bottom face)
        obj += `v ${localTop1.x.toFixed(6)} ${localTop1.y.toFixed(6)} ${localTop1.z.toFixed(6)}\n`;
        obj += `v ${localTop2.x.toFixed(6)} ${localTop2.y.toFixed(6)} ${localTop2.z.toFixed(6)}\n`;
        obj += `v ${localTop3.x.toFixed(6)} ${localTop3.y.toFixed(6)} ${localTop3.z.toFixed(6)}\n`;
        obj += `v ${localTop4.x.toFixed(6)} ${localTop4.y.toFixed(6)} ${localTop4.z.toFixed(6)}\n`;
        obj += `v ${localBottom1.x.toFixed(6)} ${localBottom1.y.toFixed(6)} ${localBottom1.z.toFixed(6)}\n`;
        obj += `v ${localBottom2.x.toFixed(6)} ${localBottom2.y.toFixed(6)} ${localBottom2.z.toFixed(6)}\n`;
        obj += `v ${localBottom3.x.toFixed(6)} ${localBottom3.y.toFixed(6)} ${localBottom3.z.toFixed(6)}\n`;
        obj += `v ${localBottom4.x.toFixed(6)} ${localBottom4.y.toFixed(6)} ${localBottom4.z.toFixed(6)}\n`;

        // Write faces (OBJ is 1-indexed)
        // Top face: 1-2-3-4
        obj += `f ${vertexIndex} ${vertexIndex + 1} ${vertexIndex + 2} ${vertexIndex + 3}\n`;
        // Bottom face: 5-6-7-8
        obj += `f ${vertexIndex + 4} ${vertexIndex + 5} ${vertexIndex + 6} ${vertexIndex + 7}\n`;
        // Sides
        obj += `f ${vertexIndex} ${vertexIndex + 1} ${vertexIndex + 5} ${vertexIndex + 4}\n`;
        obj += `f ${vertexIndex + 1} ${vertexIndex + 2} ${vertexIndex + 6} ${vertexIndex + 5}\n`;
        obj += `f ${vertexIndex + 2} ${vertexIndex + 3} ${vertexIndex + 7} ${vertexIndex + 6}\n`;
        obj += `f ${vertexIndex + 3} ${vertexIndex} ${vertexIndex + 4} ${vertexIndex + 7}\n`;

        vertexIndex += 8;
      }
    }

    // Download
    const blob = new Blob([obj], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "solar_panels.obj";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function startDrawingRectangle() {
    const viewer = window._mainViewer;

    // Rectangle drawing with 3 clicks: origin, width, length (perpendicular)
    let origin = null;
    let widthPoint = null;
    let lengthPoint = null;
    let tempLineEntity = null;
    let tempRectEntity = null;

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
            material: Color.WHITE.withAlpha(0.5),
            outline: true,
            outlineColor: Color.WHITE,
          },
        });

        const widthVec = Cartesian3.normalize(
          Cartesian3.subtract(c1, c0, new Cartesian3()),
          new Cartesian3(),
        );
        const lengthVec = Cartesian3.normalize(
          Cartesian3.subtract(c3, c0, new Cartesian3()),
          new Cartesian3(),
        );
        // Use correct cross product order: widthVec × lengthVec to ensure Z points up
        const upVec = Cartesian3.normalize(
          Cartesian3.cross(widthVec, lengthVec, new Cartesian3()),
          new Cartesian3(),
        );
        // Re-orthogonalize lengthVec to ensure it's perpendicular to widthVec and upVec
        const orthoLengthVec = Cartesian3.cross(
          upVec,
          widthVec,
          new Cartesian3(),
        );
        // Cesium's Matrix3 constructor is column-major: [x, y, z] axes as columns
        const rectRotationMatrix = new Matrix3(
          widthVec.x,
          orthoLengthVec.x,
          upVec.x,
          widthVec.y,
          orthoLengthVec.y,
          upVec.y,
          widthVec.z,
          orthoLengthVec.z,
          upVec.z,
        );
        const rectOrientation = Quaternion.fromRotationMatrix(
          rectRotationMatrix,
          new Quaternion(),
        );

        // Calculate and display width, length, and area
        // Width: distance from c0 to c1, Length: distance from c0 to c3
        const widthMeters = cartesianDistance(c0, c1);
        const lengthMeters = cartesianDistance(c0, c3);
        const areaSqMeters = widthMeters * lengthMeters;

        // Update info display with modern styling
        infoDiv.innerHTML = `
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${widthMeters.toFixed(2)}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Width (m)</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${lengthMeters.toFixed(2)}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Length (m)</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">${areaSqMeters.toFixed(2)}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Area (m²)</div>
          </div>
        `;

        // Show PV config UI
        pvConfigCard.style.display = "block";

        // --- Export OBJ logic ---
        // Add export buttons for ROI and solar panels separately
        let exportRoiBtn = exportButtons.querySelector(".export-roi-btn");
        let exportPanelsBtn = exportButtons.querySelector(".export-panels-btn");

        if (!exportRoiBtn) {
          exportRoiBtn = document.createElement("button");
          exportRoiBtn.textContent = "📦 Export ROI";
          exportRoiBtn.className = "export-roi-btn btn-modern flex-1";
          exportButtons.appendChild(exportRoiBtn);
        }
        exportRoiBtn.style.display = "inline-block";

        if (!exportPanelsBtn) {
          exportPanelsBtn = document.createElement("button");
          exportPanelsBtn.textContent = "☀️ Export Solar Panels";
          exportPanelsBtn.className = "export-panels-btn btn-modern flex-1";
          exportButtons.appendChild(exportPanelsBtn);
        }
        exportPanelsBtn.style.display = "inline-block";

        // Store current ROI corners for export functions
        currentCorners = [c0, c1, c2, c3];

        // Set up export button click handlers
        exportRoiBtn.onclick = () => exportROIToOBJ(currentCorners);
        exportPanelsBtn.onclick = () => exportSolarPanelsToOBJ(currentCorners);

        // --- PV helpers in ROI scope ---
        const clearPVEntities = () => {
          if (pvEntities.length > 0) {
            pvEntities.forEach((e) => viewer.entities.remove(e));
            pvEntities = [];
          }
        };

        const generatePVLayout = (rows, cols) => {
          clearPVEntities();
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
          // Path to glTF model (relative to public or src)
          const gltfUrl = "./asset/solar_panel (1)/scene.gltf";
          // For each row/col, place a PV model
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
              // PV center
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
              // Get PV height input (default 3)
              const pvHeight = Number(heightInput.value) || 3;
              // Place at ground + pvHeight
              const pvCenterCarto = Cartographic.fromCartesian(pvCenter);
              const baseHeight = (pvCenterCarto.height || 0) + pvHeight;
              pvCenterCarto.height = baseHeight;
              const pvCart = Cartesian3.fromRadians(
                pvCenterCarto.longitude,
                pvCenterCarto.latitude,
                pvCenterCarto.height,
              );
              // Add model entity
              const pvEntity = viewer.entities.add({
                name: "Solar Panel",
                position: pvCart,
                orientation: rectOrientation, // Use rectangle ROI orientation for all PVs
                model: {
                  uri: gltfUrl,
                  scale: 1.0, // Fixed scale for consistent PV size
                  maximumScale: 10,
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

        // Update PV layout on input change
        rowInput.addEventListener("input", onPVInputChange);
        colInput.addEventListener("input", onPVInputChange);

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
    pvConfigCard.style.display = "none";
    startDrawingRectangle();
  });

  return div;
}
