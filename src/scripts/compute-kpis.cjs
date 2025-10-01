/* eslint-disable no-console */
const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

function runGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

function getArg(name, defValue) {
  const args = process.argv.slice(2);
  const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return defValue;
  const valPart = args[idx];
  if (valPart.includes('=')) {
    return valPart.split('=').slice(1).join('=');
  }
  const next = args[idx + 1];
  if (next && !next.startsWith('--')) return next;
  // boolean flag present
  return true;
}

function hasFlag(name) {
  const args = process.argv.slice(2);
  return args.some(a => a === `--${name}` || a.startsWith(`--${name}=`));
}

function parseGitLog(opts = { sinceDays: 180, branch: undefined, pathFilter: undefined }) {
  const args = [
    'log',
    `--since=${opts.sinceDays} days ago`,
    '--date=iso',
    '--pretty=format:%H|%an|%ae|%ad|%s',
    '--numstat',
  ];
  if (opts.branch) args.push(opts.branch);
  if (opts.pathFilter) {
    args.push('--');
    args.push(opts.pathFilter);
  }
  const raw = runGit(args);
  if (!raw) return [];
  const lines = raw.split('\n');
  const commits = [];
  let current = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const headerParts = line.split('|');
    if (headerParts.length >= 5 && /^[0-9a-f]{7,40}$/.test(headerParts[0])) {
      if (current) commits.push(current);
      const [hash, authorName, authorEmail, dateISO, ...subjectParts] = headerParts;
      current = {
        hash,
        authorName,
        authorEmail,
        date: new Date(dateISO),
        subject: subjectParts.join('|').trim(),
        files: [],
        insertions: 0,
        deletions: 0,
      };
      continue;
    }

    const m = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
    if (m && current) {
      const ins = m[1] === '-' ? 0 : parseInt(m[1], 10);
      const del = m[2] === '-' ? 0 : parseInt(m[2], 10);
      current.files.push({ path: m[3], insertions: ins, deletions: del });
      current.insertions += ins;
      current.deletions += del;
    }
  }
  if (current) commits.push(current);
  return commits.sort((a, b) => a.date - b.date);
}

function statsFromCommits(commits) {
  if (commits.length === 0) return null;

  const total = commits.length;
  const first = commits[0].date;
  const last = commits[commits.length - 1].date;
  const days = Math.max(1, Math.round((last - first) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, (last - first) / (1000 * 60 * 60 * 24 * 7));

  const authorCounts = new Map();
  const dayCounts = new Map();

  let feat = 0;
  let fix = 0;
  let insertions = 0;
  let deletions = 0;
  let filesChanged = 0;

  for (const c of commits) {
    const msg = c.subject || '';
    if (/(^|\s)(feat|feature)(:|\s)/i.test(msg)) feat++;
    if (/(^|\s)(fix|bug|hotfix)(:|\s)/i.test(msg)) fix++;

    insertions += c.insertions;
    deletions += c.deletions;
    filesChanged += c.files.length;

    authorCounts.set(c.authorName, (authorCounts.get(c.authorName) || 0) + 1);

    const dayKey = c.date.toISOString().slice(0, 10);
    dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
  }

  const activeDays = dayCounts.size;
  const commitsPerWeek = total / weeks;
  const commitsPerActiveDay = total / Math.max(1, activeDays);
  const avgCommitSize = (insertions + deletions) / total;
  const churnRatio = insertions > 0 ? deletions / insertions : 0;

  const counts = Array.from(authorCounts.values()).sort((a, b) => b - a);
  const topShare = counts.length ? counts[0] / total : 0;
  const hhi = counts.reduce((s, c) => s + Math.pow(c / total, 2), 0);

  const times = commits.map(c => c.date.getTime());
  const diffs = [];
  for (let i = 1; i < times.length; i++) diffs.push(times[i] - times[i - 1]);
  diffs.sort((a, b) => a - b);
  const medianDiffMs = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 0;

  return {
    windowDays: days,
    totalCommits: total,
    commitsPerWeek,
    commitsPerActiveDay,
    featRatio: feat / total,
    fixRatio: fix / total,
    insertions,
    deletions,
    filesChanged,
    avgCommitSize,
    churnRatio,
    uniqueAuthors: authorCounts.size,
    topContributorShare: topShare,
    hhi,
    medianTimeBetweenCommitsHours: medianDiffMs / (1000 * 60 * 60),
    firstDate: first.toISOString(),
    lastDate: last.toISOString(),
  };
}

function commitHistograms(commits) {
  const byHour = Array.from({ length: 24 }, () => 0);
  const byDOW = Array.from({ length: 7 }, () => 0); // 0=Sun
  for (const c of commits) {
    const d = c.date;
    byHour[d.getHours()]++;
    byDOW[d.getDay()]++;
  }
  return { byHour, byDOW };
}

function commitTypeDistribution(commits) {
  const types = {
    feat: 0, fix: 0, chore: 0, refactor: 0, docs: 0, test: 0, perf: 0, ci: 0, build: 0, style: 0, revert: 0, other: 0,
  };
  const re = /^(feat|fix|chore|refactor|docs|test|perf|ci|build|style|revert)(\(.+?\))?:/i;
  for (const c of commits) {
    const m = (c.subject || '').match(re);
    if (m) {
      const k = m[1].toLowerCase();
      types[k] = (types[k] || 0) + 1;
    } else {
      types.other++;
    }
  }
  return types;
}

function topAuthors(commits, n = 5) {
  const byAuthor = new Map();
  for (const c of commits) {
    byAuthor.set(c.authorName, (byAuthor.get(c.authorName) || 0) + 1);
  }
  return Array.from(byAuthor.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
}

function readSidebarMenuCount() {
  try {
    const p = path.join(process.cwd(), 'src', 'components', 'Layout', 'Sidebar.tsx');
    const content = fs.readFileSync(p, 'utf8');
    const matches = content.match(/path:\s*['"][^'"]+['"]/g) || [];
    return { menuItems: matches.length, file: p };
  } catch {
    return null;
  }
}

function readVersions() {
  const versions = [];
  const roots = [process.cwd()];
  for (const root of roots) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      versions.push({ location: path.relative(process.cwd(), root) || '.', version: pkg.version || '0.0.0' });
    } catch {}
  }
  return versions;
}

