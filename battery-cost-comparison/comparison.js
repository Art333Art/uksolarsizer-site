const defaults = [
  { name: "Option 1", nominal: 15, soh: 100, window: 90 },
  { name: "Option 2", nominal: 40, soh: 80, window: 80 }
];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

function number(input) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function optionCard(option, index) {
  const card = document.createElement("section");
  card.className = "comparison-option";
  card.innerHTML = `<h2>${option.name}</h2><div class="input-grid">
    <label>Battery price (&pound;)<input type="number" min="0" step="50" data-field="battery" value="0"></label>
    <label>Nominal capacity (kWh)<input type="number" min="0.1" step="0.1" data-field="nominal" value="${option.nominal}"></label>
    <label>State of health (%)<input type="number" min="1" max="100" step="1" data-field="soh" value="${option.soh}"></label>
    <label>Usable window (%)<input type="number" min="1" max="100" step="1" data-field="window" value="${option.window}"></label>
    <label>Controller / BMS (&pound;)<input type="number" min="0" step="25" data-field="controller" value="0"></label>
    <label>Inverter (&pound;)<input type="number" min="0" step="50" data-field="inverter" value="0"></label>
    <label>Protection, cables and other (&pound;)<input type="number" min="0" step="50" data-field="other" value="0"></label>
  </div><div class="tool-results" aria-live="polite">
    <div>Usable capacity<strong data-result="usable">&mdash;</strong></div>
    <div>Battery / nominal kWh<strong data-result="nominal-cost">&mdash;</strong></div>
    <div>Battery / usable kWh<strong data-result="usable-cost">&mdash;</strong></div>
    <div>Complete cost / usable kWh<strong data-result="complete-cost">&mdash;</strong></div>
  </div>`;
  card.dataset.option = index;
  return card;
}

function calculate(card) {
  const input = field => number(card.querySelector(`[data-field="${field}"]`));
  const battery = input("battery");
  const nominal = input("nominal");
  const usable = nominal * Math.min(input("soh"), 100) / 100 * Math.min(input("window"), 100) / 100;
  const complete = battery + input("controller") + input("inverter") + input("other");
  const show = (key, value) => { card.querySelector(`[data-result="${key}"]`).textContent = value; };
  show("usable", usable > 0 ? `${usable.toFixed(2)} kWh` : "—");
  show("nominal-cost", nominal > 0 ? money.format(battery / nominal) : "—");
  show("usable-cost", usable > 0 ? money.format(battery / usable) : "—");
  show("complete-cost", usable > 0 ? money.format(complete / usable) : "—");
}

const options = document.querySelector("#comparison-options");
defaults.forEach((option, index) => {
  const card = optionCard(option, index);
  options.append(card);
  card.addEventListener("input", () => calculate(card));
  calculate(card);
});
