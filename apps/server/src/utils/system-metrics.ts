import os from 'node:os';

let lastCpu = os.cpus();
let lastSample = Date.now();

/** Approximate aggregate CPU utilisation (%) sampled between calls. */
function cpuUsagePercent(): number {
  const now = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;
  for (let i = 0; i < now.length; i += 1) {
    const prev = lastCpu[i];
    const curr = now[i];
    if (!prev) continue;
    const prevTotal = Object.values(prev.times).reduce((a, b) => a + b, 0);
    const currTotal = Object.values(curr.times).reduce((a, b) => a + b, 0);
    idleDiff += curr.times.idle - prev.times.idle;
    totalDiff += currTotal - prevTotal;
  }
  lastCpu = now;
  lastSample = Date.now();
  if (totalDiff === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}

export function systemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const proc = process.memoryUsage();

  return {
    cpu: cpuUsagePercent(),
    loadAvg: os.loadavg().map((n) => Number(n.toFixed(2))),
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percent: Math.round((usedMem / totalMem) * 100),
      processRss: proc.rss,
    },
    uptime: Math.round(process.uptime()),
    platform: `${os.platform()} ${os.arch()}`,
    cores: os.cpus().length,
    sampledAt: lastSample,
  };
}
