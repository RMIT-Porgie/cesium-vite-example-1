import designComponent from "./Design.js";
import simulationComponent from "./Simulation.js";
import monitorComponent from "./Monitor.js";
import controlComponent from "./Control.js";

// Create a horizontal toolbar at the top left corner using Tailwind CSS
export function createToolbar() {
  // Create a wrapper to hold toolbar and content
  const wrapper = document.createElement("div");
  wrapper.className = "fixed top-4 left-4 z-50";

  // Create container div (toolbar)
  const container = document.createElement("div");
  container.className =
    "flex justify-between items-center gap-2 bg-transparent rounded shadow px-4 py-2";

  // Toolbar button labels
  const buttons = ["Design", "Simulation", "Monitor", "Control"];

  // Map each button to its component
  const components = [
    designComponent,
    simulationComponent,
    monitorComponent,
    controlComponent,
  ];

  // Create content containers for each button/component
  const contentContainers = components.map((componentFn, i) => {
    const content = document.createElement("div");
    content.className =
      "w-full max-w-2xl mx-auto mt-2 p-4 bg-white bg-opacity-80 rounded shadow border border-gray-200";
    content.style.display = i === 0 ? "block" : "none";
    // Render the component inside the content container
    content.appendChild(componentFn());
    return content;
  });

  // Create button wrappers and buttons
  buttons.forEach((label, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "flex-1";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className =
      "w-full min-w-[120px] px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400";
    btn.addEventListener("click", () => {
      contentContainers.forEach((c, idx) => {
        c.style.display = idx === i ? "block" : "none";
      });
    });
    wrapper.appendChild(btn);
    container.appendChild(wrapper);
  });

  wrapper.appendChild(container);
  contentContainers.forEach((content) => {
    wrapper.appendChild(content);
  });
  document.body.appendChild(wrapper);
  return { toolbar: container, contents: contentContainers, wrapper };
}
