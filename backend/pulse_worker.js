// backend/pulse_worker.js
// Lazy loading для Octokit - не падаем если пакета нет
function getOctokit() {
  try { 
    return require("@octokit/rest").Octokit; 
  } catch { 
    return null; // нет пакета — просто отключим pulse
  }
}

// ENV переменные
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PULSE_ENABLED = process.env.PULSE_ENABLED === 'true';
const PULSE_INTERVAL_MS = parseInt(process.env.PULSE_INTERVAL_MS || '300000'); // 5 минут
const TIMEZONE_OFFSET = parseInt(process.env.TIMEZONE_OFFSET || '3'); // UTC+3 для Кипра

// Функция форматирования времени с учётом timezone
function getCyprusTime() {
  const now = new Date();
  now.setHours(now.getHours() + TIMEZONE_OFFSET);
  return now.toISOString().replace('T', ' ').split('.')[0] + ' UTC+3';
}

// Основная функция pulse
async function pulseHeartbeat(octokit) {
  const timestamp = getCyprusTime();
  const heartbeatData = {
    timestamp,
    service: 'offerspsp-mvp',
    status: 'alive',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      PULSE_INTERVAL_MS,
      TIMEZONE_OFFSET
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  try {
    // Пытаемся обновить HEARTBEAT.json в репозитории
    const path = 'backend/HEARTBEAT.json';
    const content = JSON.stringify(heartbeatData, null, 2);
    const message = `💓 Pulse: ${timestamp}`;

    // Сначала пытаемся получить файл (для SHA)
    let sha;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: 'guannko',
        repo: 'offerspsp-mvp',
        path
      });
      sha = data.sha;
    } catch (e) {
      // Файла нет - создадим новый
      console.log('Creating new HEARTBEAT.json');
    }

    // Создаём или обновляем файл
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'guannko',
      repo: 'offerspsp-mvp',
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha // undefined если создаём новый
    });

    console.log(`💓 Pulse sent: ${timestamp}`);
  } catch (error) {
    console.error('❌ Pulse error:', error.message);
  }
}

// Запуск pulse engine
function startPulse() {
  if (!PULSE_ENABLED) {
    console.log('💤 Pulse Engine: DISABLED by config');
    return () => {};
  }

  if (!GITHUB_TOKEN) {
    console.warn('⚠️ Pulse Engine: No GITHUB_TOKEN, disabled');
    return () => {};
  }

  // Проверяем наличие Octokit
  const OctokitCtor = getOctokit();
  if (!OctokitCtor) {
    console.warn("⚠️ Pulse: @octokit/rest missing. Pulse disabled.");
    return () => {};
  }

  // Создаём клиента GitHub
  const octokit = new OctokitCtor({ auth: GITHUB_TOKEN });

  console.log(`💓 Pulse Engine: STARTING (interval: ${PULSE_INTERVAL_MS}ms)`);
  
  // Первый пульс сразу
  pulseHeartbeat(octokit);
  
  // Затем по интервалу
  const intervalId = setInterval(() => {
    pulseHeartbeat(octokit);
  }, PULSE_INTERVAL_MS);

  // Возвращаем функцию для остановки
  return () => {
    clearInterval(intervalId);
    console.log('💔 Pulse Engine: STOPPED');
  };
}

// Экспортируем для использования в server_v3.js
module.exports = { startPulse };
