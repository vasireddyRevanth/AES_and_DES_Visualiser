/* ========== PHASE 1 : only visuals, zero crypto ========== */
const cellSize = 32; // 8*32 = 256 px
const svg = d3.select("#bitGrid");

/* build 8×8 cells once */
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
  .attr("fill", "#222"); // default = 0

/* draw 64-bit BigInt */
function draw64(n) {
  const bits = n.toString(2).padStart(64, "0").split("").map(Number);
  cells
    .select("rect")
    .data(bits)
    .attr("fill", (d) => (d ? "#0ff" : "#222"));
}

/* ===== slider : dummy random block ===== */
const slider = d3.select("#roundSlider");
const lbl = d3.select("#roundLbl");
slider.on("input", () => {
  const r = +slider.property("value");
  lbl.text(r);
  /* dummy: more rounds → more random */
  let dummy = 0x0123456789abcdefn;
  for (let i = 0; i < r; i++)
    dummy = BigInt("0x" + Math.random().toString(16).slice(2, 18));
  draw64(dummy);
});
/* init */
draw64(0x0123456789abcdefn);
