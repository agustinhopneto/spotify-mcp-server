import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const configFile =
  process.env.SPOTIFY_CONFIG_FILE ?? '/data/spotify-config.json';
const requiredSettings = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
};
const environmentVariableNames = {
  clientId: 'SPOTIFY_CLIENT_ID',
  clientSecret: 'SPOTIFY_CLIENT_SECRET',
  redirectUri: 'SPOTIFY_REDIRECT_URI',
};
const missingSettings = Object.entries(requiredSettings)
  .filter(([, value]) => !value)
  .map(([name]) => environmentVariableNames[name]);

if (missingSettings.length > 0) {
  console.error(
    `Missing required environment variables: ${missingSettings.join(', ')}`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(configFile), { recursive: true });

let existingConfig = {};
if (fs.existsSync(configFile)) {
  try {
    existingConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch {
    console.error(
      `Unable to parse persisted Spotify configuration at ${configFile}`,
    );
    process.exit(1);
  }
}

fs.writeFileSync(
  configFile,
  `${JSON.stringify({ ...existingConfig, ...requiredSettings }, null, 2)}\n`,
  'utf8',
);

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('No command provided to Docker entrypoint');
  process.exit(1);
}

const child = spawn(command, args, { stdio: 'inherit' });
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
