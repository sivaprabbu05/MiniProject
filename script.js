
"use strict";

// Smart Irrigation System - Frontend demonstration
// Priority formula matches IrrigationManager.java.

const CROP_RATES = {
  "Tomato": 1500,
  "Rice": 2000,
  "Paddy": 2000,
  "Vegetables": 1200,
  "Flower Plants": 1000,
  "Grass": 800,
  "Mango": 1800
};

const INITIAL_FIELDS = [
  { id: 1, name: "North Field", crop: "Tomato", area: 1.5, moisture: 22 },
  { id: 2, name: "Rice Field", crop: "Rice", area: 2, moisture: 48 },
  { id: 3, name: "Garden Zone", crop: "Flower Plants", area: 1, moisture: 18 },
  { id: 4, name: "Vegetable Farm", crop: "Vegetables", area: 1.5, moisture: 35 }
];

const INITIAL_WATER = 12000;

let fields = INITIAL_FIELDS.map(field => ({ ...field, running: false }));
let reservoir = INITIAL_WATER;
let nextId = 5;
let lastAllocation = null;

const $ = id => document.getElementById(id);

const number = value =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);

const litres = value => `${number(value)} L`;

function calculateRequirements() {
  fields.forEach(field => {
    field.rate = CROP_RATES[field.crop] ?? 1000;
    field.required = field.area * field.rate;
  });
}

function calculatePriorities() {
  const maxRequirement = Math.max(
    0,
    ...fields.map(field => field.required)
  );

  fields.forEach(field => {
    const moistureDeficit = 100 - field.moisture;
    const demandScore = maxRequirement > 0
      ? (field.required / maxRequirement) * 100
      : 0;

    field.priority =
      moistureDeficit * 0.70 + demandScore * 0.30;
  });

  return [...fields].sort((a, b) =>
    b.priority - a.priority || a.id - b.id
  );
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getFieldStatus(field) {
  if (field.running) return "Watering";
  if (field.moisture < 30) return "Critical";
  if (field.moisture < 40) return "Needs water";
  return "Healthy";
}

function renderFields() {
  const list = $("fieldList");

  list.innerHTML = fields.map(field => {
    const status = getFieldStatus(field);
    const low = field.moisture < 40;
    const disabled = reservoir <= 0 && !field.running;

    return `
      <div class="field-row">
        <div>
          <div class="field-name">${escapeHTML(field.name)}</div>
          <div class="field-detail">
            ${escapeHTML(field.crop)} · ${number(field.area)} acres
          </div>
          <div class="moisture-track">
            <div class="moisture-fill ${low ? "low" : ""}"
              style="width:${field.moisture}%"></div>
          </div>
          <span class="state-pill ${low ? "low" : ""}">
            ${status}
          </span>
        </div>
        <div>
          <div class="moisture-number">${field.moisture}%</div>
          <div class="field-detail">Moisture</div>
        </div>
        <div class="field-actions">
          <button class="mini-btn" data-toggle="${field.id}"
            ${disabled ? "disabled" : ""}>
            ${field.running ? "Stop" : "Water"}
          </button>
          <button class="mini-btn" data-remove="${field.id}"
            aria-label="Remove ${escapeHTML(field.name)}">
            Remove
          </button>
        </div>
      </div>`;
  }).join("");

  list.querySelectorAll("[data-toggle]").forEach(button => {
    button.addEventListener("click", () =>
      toggleWatering(Number(button.dataset.toggle))
    );
  });

  list.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () =>
      removeField(Number(button.dataset.remove))
    );
  });
}

function renderPriorities() {
  const ordered = calculatePriorities();

  $("priorityList").innerHTML = ordered.map((field, index) => `
    <div class="queue-row">
      <div class="queue-rank ${index === 0 ? "first" : ""}">
        ${String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <div class="queue-name">${escapeHTML(field.name)}</div>
        <div class="queue-detail">
          ${field.moisture}% moisture · ${litres(field.required)} required
        </div>
      </div>
      <div class="queue-score">
        ${field.priority.toFixed(1)}
        <small>Priority score</small>
      </div>
    </div>
  `).join("") || `<p class="muted">Add a field to see priorities.</p>`;
}

function renderStats() {
  const average = fields.length
    ? fields.reduce((sum, field) => sum + field.moisture, 0) / fields.length
    : 0;

  $("fieldCount").textContent = fields.length;
  $("avgMoisture").textContent = `${Math.round(average)}%`;
  $("waterAvailable").innerHTML = `${number(reservoir)} <small>L</small>`;
  $("attentionCount").textContent =
    fields.filter(field => field.moisture < 40).length;
}

