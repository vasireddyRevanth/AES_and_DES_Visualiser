/* ========== PHASE 2 : passphrase → fake 64-bit seed ========== */
const cellSize = 32;
const svg = d3.select("#bitGrid");
const cells = svg
  .selectAll("g.cell")
  .data(d3.range(64))
  .join("g")
  .attr("class", "cell")
  .attr(
    "transform",
    (d, i) =>
      `translate(${(i % 8) * cellSize},${Math.floor(i / 8) * cellSize})`,
  );
cells
  .append("rect")
  .attr("width", cellSize - 2)
  .attr("height", cellSize - 2)
  .attr("rx", 3)
  .attr("fill", "#222");

function draw64(n) {
  const bits = n.toString(2).padStart(64, "0").split("").map(Number);
  cells
    .select("rect")
    .data(bits)
    .attr("fill", (d) => (d ? "#0ff" : "#222"));
}

/* ---- new: passphrase handling ---- */
const passInput = d3.select("#passInput");
const deriveBtn = d3.select("#deriveBtn");
const keySpan = d3.select("#keyDisplay span");

let derivedKey = 0x0123456789abcdefn; // default until user derives

deriveBtn.on("click", () => {
  const phrase = passInput.property("value");
  if (!phrase) {
    alert("Enter a passphrase");
    return;
  }
  // PHASE-2 STUB: fake 64-bit hex from first 16 chars of SHA-256
  const seed = phrase
    .split("")
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) & 0xffffffff, 0);
  derivedKey = BigInt(
    "0x" + Math.abs(seed).toString(16).padStart(16, "0").slice(0, 16),
  );
  keySpan.text("0x" + derivedKey.toString(16).padStart(16, "0"));
  draw64(derivedKey); // show the key bits instantly
});

/* ---- slider still dummy random ---- */
const slider = d3.select("#roundSlider");
const lbl = d3.select("#roundLbl");
slider.on("input", () => {
  const r = +slider.property("value");
  lbl.text(r);
  let dummy = derivedKey;
  for (let i = 0; i < r; i++)
    dummy = BigInt("0x" + Math.random().toString(16).slice(2, 18));
  draw64(dummy);
});
/* init */
draw64(derivedKey);
