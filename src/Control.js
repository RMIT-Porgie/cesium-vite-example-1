// Control component logic with modern design
export default function ControlComponent() {
  const div = document.createElement("div");
  div.className = "space-y-6";

  // Header section
  const header = document.createElement("div");
  header.className = "text-center mb-6";
  const title = document.createElement("h2");
  title.textContent = "System Control";
  title.className = "text-2xl font-bold text-gray-800 mb-2";
  const subtitle = document.createElement("p");
  subtitle.textContent = "Control and manage system operations";
  subtitle.className = "text-gray-600 text-sm";
  header.appendChild(title);
  header.appendChild(subtitle);
  div.appendChild(header);

  // Main control card
  const controlCard = document.createElement("div");
  controlCard.className = "modern-card p-6 text-center";

  const statusIcon = document.createElement("div");
  statusIcon.textContent = "🎮";
  statusIcon.className = "text-6xl mb-4";

  const statusText = document.createElement("h3");
  statusText.textContent = "Control Panel";
  statusText.className = "text-xl font-semibold text-gray-800 mb-2";

  const description = document.createElement("p");
  description.textContent =
    "System control and management interface will be available here.";
  description.className = "text-gray-600 text-sm leading-relaxed";

  controlCard.appendChild(statusIcon);
  controlCard.appendChild(statusText);
  controlCard.appendChild(description);

  div.appendChild(controlCard);

  return div;
}
