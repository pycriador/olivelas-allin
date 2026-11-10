const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const C_WRAPPER_SOURCE = `
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <limits.h>

static void mkdir_p(const char *dir) {
    char tmp[PATH_MAX];
    char *p = NULL;
    size_t len;
    snprintf(tmp, sizeof(tmp), "%s", dir);
    len = strlen(tmp);
    if (tmp[len - 1] == '/') tmp[len - 1] = 0;
    for (p = tmp + 1; *p; p++) {
        if (*p == '/') {
            *p = 0;
            mkdir(tmp, 0755);
            *p = '/';
        }
    }
    mkdir(tmp, 0755);
}

int main(int argc, char *argv[]) {
    char exe_path[PATH_MAX];
    ssize_t len = readlink("/proc/self/exe", exe_path, sizeof(exe_path) - 1);
    if (len <= 0) {
        perror("readlink /proc/self/exe");
        return 1;
    }
    exe_path[len] = '\\0';

    int fd = open(exe_path, O_RDONLY);
    if (fd < 0) {
        perror("open self");
        return 1;
    }

    off_t total_size = lseek(fd, 0, SEEK_END);
    if (total_size < 32) {
        close(fd);
        return 1;
    }

    lseek(fd, total_size - 16, SEEK_SET);
    uint64_t payload_offset = 0;
    char magic[8];
    if (read(fd, &payload_offset, 8) != 8 || read(fd, magic, 8) != 8) {
        close(fd);
        return 1;
    }

    if (memcmp(magic, "OLIVELAS", 8) != 0) {
        fprintf(stderr, "Invalid portable AppImage trailer.\\n");
        close(fd);
        return 1;
    }

    struct stat self_st;
    if (fstat(fd, &self_st) != 0) {
        self_st.st_mtime = 0;
    }

    uint64_t payload_size = (uint64_t)(total_size - 16) - payload_offset;
    const char *home = getenv("HOME");
    if (!home || !*home) home = "/tmp";

    char cache_dir[PATH_MAX];
    snprintf(cache_dir, sizeof(cache_dir), "%s/.cache/olivelas-local-tunnel-portable/build-%llu-%lld",
             home, (unsigned long long)payload_size, (long long)self_st.st_mtime);

    char app_bin[PATH_MAX];
    snprintf(app_bin, sizeof(app_bin), "%s/squashfs-root/olivelas-local-tunnel", cache_dir);

    struct stat st;
    if (stat(app_bin, &st) != 0) {
        printf("📦 Preparando Olivelas Local Tunnel Portátil (primeira execução sem FUSE)...\\n");
        mkdir_p(cache_dir);

        char tmp_appimage[PATH_MAX];
        snprintf(tmp_appimage, sizeof(tmp_appimage), "%s/payload.AppImage", cache_dir);

        int out_fd = open(tmp_appimage, O_WRONLY | O_CREAT | O_TRUNC, 0755);
        if (out_fd < 0) {
            perror("open payload.AppImage");
            close(fd);
            return 1;
        }

        lseek(fd, (off_t)payload_offset, SEEK_SET);
        char buf[65536];
        uint64_t remaining = payload_size;
        while (remaining > 0) {
            size_t to_read = remaining > sizeof(buf) ? sizeof(buf) : (size_t)remaining;
            ssize_t n = read(fd, buf, to_read);
            if (n <= 0) break;
            if (write(out_fd, buf, (size_t)n) != n) break;
            remaining -= (uint64_t)n;
        }
        close(out_fd);

        pid_t pid = fork();
        if (pid == 0) {
            if (chdir(cache_dir) != 0) _exit(1);
            execl(tmp_appimage, tmp_appimage, "--appimage-extract", (char *)NULL);
            _exit(1);
        } else if (pid > 0) {
            int status = 0;
            waitpid(pid, &status, 0);
        }
        unlink(tmp_appimage);
    }
    close(fd);

    char squashfs_dir[PATH_MAX];
    snprintf(squashfs_dir, sizeof(squashfs_dir), "%s/squashfs-root", cache_dir);
    setenv("APPDIR", squashfs_dir, 1);
    setenv("APPIMAGE", exe_path, 1);

    char **new_argv = calloc((size_t)argc + 3, sizeof(char *));
    new_argv[0] = app_bin;
    new_argv[1] = "--no-sandbox";
    for (int i = 1; i < argc; i++) {
        new_argv[i + 1] = argv[i];
    }
    new_argv[argc + 1] = NULL;

    execv(app_bin, new_argv);
    perror("execv olivelas-local-tunnel");
    return 1;
}
`;

function wrapAppImageWithFuseFreeLauncher(appImagePath) {
  try {
    execSync('which gcc', { stdio: 'ignore' });
  } catch {
    console.warn('⚠️ gcc não encontrado; mantendo AppImage padrão.');
    return;
  }

  // Verificar se já possui o trailer OLIVELAS
  const stat = fs.statSync(appImagePath);
  if (stat.size > 16) {
    const fd = fs.openSync(appImagePath, 'r');
    const tail = Buffer.alloc(8);
    fs.readSync(fd, tail, 0, 8, stat.size - 8);
    fs.closeSync(fd);
    if (tail.toString('ascii') === 'OLIVELAS') {
      return;
    }
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'olivelas-wrapper-'));
  const cFile = path.join(tmpDir, 'wrapper.c');
  const binFile = path.join(tmpDir, 'wrapper.bin');

  fs.writeFileSync(cFile, C_WRAPPER_SOURCE, 'utf8');
  execSync(`gcc -O2 "${cFile}" -o "${binFile}" -s`, { stdio: 'inherit' });

  const wrapperBuf = fs.readFileSync(binFile);
  const payloadBuf = fs.readFileSync(appImagePath);

  const trailer = Buffer.alloc(16);
  trailer.writeBigUInt64LE(BigInt(wrapperBuf.length), 0);
  trailer.write('OLIVELAS', 8, 8, 'ascii');

  const combined = Buffer.concat([wrapperBuf, payloadBuf, trailer]);
  fs.writeFileSync(appImagePath, combined, { mode: 0o755 });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`✅ [Portable AppImage] Launcher nativo sem dependência de libfuse2 embutido em: ${appImagePath}`);
}

exports.default = async function afterAllArtifactBuild(buildResult) {
  const artifactPaths = buildResult.artifactPaths || [];
  for (const file of artifactPaths) {
    if (file.endsWith('.AppImage') && fs.existsSync(file)) {
      wrapAppImageWithFuseFreeLauncher(file);
    }
  }
  return [];
};

// Permitir execução direta via CLI para empacotar um AppImage já existente
if (require.main === module) {
  const target = process.argv[2];
  if (target && fs.existsSync(target)) {
    wrapAppImageWithFuseFreeLauncher(path.resolve(target));
  }
}
