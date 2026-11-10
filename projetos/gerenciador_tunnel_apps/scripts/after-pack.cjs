const fs = require('fs');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return;

  const appOutDir = context.appOutDir;
  const executableName = context.packager.executableName;
  const binPath = path.join(appOutDir, executableName);
  const realBinPath = path.join(appOutDir, `${executableName}.bin`);
  const chromeSandboxPath = path.join(appOutDir, 'chrome-sandbox');

  // Remover chrome-sandbox para que o Chromium não aborte caso não tenha permissão SUID root (4755)
  if (fs.existsSync(chromeSandboxPath)) {
    try {
      fs.unlinkSync(chromeSandboxPath);
    } catch {}
  }

  // Envolver o binário principal para sempre passar --no-sandbox no Linux (Ubuntu 24.04+ AppArmor)
  if (fs.existsSync(binPath) && !fs.existsSync(realBinPath)) {
    fs.renameSync(binPath, realBinPath);
    const wrapperScript = `#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/${executableName}.bin" --no-sandbox "$@"
`;
    fs.writeFileSync(binPath, wrapperScript, { mode: 0o755 });
    console.log('✅ [afterPack] Wrapper Linux (--no-sandbox) aplicado em:', binPath);
  }
};
