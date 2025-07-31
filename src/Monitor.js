// Monitor component logic with modern design
export default function MonitorComponent() {
  const div = document.createElement("div");
  div.className = "space-y-6";

  // Header section
  const header = document.createElement("div");
  header.className = "text-center mb-6";
  const title = document.createElement("h2");
  title.textContent = "System Monitoring";
  title.className = "text-2xl font-bold text-gray-800 mb-2";
  const subtitle = document.createElement("p");
  subtitle.textContent = "Real-time monitoring and analytics dashboard";
  subtitle.className = "text-gray-600 text-sm";
  header.appendChild(title);
  header.appendChild(subtitle);
  div.appendChild(header);

  // Main content card
  const contentCard = document.createElement("div");
  contentCard.className = "modern-card p-6 text-center";

  const statusIcon = document.createElement("div");
  statusIcon.textContent = "📊";
  statusIcon.className = "text-6xl mb-4";

  const statusText = document.createElement("h3");
  statusText.textContent = "Monitoring Dashboard";
  statusText.className = "text-xl font-semibold text-gray-800 mb-2";

  const description = document.createElement("p");
  description.textContent =
    "Real-time system monitoring and performance analytics will be displayed here.";
  description.className = "text-gray-600 text-sm leading-relaxed";

  contentCard.appendChild(statusIcon);
  contentCard.appendChild(statusText);
  contentCard.appendChild(description);

  div.appendChild(contentCard);

  return div;
}
