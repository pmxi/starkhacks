const SLOT_COUNT = 8;
const rack = document.getElementById("rack");
const carriage = document.getElementById("carriage");
const arm = document.getElementById("arm");
const log = document.getElementById("log");
const reset = document.getElementById("reset");

let busy = false;

function buildRack() {
  rack.innerHTML = "";
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;
    const id = `SRV-${String(i + 1).padStart(2, "0")}`;
    slot.textContent = id;
    slot.addEventListener("click", () => fetchServer(slot, i, id));
    rack.appendChild(slot);
  }
}

function logLine(text, cls = "") {
  const div = document.createElement("div");
  div.className = "log-line " + cls;
  div.textContent = `> ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchServer(slot, index, id) {
  if (busy || slot.classList.contains("gone")) return;
  busy = true;
  slot.classList.add("target");

  logLine(`target acquired: ${id}`, "accent");
  await wait(350);

  // elevator rises to slot position
  const slots = [...rack.querySelectorAll(".slot")];
  const rackRect = rack.getBoundingClientRect();
  const slotRect = slot.getBoundingClientRect();
  const bottomOffset = rackRect.bottom - slotRect.bottom - 4;
  logLine(`elevator → shelf ${index + 1}`);
  carriage.style.bottom = `${bottomOffset}px`;
  await wait(900);

  logLine("aligning… calibrated.", "ok");
  await wait(350);

  // arm extends
  logLine("arm extending");
  arm.classList.add("extended");
  await wait(550);

  logLine("gripper engaged", "ok");
  await wait(300);

  // slot slides out
  slot.classList.add("removed");
  logLine(`pulling ${id} from rack`);
  await wait(700);

  // retract arm
  arm.classList.remove("extended");
  await wait(450);

  // return elevator to base
  carriage.style.bottom = "0px";
  logLine("returning to drop-off");
  await wait(800);

  slot.classList.remove("target", "removed");
  slot.classList.add("gone");
  logLine(`${id} delivered. ready.`, "ok");
  busy = false;
}

reset.addEventListener("click", () => {
  if (busy) return;
  buildRack();
  log.innerHTML = "";
  logLine("rack reset. idle.", "muted");
  carriage.style.bottom = "0px";
  arm.classList.remove("extended");
});

buildRack();
