import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const requestedVersion = process.argv[2];
if (!requestedVersion) throw new Error('Uso: node scripts/validate-release.mjs <versão>');

function configFrom(source) {
  const version = source.match(/version:\s*['"]([^'"]+)['"]/)?.[1];
  const versionCode = Number(source.match(/versionCode:\s*(\d+)/)?.[1]);
  if (!version || !Number.isInteger(versionCode)) throw new Error('Não foi possível ler version e android.versionCode de app.config.ts.');
  return { version, versionCode };
}
function parts(value) { return value.replace(/^v/i, '').split(/[.-]/).map(part => Number.parseInt(part, 10) || 0); }
function newer(left, right) {
  const a = parts(left); const b = parts(right);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  return false;
}

const current = configFrom(readFileSync(new URL('../app.config.ts', import.meta.url), 'utf8'));
const normalized = requestedVersion.replace(/^v/i, '');
if (current.version !== normalized) throw new Error(`Versão divergente: recebeu ${normalized}, mas app.config.ts contém ${current.version}.`);

const tags = execFileSync('git', ['tag', '--sort=-v:refname'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const currentTag = `v${normalized}`;
if (tags.includes(currentTag)) throw new Error(`A tag ${currentTag} já existe.`);
const previousTag = tags.find(tag => /^v?\d+\.\d+\.\d+/.test(tag));
if (previousTag) {
  const previousSource = execFileSync('git', ['show', `${previousTag}:app.config.ts`], { encoding: 'utf8' });
  const previous = configFrom(previousSource);
  if (!newer(normalized, previous.version)) throw new Error(`A versão ${normalized} deve ser maior que a última release (${previous.version}).`);
  if (current.versionCode <= previous.versionCode) throw new Error(`android.versionCode (${current.versionCode}) deve ser maior que o anterior (${previous.versionCode}).`);
  console.log(`Versão validada: ${current.version} (${current.versionCode}) > ${previous.version} (${previous.versionCode}).`);
} else {
  console.log(`Primeira release validada: ${current.version} (${current.versionCode}).`);
}
