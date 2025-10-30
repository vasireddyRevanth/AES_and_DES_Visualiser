/* app.js */
import { desRound } from "./crypto-engine.js";

const block0 = 0x0123456789abcdefn; // 64-bit plaintext
let current = block0;
const avalData = [{ r: 0, b: 0 }];

const svg = d3.select("#grid");
const size = 30;
const g = svg
  .selectAll("g")
  .data(d3.range(64))
  .join("g")
  .attr(
    "transform",
    (d, i) => `translate(${(i % 8) * size},${Math.floor(i / 8) * size})`,
  );
g.append("rect")
  .attr("width", size - 1)
  .attr("height", size - 1)
  .attr("fill", "#eef");

function draw64(n) {
  const bits = n.toString(2).padStart(64, "0").split("").map(Number);
  g.select("rect")
    .data(bits)
    .attr("fill", (d) => (d ? "#0ff" : "#111"));
}

const slider = d3.select("#roundSlider");
const lbl = d3.select("#roundLbl");
slider.on("input", () => {
  const r = +slider.property("value");
  lbl.text(`Round ${r}`);
  // run r dummy rounds
  let b = block0;
  let totAval = 0;
  for (let i = 0; i < r; i++) {
    const [tmp, a] = desRound(Number(b >> 32n), Number(b & 0xffffffffn), i);
    b = (BigInt(tmp[0]) << 32n) | BigInt(tmp[1]);
    totAval += a;
  }
  current = b;
  draw64(current);
  // avalanche chart
  avalData.push({ r, b: totAval });
  d3.select("#avalanche")
    .select("path")
    .datum(avalData)
    .attr(
      "d",
      d3
        .line()
        .x((d) => d.r * 20)
        .y((d) => 120 - d.b),
    );
});
draw64(block0);
