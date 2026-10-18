/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS matches the repository's node:test suite. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('homepage hero keeps the restored animated brand scene with its static fallback poster', () => {
  const component = fs.readFileSync(path.join(root, 'src/components/HeroLandingMedia.tsx'), 'utf8');
  assert.match(component, /monkcraft-hero-landing\.mp4/);
  assert.match(component, /monkcraft-hero-landing-poster\.jpg/);
  assert.match(component, /muted[\s\S]*autoPlay[\s\S]*loop[\s\S]*playsInline/);
});
