
"use strict";

// AgriFlow - Smart Irrigation System
// Frontend demonstration using JavaScript.

// Default water requirements in litres per acre.
// These are illustrative values, not agronomic recommendations.
const CROP_RATES = {
  tomato: 1500,
  rice: 2000,
  paddy: 2000,
  wheat: 1200,
  banana: 1800,
  coconut: 1600,
  sugarcane: 2200,
  vegetables: 1200,
  "flower plants": 1000,
  grass: 800,
  mango: 1800
};

const INITIAL_FIELDS = [
  {
    id: 1,
    name: "North Field",
    crop: "Tomato",
    area: 1.5,
    moisture: 22
  },
  {
    id: 2,
    name: "Rice Field",
    crop: "Rice",
    area: 2,
    moisture: 48
  },
  {
    id: 3,
    name: "Garden Zone",
    crop: "Flower Plants",
    area: 1,
    moisture: 18
  },
  {
    id: 4,
    name: "Vegetable Farm",
    crop: "Vegetables",
    area: 1.5,
    moisture: 35
  }
];

const INITIAL_WATER = 12000;

let fields = INITIAL_FIELDS.map(field => ({
  ...field,
  rate: CROP_RATES[field.crop.toLowerCase()],
  running: false
}));

let reservoir = INITIAL_WATER;
let nextId = 5;
let lastAllocation = null;

// Shortcut for accessing HTML elements.
const $ = id => document.getElementById(id);

// Format numbers using Indian number formatting.
const number = value =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1
  }).format(value);

const litres = value => `${number(value)} L`;

// Prevent user-entered text from becoming HTML.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Calculate each field's water requirement.
function calculateRequirements() {
  fields.forEach(field => {
    field.required = field.area * field.rate;
  });
}

// Calculate irrigation priority.
// Higher score means higher priority.
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
      moistureDeficit * 0.70 +
      demandScore * 0.30;
  });

  // PriorityQueue-style ordering:
  // Highest priority first.
  return [...fields].sort(
    (a, b) =>
      b.priority - a.priority ||
      a.id - b.id
  );
}

// Determine field condition.
function getFieldStatus(field) {
  if (field.running) return "Watering";
  if (field.moisture < 30) return "Critical";
  if (field.moisture < 40) return "Needs water";
  return "Healthy";
}

