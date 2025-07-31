import designComponent from "./Design.js";
import simulationComponent from "./Simulation.js";
import monitorComponent from "./Monitor.js";
import controlComponent from "./Control.js";

// Create a modern horizontal toolbar with improved design
export function createToolbar() {
  // Create a wrapper to hold toolbar and content
  const wrapper = document.createElement("div");
  wrapper.className = "fixed top-6 left-6 z-50 max-w-4xl";

  // Create container div (toolbar)
  const container = document.createElement("div");
  container.className = "modern-card p-2 mb-4";

  // Toolbar button labels with icons
  const buttons = [
    { label: "Design", icon: "🎨" },
    { label: "Simulation", icon: "⚡" },
    { label: "Monitor", icon: "📊" },
    { label: "Control", icon: "🎮" },
  ];

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
    content.className = "modern-card p-6 fade-in";
    content.style.display = i === 0 ? "block" : "none";
    content.style.minHeight = "200px";
    content.style.maxWidth = "100%";
    // Render the component inside the content container
    content.appendChild(componentFn());
    return content;
  });

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "flex gap-2";

  // Create button wrappers and buttons
  buttons.forEach((buttonData, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "btn-modern flex items-center gap-2 min-w-[140px] justify-center";

    // Create icon span
    const iconSpan = document.createElement("span");
    iconSpan.textContent = buttonData.icon;
    iconSpan.className = "text-lg";

    // Create label span
    const labelSpan = document.createElement("span");
    labelSpan.textContent = buttonData.label;
    labelSpan.className = "font-semibold";

    btn.appendChild(iconSpan);
    btn.appendChild(labelSpan);

    // Add active state styling
    if (i === 0) {
      btn.classList.add("ring-2", "ring-blue-300");
    }

    btn.addEventListener("click", () => {
      // Update active button styling
      buttonContainer.querySelectorAll("button").forEach((b, idx) => {
        b.classList.remove("ring-2", "ring-blue-300");
        if (idx === i) {
          b.classList.add("ring-2", "ring-blue-300");
        }
      });

      // Show/hide content
      contentContainers.forEach((c, idx) => {
        c.style.display = idx === i ? "block" : "none";
      });
    });

    buttonContainer.appendChild(btn);
  });

  container.appendChild(buttonContainer);
  wrapper.appendChild(container);

  // Add content containers
  contentContainers.forEach((content) => {
    wrapper.appendChild(content);
  });

  document.body.appendChild(wrapper);
  return { toolbar: container, contents: contentContainers, wrapper };
}
