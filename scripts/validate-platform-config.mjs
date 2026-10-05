import { execFileSync } from 'node:child_process';

function configFor(isTV) {
  const output = execFileSync(process.execPath, ['node_modules/expo/bin/cli', 'config', '--json'], {
    encoding: 'utf8',
    env: { ...process.env, EXPO_TV: isTV ? '1' : '0' }
  });
  return JSON.parse(output);
}

const mobile = configFor(false);
const tv = configFor(true);

if (mobile.android?.package !== 'com.raphaeltw.nexoratv') throw new Error('A configuração Mobile deve usar com.raphaeltw.nexoratv.');
if (tv.android?.package !== 'com.raphaeltw.nexoratv.tv') throw new Error('A configuração TV deve usar com.raphaeltw.nexoratv.tv.');
if (mobile.extra?.isTV !== false || tv.extra?.isTV !== true) throw new Error('A flag extra.isTV não corresponde às variantes Mobile e TV.');
if (mobile.version !== tv.version || mobile.android?.versionCode !== tv.android?.versionCode) throw new Error('As variantes Mobile e TV devem compartilhar version e android.versionCode.');
if (!Number.isInteger(mobile.android?.versionCode) || mobile.android.versionCode < 1) throw new Error('android.versionCode deve ser um inteiro positivo.');

console.log(`Configurações validadas: Mobile ${mobile.android.package} e TV ${tv.android.package}, versão ${mobile.version} (${mobile.android.versionCode}).`);