// Render the field monitoring section.
function renderFields() {
  const list = $("fieldList");

  if (fields.length === 0) {
    list.innerHTML =
      '<p class="muted">No fields available. Add a field to begin.</p>';
    return;
  }

  list.innerHTML = fields.map(field => {
    const status = getFieldStatus(field);
    const low = field.moisture < 40;

    return `
      <div class="field-row">
        <div>
          <div class="field-name">
            ${escapeHTML(field.name)}
          </div>

          <div class="field-detail">
            ${escapeHTML(field.crop)} ·
            ${number(field.area)} acres
          </div>

          <div class="field-detail">
            Demand: ${litres(field.required)}
          </div>

          <div class="moisture-track">
            <div
              class="moisture-fill ${low ? "low" : ""}"
              style="width:${field.moisture}%">
            </div>
          </div>

          <span class="state-pill ${low ? "low" : ""}">
            ${status}
          </span>
        </div>

        <div>
          <div class="moisture-number">
            ${field.moisture}%
          </div>
          <div class="field-detail">Moisture</div>
        </div>

        <div class="field-actions">
          <button
            class="mini-btn"
            data-toggle="${field.id}"
            ${reservoir <= 0 && !field.running ? "disabled" : ""}>
            ${field.running ? "Stop" : "Water"}
          </button>

          <button
            class="mini-btn"
            data-remove="${field.id}"
            aria-label="Remove ${escapeHTML(field.name)}">
            Remove
          </button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      toggleWatering(Number(button.dataset.toggle));
    });
  });

  list.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      removeField(Number(button.dataset.remove));
    });
  });
}

// Render the priority queue.
function renderPriorities() {
  const ordered = calculatePriorities();

  $("priorityList").innerHTML = ordered.map((field, index) => `
    <div class="queue-row">
      <div class="queue-rank ${index === 0 ? "first" : ""}">
        ${String(index + 1).padStart(2, "0")}
      </div>

      <div>
        <div class="queue-name">
          ${escapeHTML(field.name)}
        </div>

        <div class="queue-detail">
          ${escapeHTML(field.crop)} · ${field.moisture}% moisture
        </div>

        <div class="queue-detail">
          Demand: ${litres(field.required)}
        </div>
      </div>

      <div class="queue-score">
        ${field.priority.toFixed(1)}
        <small>Priority score</small>
      </div>
    </div>
  `).join("") ||
    '<p class="muted">Add a field to see priorities.</p>';
}

// Render dashboard statistics.
function renderStats() {
  const average = fields.length
    ? fields.reduce(
        (sum, field) => sum + field.moisture,
        0
      ) / fields.length
    : 0;

  $("fieldCount").textContent = fields.length;
  $("avgMoisture").textContent = `${Math.round(average)}%`;

  $("waterAvailable").innerHTML =
    `${number(reservoir)} <small>L</small>`;

  $("attentionCount").textContent =
    fields.filter(field => field.moisture < 40).length;
}

// Render water resource information.
function renderWater() {
  const percent = INITIAL_WATER > 0
    ? Math.min(100, reservoir / INITIAL_WATER * 100)
    : 0;

  $("reservoirValue").textContent = number(reservoir);
  $("reservoirBar").style.width = `${percent}%`;

  $("reservoirCaption").textContent =
    `${Math.round(percent)}% of initial reservoir remains`;

  if (!lastAllocation) {
    const demand = fields.reduce(
      (sum, field) => sum + field.required,
      0
    );

    $("totalDemand").textContent = litres(demand);
    $("totalAllocated").textContent = "Not calculated";
    $("remainingWater").textContent = "—";
    $("fullyWatered").textContent = "—";
    return;
  }

  $("totalDemand").textContent =
    litres(lastAllocation.demand);

  $("totalAllocated").textContent =
    litres(lastAllocation.allocated);

  $("remainingWater").textContent =
    litres(lastAllocation.remaining);

  $("fullyWatered").textContent =
    `${lastAllocation.fullyWatered} / ${fields.length}`;
}

// Refresh the entire dashboard.
function renderAll() {
  calculateRequirements();
  renderStats();
  renderFields();
  renderPriorities();
  renderWater();
}

// Calculate allocation according to priority.
function allocateWater() {
  const available = Number($("waterInput").value);

  if (
    !Number.isFinite(available) ||
    available < 0 ||
    available > 1000000000
  ) {
    $("allocationMessage").textContent =
      "Enter a valid water quantity between 0 and 1,000,000,000 litres.";
    return;
  }

  let remaining = available;
  let totalAllocated = 0;
  let fullyWatered = 0;

  const ordered = calculatePriorities();

  // Allocate to the highest-priority fields first.
  ordered.forEach(field => {
    const allocated = Math.min(
      remaining,
      field.required
    );

    field.allocated = allocated;
    remaining -= allocated;
    totalAllocated += allocated;

    if (allocated >= field.required) {
      fullyWatered++;
    }
  });

  reservoir = Math.max(0, remaining);

  lastAllocation = {
    demand: fields.reduce(
      (sum, field) => sum + field.required,
      0
    ),
    allocated: totalAllocated,
    remaining: reservoir,
    fullyWatered
  };

  renderAll();

  $("waterInput").value = reservoir;

  $("allocationMessage").textContent =
    `Allocation complete: ${litres(totalAllocated)} allocated. ` +
    `${litres(reservoir)} remains.`;
}

// Start or stop simulated watering.
function toggleWatering(id) {
  const field = fields.find(item => item.id === id);

  if (!field) return;

  if (!field.running) {
    if (reservoir <= 0) {
      $("allocationMessage").textContent =
        "The reservoir is empty. Enter more water or reset the demo.";
      return;
    }

    field.running = true;

    $("allocationMessage").textContent =
      `${field.name}: simulated watering started. ` +
      "No physical pump is connected.";
  } else {
    field.running = false;

    // Demonstration only: simulate a moisture increase.
    field.moisture = Math.min(
      100,
      field.moisture + 10
    );

    // Moisture changed, so prior allocation results are stale.
    lastAllocation = null;

    $("allocationMessage").textContent =
      `${field.name}: simulated watering stopped. ` +
      "Moisture increased by 10 percentage points.";
  }

  renderAll();
}

// Remove a field.
function removeField(id) {
  const field = fields.find(item => item.id === id);

  if (!field) return;

  if (!confirm(`Remove "${field.name}" from the dashboard?`)) {
    return;
  }

  fields = fields.filter(item => item.id !== id);
  lastAllocation = null;

  renderAll();

  $("allocationMessage").textContent =
    `${field.name} removed from the dashboard.`;
}

// Add a field using a completely customizable crop name and rate.
function addField(event) {
  event.preventDefault();

  const name = $("fieldName").value.trim();
  const crop = $("cropName").value.trim();
  const rate = Number($("waterRate").value);
  const area = Number($("fieldArea").value);
  const moisture = Number($("fieldMoisture").value);

  if (!name || !crop) {
    $("allocationMessage").textContent =
      "Enter both a field name and a crop name.";
    return;
  }

  if (
    !Number.isFinite(rate) ||
    rate <= 0 ||
    rate > 1000000000
  ) {
    $("allocationMessage").textContent =
      "Enter a valid water requirement per acre.";
    return;
  }

  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    area > 100000
  ) {
    $("allocationMessage").textContent =
      "Enter a valid field area.";
    return;
  }

  if (
    !Number.isFinite(moisture) ||
    moisture < 0 ||
    moisture > 100
  ) {
    $("allocationMessage").textContent =
      "Soil moisture must be between 0 and 100%.";
    return;
  }

  const newField = {
    id: nextId++,
    name,
    crop,
    rate,
    area,
    moisture,
    running: false
  };

  fields.push(newField);

  lastAllocation = null;

  $("fieldForm").reset();
  $("waterRate").value = 1000;
  $("fieldArea").value = 1;
  $("fieldMoisture").value = 25;

  $("fieldDialog").close();

  renderAll();

  $("allocationMessage").textContent =
    `${crop} added successfully. Water demand: ` +
    `${litres(newField.area * newField.rate)}.`;
}

// Reset to original demonstration values.
function resetDemo() {
  fields = INITIAL_FIELDS.map(field => ({
    ...field,
    rate: CROP_RATES[field.crop.toLowerCase()],
    running: false
  }));

  reservoir = INITIAL_WATER;
  nextId = 5;
  lastAllocation = null;

  $("waterInput").value = INITIAL_WATER;

  renderAll();

  $("allocationMessage").textContent =
    "Demo reset. Original fields and reservoir restored.";
}

// When the crop name changes, suggest a known default rate.
// The user can always overwrite it with a custom rate.
$("cropName").addEventListener("input", () => {
  const crop = $("cropName").value.trim().toLowerCase();

  if (Object.hasOwn(CROP_RATES, crop)) {
    $("waterRate").value = CROP_RATES[crop];
  }
});

// Event listeners.
$("allocateBtn").addEventListener("click", allocateWater);
$("resetBtn").addEventListener("click", resetDemo);

$("addFieldBtn").addEventListener("click", () => {
  $("fieldDialog").showModal();
});

$("closeDialog").addEventListener("click", () => {
  $("fieldDialog").close();
});

$("fieldForm").addEventListener("submit", addField);

// Highlight the selected navigation item.
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});

// Initialize dashboard.
renderAll();