function renderWater() {
  const initialWater = Math.max(INITIAL_WATER, reservoir);
  const percent = initialWater > 0
    ? Math.min(100, (reservoir / initialWater) * 100)
    : 0;

  $("reservoirValue").textContent = number(reservoir);
  $("reservoirBar").style.width = `${percent}%`;
  $("reservoirCaption").textContent =
    `${Math.round(percent)}% of reference water remaining`;

  if (!lastAllocation) {
    $("totalDemand").textContent = litres(
      fields.reduce((sum, field) => sum + field.required, 0)
    );
    $("totalAllocated").textContent = "Not calculated";
    $("remainingWater").textContent = "—";
    $("fullyWatered").textContent = "—";
  } else {
    $("totalDemand").textContent = litres(lastAllocation.demand);
    $("totalAllocated").textContent = litres(lastAllocation.allocated);
    $("remainingWater").textContent = litres(lastAllocation.remaining);
    $("fullyWatered").textContent =
      `${lastAllocation.fullyWatered} / ${fields.length}`;
  }
}

function renderAll() {
  calculateRequirements();
  renderStats();
  renderFields();
  renderPriorities();
  renderWater();
}

function allocateWater() {
  const input = $("waterInput");
  const available = Number(input.value);

  if (!Number.isFinite(available) || available < 0 || available > 1e9) {
    $("allocationMessage").textContent =
      "Enter a valid water quantity between 0 and 1,000,000,000 litres.";
    return;
  }

  // Use the Java PriorityQueue-style ordering:
  // highest priority score first.
  let remaining = available;
  let totalAllocated = 0;
  let fullyWatered = 0;

  const ordered = calculatePriorities();

  ordered.forEach(field => {
    const allocated = Math.min(remaining, field.required);
    field.allocated = allocated;
    remaining = Math.max(0, remaining - allocated);
    totalAllocated += allocated;

    if (allocated >= field.required) {
      fullyWatered++;
    }
  });

  reservoir = Math.max(0, remaining);

  lastAllocation = {
    demand: fields.reduce((sum, field) => sum + field.required, 0),
    allocated: totalAllocated,
    remaining,
    fullyWatered
  };

  renderAll();

  $("allocationMessage").textContent =
    `Allocation complete: ${litres(totalAllocated)} distributed. ` +
    `${litres(remaining)} remains.`;

  // Make the displayed reservoir the current remainder.
  $("waterInput").value = reservoir;
}

function toggleWatering(id) {
  const field = fields.find(item => item.id === id);
  if (!field) return;

  if (!field.running) {
    if (reservoir <= 0) {
      $("allocationMessage").textContent =
        "The reservoir is empty. Reset the demo or enter more water.";
      return;
    }

    field.running = true;
    $("allocationMessage").textContent =
      `${field.name}: demo watering started. No physical pump is connected.`;
  } else {
    field.running = false;

    // Simulate a sensor reading changing after watering.
    field.moisture = Math.min(100, field.moisture + 10);

    $("allocationMessage").textContent =
      `${field.name}: demo watering stopped. Moisture increased by 10 points.`;
  }

  // The start/stop controls simulate operation; they do not
  // physically consume reservoir water or actuate hardware.
  renderAll();
}

function removeField(id) {
  const field = fields.find(item => item.id === id);
  if (!field) return;

  if (!confirm(`Remove "${field.name}" from the demo dashboard?`)) {
    return;
  }

  fields = fields.filter(item => item.id !== id);
  lastAllocation = null;
  renderAll();
  $("allocationMessage").textContent =
    `${field.name} removed from the dashboard.`;
}

function addField(event) {
  event.preventDefault();

  const name = $("fieldName").value.trim();
  const crop = $("cropName").value;
  const area = Number($("fieldArea").value);
  const moisture = Number($("fieldMoisture").value);

  if (!name || !Number.isFinite(area) || area <= 0 ||
      !Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
    $("allocationMessage").textContent =
      "Please enter valid field details.";
    return;
  }

  fields.push({
    id: nextId++,
    name,
    crop,
    area,
    moisture,
    running: false
  });

  lastAllocation = null;
  $("fieldForm").reset();
  $("fieldArea").value = 1;
  $("fieldMoisture").value = 25;
  $("fieldDialog").close();

  renderAll();
  $("allocationMessage").textContent =
    `${name} added successfully to the demo dashboard.`;
}

function resetDemo() {
  fields = INITIAL_FIELDS.map(field => ({
    ...field,
    running: false
  }));

  reservoir = INITIAL_WATER;
  nextId = 5;
  lastAllocation = null;
  $("waterInput").value = INITIAL_WATER;

  renderAll();
  $("allocationMessage").textContent =
    "Demo reset. Original sample fields and water restored.";
}

// Event listeners
$("allocateBtn").addEventListener("click", allocateWater);
$("resetBtn").addEventListener("click", resetDemo);
$("addFieldBtn").addEventListener("click", () =>
  $("fieldDialog").showModal()
);
$("closeDialog").addEventListener("click", () =>
  $("fieldDialog").close()
);
$("fieldForm").addEventListener("submit", addField);

// Sidebar navigation highlighting
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item =>
      item.classList.remove("active")
    );
    link.classList.add("active");
  });
});

// Start the dashboard
renderAll();
