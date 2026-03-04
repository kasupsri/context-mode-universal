import { execSync, execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { DEFAULT_CONFIG } from '../config/defaults.js';

export type ShellRuntime = 'powershell' | 'cmd' | 'git-bash';

export type Language =
  | 'javascript'
  | 'js'
  | 'typescript'
  | 'ts'
  | 'python'
  | 'py'
  | 'shell'
  | 'powershell'
  | 'cmd'
  | 'bash'
  | 'sh'
  | 'ruby'
  | 'rb'
  | 'go'
  | 'rust'
  | 'rs'
  | 'php'
  | 'perl'
  | 'pl'
  | 'r';

export interface Runtime {
  language: Language;
  command: string;
  args: (filePath: string) => string[];
  extension: string;
  available: boolean;
  runtimeId?: ShellRuntime;
}

const isWindows = process.platform === 'win32';

function commandExists(cmd: string): boolean {
  try {
    const probe = isWindows ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(probe, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function isAvailable(cmd: string): boolean {
  try {
    execFileSync(cmd, ['--version'], { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

function hasBun(): boolean {
  try {
    execFileSync('bun', ['--version'], { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

function detectPowerShellCommand(): string | null {
  if (commandExists('pwsh')) return 'pwsh';
  if (commandExists('powershell')) return 'powershell';
  return null;
}

function detectGitBashPath(): string | null {
  const knownPaths = [
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe',
  ];
  for (const p of knownPaths) {
    if (existsSync(p)) return p;
  }

  if (!isWindows) return commandExists('bash') ? 'bash' : null;

  try {
    const out = execSync('where bash', { encoding: 'utf8', stdio: 'pipe' });
    const candidates = out
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);
    for (const p of candidates) {
      const lower = p.toLowerCase();
      if (lower.includes('system32') || lower.includes('windowsapps')) continue;
      return p;
    }
    return null;
  } catch {
    return null;
  }
}

const bunAvailable = hasBun();
const pythonCommand = isAvailable('python3') ? 'python3' : isAvailable('python') ? 'python' : null;

const NON_SHELL_RUNTIMES: Runtime[] = [
  {
    language: 'javascript',
    command: bunAvailable ? 'bun' : 'node',
    args: f => [f],
    extension: 'js',
    available: bunAvailable || isAvailable('node'),
  },
  {
    language: 'js',
    command: bunAvailable ? 'bun' : 'node',
    args: f => [f],
    extension: 'js',
    available: bunAvailable || isAvailable('node'),
  },
  {
    language: 'typescript',
    command: bunAvailable ? 'bun' : 'tsx',
    args: f => [f],
    extension: 'ts',
    available: bunAvailable || isAvailable('tsx'),
  },
  {
    language: 'ts',
    command: bunAvailable ? 'bun' : 'tsx',
    args: f => [f],
    extension: 'ts',
    available: bunAvailable || isAvailable('tsx'),
  },
  {
    language: 'python',
    command: pythonCommand ?? 'python',
    args: f => [f],
    extension: 'py',
    available: pythonCommand !== null,
  },
  {
    language: 'py',
    command: pythonCommand ?? 'python',
    args: f => [f],
    extension: 'py',
    available: pythonCommand !== null,
  },
  {
    language: 'ruby',
    command: 'ruby',
    args: f => [f],
    extension: 'rb',
    available: isAvailable('ruby'),
  },
  {
    language: 'rb',
    command: 'ruby',
    args: f => [f],
    extension: 'rb',
    available: isAvailable('ruby'),
  },
  {
    language: 'go',
    command: 'go',
    args: f => ['run', f],
    extension: 'go',
    available: isAvailable('go'),
  },
  {
    language: 'rust',
    command: 'rustc',
    args: f => [f],
    extension: 'rs',
    available: isAvailable('rustc'),
  },
  {
    language: 'rs',
    command: 'rustc',
    args: f => [f],
    extension: 'rs',
    available: isAvailable('rustc'),
  },
  {
    language: 'php',
    command: 'php',
    args: f => [f],
    extension: 'php',
    available: isAvailable('php'),
  },
  {
    language: 'perl',
    command: 'perl',
    args: f => [f],
    extension: 'pl',
    available: isAvailable('perl'),
  },
  {
    language: 'pl',
    command: 'perl',
    args: f => [f],
    extension: 'pl',
    available: isAvailable('perl'),
  },
  {
    language: 'r',
    command: 'Rscript',
    args: f => [f],
    extension: 'r',
    available: isAvailable('Rscript'),
  },
];

function shellCandidates(preferred: ShellRuntime): ShellRuntime[] {
  if (preferred === 'cmd') return ['cmd', 'powershell', 'git-bash'];
  if (preferred === 'git-bash') return ['git-bash', 'powershell', 'cmd'];
  return ['powershell', 'cmd', 'git-bash'];
}

function buildShellRuntime(kind: ShellRuntime): Runtime | null {
  if (!isWindows) {
    if (kind === 'git-bash' && commandExists('bash')) {
      return {
        language: 'shell',
        command: 'bash',
        args: f => [f],
        extension: 'sh',
        available: true,
        runtimeId: 'git-bash',
      };
    }
    if (kind === 'powershell' && detectPowerShellCommand()) {
      const ps = detectPowerShellCommand();
      if (!ps) return null;
      return {
        language: 'shell',
        command: ps,
        args: f => ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f],
        extension: 'ps1',
        available: true,
        runtimeId: 'powershell',
      };
    }
    if (kind === 'cmd') return null;
    if (commandExists('sh')) {
      return {
        language: 'shell',
        command: 'sh',
        args: f => [f],
        extension: 'sh',
        available: true,
        runtimeId: 'git-bash',
      };
    }
    return null;
  }

  if (kind === 'powershell') {
    const ps = detectPowerShellCommand();
    if (!ps) return null;
    return {
      language: 'shell',
      command: ps,
      args: f => ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f],
      extension: 'ps1',
      available: true,
      runtimeId: 'powershell',
    };
  }

  if (kind === 'cmd') {
    if (!commandExists('cmd')) return null;
    return {
      language: 'shell',
      command: 'cmd.exe',
      args: f => ['/d', '/s', '/c', f],
      extension: 'cmd',
      available: true,
      runtimeId: 'cmd',
    };
  }

  const gitBash = detectGitBashPath();
  if (!gitBash) return null;
  return {
    language: 'shell',
    command: gitBash,
    args: f => [f.replace(/\\/g, '/')],
    extension: 'sh',
    available: true,
    runtimeId: 'git-bash',
  };
}

export function isShellLanguage(
  language: Language
): language is Extract<Language, 'shell' | 'powershell' | 'cmd' | 'bash' | 'sh'> {
  return (
    language === 'shell' ||
    language === 'powershell' ||
    language === 'cmd' ||
    language === 'bash' ||
    language === 'sh'
  );
}

export function resolveShellRuntime(
  language: Extract<Language, 'shell' | 'powershell' | 'cmd' | 'bash' | 'sh'>,
  preferredShell?: ShellRuntime
): Runtime | undefined {
  let preferred: ShellRuntime;
  if (language === 'powershell') preferred = 'powershell';
  else if (language === 'cmd') preferred = 'cmd';
  else if (language === 'bash' || language === 'sh') preferred = 'git-bash';
  else preferred = preferredShell ?? DEFAULT_CONFIG.sandbox.shellDefault;

  for (const candidate of shellCandidates(preferred)) {
    const runtime = buildShellRuntime(candidate);
    if (runtime?.available) return runtime;
  }
  return undefined;
}

export function getRuntimeForLanguage(
  language: Language,
  preferredShell?: ShellRuntime
): Runtime | undefined {
  if (isShellLanguage(language)) {
    return resolveShellRuntime(language, preferredShell);
  }
  return NON_SHELL_RUNTIMES.find(r => r.language === language && r.available);
}

export function getAvailableRuntimes(preferredShell?: ShellRuntime): Runtime[] {
  const available = NON_SHELL_RUNTIMES.filter(r => r.available);
  const shellLanguages: Array<Extract<Language, 'shell' | 'powershell' | 'cmd' | 'bash' | 'sh'>> = [
    'shell',
    'powershell',
    'cmd',
    'bash',
    'sh',
  ];
  for (const language of shellLanguages) {
    const shell = resolveShellRuntime(language, preferredShell);
    if (shell) {
      available.push({ ...shell, language });
    }
  }
  return available;
}
