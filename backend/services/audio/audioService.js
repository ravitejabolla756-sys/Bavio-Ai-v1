const fs = require('fs');
const path = require('path');

const AUDIO_DIR = '/tmp/bavio-audio';

// Create audio directory if not exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function saveAudio(base64Audio, callSid, turn) {
  const filename = `${callSid}-${turn}.wav`;
  const filepath = path.join(AUDIO_DIR, filename);
  const buffer = Buffer.from(base64Audio, 'base64');
  fs.writeFileSync(filepath, buffer);
  console.log(`[AUDIO] Saved ${buffer.length} bytes → ${filename}`);
  return filename;
}

function getAudioPath(filename) {
  return path.join(AUDIO_DIR, filename);
}

function getAudioUrl(filename) {
  const base = process.env.AUDIO_BASE_URL ||
               process.env.WEBHOOK_BASE_URL ||
               'https://api.bavio.in';
  return `${base}/audio/${filename}`;
}

function deleteAudio(callSid) {
  try {
    const files = fs.readdirSync(AUDIO_DIR);
    files
      .filter(f => f.startsWith(callSid))
      .forEach(f => {
        fs.unlinkSync(path.join(AUDIO_DIR, f));
        console.log(`[AUDIO] Deleted ${f}`);
      });
  } catch (err) {
    console.error('[AUDIO] Delete error:', err.message);
  }
}

module.exports = { saveAudio, getAudioPath, getAudioUrl, deleteAudio };