function runESLintMetrics() {
  try {
    const eslintJs = path.join(process.cwd(), 'node_modules', 'eslint', 'bin', 'eslint.js');
    if (!fs.existsSync(eslintJs)) return null;
    const out = execFileSync('node', [eslintJs, 'src', '--format', 'json', '--quiet'], { encoding: 'utf8' });
    const results = JSON.parse(out);
    let errors = 0, warnings = 0, fixableErrors = 0, fixableWarnings = 0;
    let filesWithErrors = 0, filesWithWarnings = 0;
    for (const r of results) {
      let fileErrors = 0, fileWarnings = 0;
      for (const m of r.messages) {
        if (m.severity === 2) { errors++; fileErrors++; if (m.fix) fixableErrors++; }
        else if (m.severity === 1) { warnings++; fileWarnings++; if (m.fix) fixableWarnings++; }
      }
      if (fileErrors > 0) filesWithErrors++;
      if (fileWarnings > 0) filesWithWarnings++;
    }
    return { errors, warnings, fixableErrors, fixableWarnings, filesWithErrors, filesWithWarnings };
  } catch (e) {
    return { error: 'eslint_failed' };
  }
}

function runTSMetrics() {
  try {
    const tscJs = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
    let out = '';
    try {
      out = execFileSync('node', [tscJs, '--noEmit', '--pretty', 'false'], { encoding: 'utf8' });
      // success: 0 errors
      return { errors: 0 };
    } catch (e) {
      const stdout = e.stdout?.toString?.() || '';
      const stderr = e.stderr?.toString?.() || '';
      const text = stdout + '\n' + stderr;
      const count = (text.match(/error TS\d+:/g) || []).length;
      return { errors: count };
    }
  } catch (e) {
    return { error: 'tsc_failed' };
  }
}

function getDirSizeBytes(dir) {
  try {
    let total = 0;
    const stack = [dir];
    while (stack.length) {
      const d = stack.pop();
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) stack.push(p);
        else if (ent.isFile()) total += fs.statSync(p).size;
      }
    }
    return total;
  } catch { return 0; }
}

