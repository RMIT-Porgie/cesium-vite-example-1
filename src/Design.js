// Design component logic with Cesium and Tailwind
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Rectangle,
  RectangleGraphics,
  Color,
  Cartographic,
} from "cesium";

export default function DesignComponent() {
  // Use the global Cesium viewer from main.js
  let firstCorner = null;
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

    firstCorner = null;
    if (rectangleEntity) {
      viewer.entities.remove(rectangleEntity);
      rectangleEntity = null;
    }
    if (handler) {
      handler.destroy();
    }
    handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (click) {
      const cartesian = viewer.scene.pickPosition(click.position);
      if (!cartesian) {
        return;
      }
      const cartographic = Cartographic.fromCartesian(cartesian);
      if (!firstCorner) {
        firstCorner = cartographic;
      } else {
        // Second corner, create rectangle
        const rect = Rectangle.fromCartographicArray([
          firstCorner,
          cartographic,
        ]);
        rectangleEntity = viewer.entities.add({
          rectangle: new RectangleGraphics({
            coordinates: rect,
            material: Color.RED.withAlpha(0.3),
            outline: true,
            outlineColor: Color.RED,
          }),
        });
        handler.destroy();
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  roiBtn.addEventListener("click", startDrawingRectangle);

  return div;
}
