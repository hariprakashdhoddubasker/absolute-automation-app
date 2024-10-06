const os = require('os');
const { execSync } = require('child_process');
const diskusage = require('diskusage');

// Generate system health report including new statistics
async function generateSystemHealthReport() {
  const totalMemory = (os.totalmem() / (1024 * 1024)).toFixed(2) + ' MB';
  const freeMemory = (os.freemem() / (1024 * 1024)).toFixed(2) + ' MB';
  const usedMemory =
    ((os.totalmem() - os.freemem()) / (1024 * 1024)).toFixed(2) + ' MB';

  // Get the uptime in seconds and convert to hours and minutes
  const uptimeInSeconds = os.uptime();
  const uptimeHours = Math.floor(uptimeInSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const uptime = `${uptimeHours}hr ${uptimeMinutes}min`;

  const loadAverage = os
    .loadavg()
    .map((avg) => avg.toFixed(2))
    .join(', ');

  const cpuUsage = getCpuUsage();
  const topProcesses = getTopProcesses();

  // Getting swap usage
  const swapUsage = getSwapUsage();

  // Generating disk usage asynchronously
  return getDiskUsage().then((diskUsage) => {
    const report = `
  *System Health Report*
  -----------------------------------
  Total RAM: ${totalMemory}
  Free RAM: ${freeMemory}
  Used RAM: ${usedMemory}
  System Uptime: ${uptime}
  Load Average (1, 5, 15 min): ${loadAverage}
  
  *CPU Usage:*
  User: ${cpuUsage.userPct}%
  System: ${cpuUsage.systemPct}%
  Idle: ${cpuUsage.idlePct}%

  *Disk Usage:*
  Total: ${diskUsage.total}
  Used: ${diskUsage.used}
  Free: ${diskUsage.free}

  *Top Processes by Memory:*
  ${topProcesses}

  *Swap Usage:*
  Total: ${swapUsage.total}
  Used: ${swapUsage.used}
  Free: ${swapUsage.free}
`;
    return report;
  });
}

// Function to get Disk Usage
async function getDiskUsage() {
  const { total, free } = await diskusage.check('/');
  const used = total - free;
  return {
    total: (total / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
    used: (used / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
    free: (free / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
  };
}

// Function to get CPU Usage
function getCpuUsage() {
  const cpus = os.cpus();
  const cpuTimes = cpus.reduce(
    (acc, cpu) => {
      acc.user += cpu.times.user;
      acc.nice += cpu.times.nice;
      acc.sys += cpu.times.sys;
      acc.idle += cpu.times.idle;
      acc.irq += cpu.times.irq;
      return acc;
    },
    { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 }
  );

  const total = Object.values(cpuTimes).reduce((total, value) => total + value);
  const userPct = ((cpuTimes.user / total) * 100).toFixed(2);
  const systemPct = ((cpuTimes.sys / total) * 100).toFixed(2);
  const idlePct = ((cpuTimes.idle / total) * 100).toFixed(2);

  return { userPct, systemPct, idlePct };
}

// Function to get top processes
async function getTopProcesses() {
  if (os.platform() === 'win32') {
    return 'ProcessListing not supported on Windows';
  } else {
    try {
      const result = execSync(
        'ps -eo pid,comm,%mem,%cpu --sort=-%mem | head -n 6'
      ).toString();
      return result;
    } catch (error) {
      await handleError('Error fetching process info:', error);
      return 'Could not fetch process information';
    }
  }
}

// Function to get Swap Usage
function getSwapUsage() {
  const total = (os.totalmem() / (1024 * 1024)).toFixed(2) + ' MB'; // Adjusted for swap
  const free = (os.freemem() / (1024 * 1024)).toFixed(2) + ' MB';
  const used =
    ((os.totalmem() - os.freemem()) / (1024 * 1024)).toFixed(2) + ' MB';

  return {
    total: total,
    used: used,
    free: free,
  };
}

module.exports = generateSystemHealthReport;