function formatPct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function main() {
  const sinceDays = parseInt(getArg('days', 180), 10) || 180;
  const branch = getArg('branch');
  const pathFilter = getArg('path');
  const withBuild = hasFlag('with-build');
  const skipLint = hasFlag('no-lint');
  const skipTsc = hasFlag('no-tsc');
  const outFile = getArg('out');

  const commits = parseGitLog({ sinceDays, branch, pathFilter });
  const s = statsFromCommits(commits);

  console.log('=== KPIs (últimos 180 días de commits) ===\n');
  if (!s) {
    console.log('No se encontraron commits en el rango o no hay historial de Git.');
    console.log('Asegúrate de estar dentro de un repo Git con commits.');
    process.exit(0);
  }

  // Avance
  console.log('Avance:');
  console.log(`- Throughput semanal: ${s.commitsPerWeek.toFixed(2)} commits/sem`);
  console.log(`- Feat ratio: ${formatPct(s.featRatio)} de los commits`);
  console.log(`- Tamaño prom. commit: ${s.avgCommitSize.toFixed(1)} LOC`);
  const sidebarInfo = readSidebarMenuCount();
  if (sidebarInfo) {
    console.log(`- Ítems de menú detectados en Sidebar: ${sidebarInfo.menuItems} (${path.relative(process.cwd(), sidebarInfo.file)})`);
  }
  const hist = commitHistograms(commits);
  const bestHour = hist.byHour.reduce((acc, v, i) => (v > acc.v ? { i, v } : acc), { i: 0, v: -1 });
  const bestDOW = hist.byDOW.reduce((acc, v, i) => (v > acc.v ? { i, v } : acc), { i: 0, v: -1 });
  const dowNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  console.log(`- Pico horario de commits: ${bestHour.i}:00 (${bestHour.v})`);
  console.log(`- Día más activo: ${dowNames[bestDOW.i]} (${bestDOW.v})`);
  console.log('');

  // Calidad
  console.log('Calidad:');
  console.log(`- Fix ratio: ${formatPct(s.fixRatio)} de los commits`);
  console.log(`- Churn ratio (del/ins): ${s.churnRatio.toFixed(2)}`);
  console.log(`- Cambios totales: +${s.insertions} / -${s.deletions} en ${s.filesChanged} archivos`);
  // Static analysis metrics
  let eslintMetrics = null;
  if (!skipLint) {
    eslintMetrics = runESLintMetrics();
    if (eslintMetrics && !eslintMetrics.error) {
      console.log(`- ESLint: ${eslintMetrics.errors} errores, ${eslintMetrics.warnings} warnings`);
    } else {
      console.log('- ESLint: no disponible (instala devDependency o usa --no-lint)');
    }
  } else {
    console.log('- ESLint: omitido (--no-lint)');
  }

  let tsMetrics = null;
  if (!skipTsc) {
    tsMetrics = runTSMetrics();
    if (tsMetrics && !tsMetrics.error) {
      console.log(`- TypeScript: ${tsMetrics.errors} errores de tipo`);
    } else {
      console.log('- TypeScript: no disponible (instala devDependency o usa --no-tsc)');
    }
  } else {
    console.log('- TypeScript: omitido (--no-tsc)');
  }

  // Optional bundle size
  let bundleBytes = 0;
  if (withBuild) {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      bundleBytes = getDirSizeBytes(distPath);
      const mb = (bundleBytes / (1024 * 1024)).toFixed(2);
      console.log(`- Bundle (dist/) total: ${mb} MB`);
    } else {
      console.log('- Bundle: dist/ no encontrado (ejecuta "npm run build" antes o usa script kpis:build)');
    }
  }
  console.log('');

  // Gestión de tiempo
  console.log('Gestión de tiempo:');
  console.log(`- Días activos (en ventana): ${Math.max(1, s.windowDays)} (con commits en ~${Math.round(s.totalCommits / s.commitsPerActiveDay)} días)`);
  console.log(`- Commits por día activo: ${s.commitsPerActiveDay.toFixed(2)}`);
  console.log(`- Mediana de tiempo entre commits: ${s.medianTimeBetweenCommitsHours.toFixed(1)} h`);
  console.log(`- Ventana analizada: ${new Date(s.firstDate).toLocaleString()} → ${new Date(s.lastDate).toLocaleString()}`);
  console.log('');

  // Equipo
  console.log('Equipo:');
  console.log(`- Colaboradores únicos: ${s.uniqueAuthors}`);
  console.log(`- Share del top contributor: ${formatPct(s.topContributorShare)}`);
  console.log(`- HHI (concentración): ${s.hhi.toFixed(2)} (0=diverso, 1=monopolio)`);
  const authorsTop = topAuthors(commits, 5);
  console.log(`- Top autores: ${authorsTop.map(a => `${a.name} (${a.count})`).join(', ')}`);
  console.log('');

  // Tipos de commits
  const typeDist = commitTypeDistribution(commits);
  const totalCommits = commits.length;
  console.log('Tipos de commits:');
  for (const [k, v] of Object.entries(typeDist)) {
    if (v > 0) console.log(`- ${k}: ${v} (${formatPct(v / totalCommits)})`);
  }
  console.log('');

  // Versiones detectadas
  const versions = readVersions();
  if (versions.length) {
    console.log('Versiones detectadas (package.json):');
    for (const v of versions) console.log(`- ${v.location}: ${v.version}`);
  }

  // JSON export opcional
  if (outFile) {
    const report = {
      params: { sinceDays, branch, pathFilter },
      summary: s,
      histograms: hist,
      typeDistribution: typeDist,
      authorsTop,
      eslint: eslintMetrics,
      typescript: tsMetrics,
      bundleBytes,
      sidebarInfo,
      versions,
      generatedAt: new Date().toISOString(),
    };
    const outPath = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\nReporte JSON guardado en: ${path.relative(process.cwd(), outPath)}`);
  }
}

main();