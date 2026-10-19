import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const env = { ...process.env, CI: 'true' };

// Ensure current node directory is in PATH so child process can find 'node'
const nodeDir = path.dirname(process.execPath);
env.PATH = `${nodeDir};${env.PATH || ''}`;

// On Windows, if JAVA_HOME is not set or missing, use local OpenJDK 21
if (process.platform === 'win32') {
  const localJdk = 'C:\\Users\\susan\\AppData\\Local\\Programs\\openjdk-21\\jdk-21.0.12.1+1';
  if ((!env.JAVA_HOME || !fs.existsSync(env.JAVA_HOME)) && fs.existsSync(localJdk)) {
    env.JAVA_HOME = localJdk;
    env.PATH = `${path.join(localJdk, 'bin')};${env.PATH}`;
  }
}

const firebaseCliPath = path.resolve('node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');

const child = spawn(
  process.execPath,
  [
    firebaseCliPath,
    'emulators:exec',
    '--only',
    'firestore',
    'node --test tests/rules.test.mjs',
  ],
  {
    stdio: 'inherit',
    env,
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
