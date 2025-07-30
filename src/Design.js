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
  div.appendChild(roiBtn);

  function startDrawingRectangle() {
    const viewer = window._mainViewer;

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
    if (handler) {
      handler.destroy();
    }

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
        moveHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
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
        handler.destroy();
        moveHandler.destroy();
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  roiBtn.addEventListener("click", startDrawingRectangle);

  return div;
}
