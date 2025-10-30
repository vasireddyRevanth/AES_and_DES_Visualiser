import { deriveKey, singleRound } from "./crypto-engine.js";

/* ---------- grid setup ---------- */
const cellSize = 32;
const svg = d3.select("#bitGrid");
const hue = d3.scaleSequential(d3.interpolateRainbow).domain([0, 8]);

const cells = svg
  .selectAll("g.byte")
  .data(d3.range(8))
  .join("g")
  .attr("class", "byte")
  .attr(
    "transform",
    (d, i) =>
      `translate(${(i % 4) * (cellSize * 2)},${Math.floor(i / 4) * (cellSize * 2)})`,
  );

cells
  .append("rect")
  .attr("width", cellSize * 2 - 2)
  .attr("height", cellSize * 2 - 2)
  .attr("rx", 4);
cells
  .append("text")
  .attr("x", cellSize)
  .attr("y", cellSize + 5)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .style("pointer-events", "none");

/* draw 8 bytes */
function drawBytes(u8) {
  cells.each(function (d, i) {
    const g = d3.select(this);
    g.select("rect").attr("fill", hue(i));
    g.select("text").text(
      "0x" + u8[i].toString(16).padStart(2, "0").toUpperCase(),
    );
  });
}

/* ---------- passphrase handling ---------- */
const passInput = d3.select("#passInput");
const deriveBtn = d3.select("#deriveBtn");
let currentBytes = new Uint8Array(8);
let roundKeys = []; // 16 × 8-byte keys

deriveBtn.on("click", () => {
  const phrase = passInput.property("value");
  if (!phrase) {
    alert("Enter a passphrase");
    return;
  }
  currentBytes = deriveKey(phrase, "DES", 8);
  roundKeys = [];
  for (let r = 0; r < 16; r++) roundKeys.push(deriveKey(phrase + r, "DES", 8));
  drawBytes(currentBytes);
  slider.property("value", 0).dispatch("input");
});

/* ---------- round slider ---------- */
const slider = d3.select("#roundSlider");
const lbl = d3.select("#roundLbl");
slider.on("input", () => {
  const r = +slider.property("value");
  lbl.text(r);
  let blk = new Uint8Array(currentBytes);
  let totAval = 0;
  for (let i = 0; i < r; i++) {
    const res = singleRound(blk, roundKeys[i], "DES", i);
    blk = res.newBytes;
    totAval += res.avalancheBits;
  }
  drawBytes(blk);
  updateAvalChart(r, totAval);
});

/* ---------- tiny avalanche chart ---------- */
const avSvg = d3.select("#avalancheChart");
const avMargin = { top: 5, right: 5, bottom: 20, left: 25 };
const w = 300 - avMargin.left - avMargin.right;
const h = 100 - avMargin.top - avMargin.bottom;
const g = avSvg
  .append("g")
  .attr("transform", `translate(${avMargin.left},${avMargin.top})`);
const x = d3.scaleLinear().domain([0, 16]).range([0, w]);
const y = d3.scaleLinear().domain([0, 64]).range([h, 0]);
const line = d3
  .line()
  .x((d) => x(d.r))
  .y((d) => y(d.bits));
g.append("path")
  .attr("fill", "none")
  .attr("stroke", "#0ff")
  .attr("stroke-width", 2);
const avalData = [{ r: 0, bits: 0 }];
function updateAvalChart(r, bits) {
  avalData.push({ r, bits });
  g.select("path").datum(avalData).attr("d", line);
}

/* init */
drawBytes(currentBytes);
