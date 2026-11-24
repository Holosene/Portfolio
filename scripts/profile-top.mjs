// Résumé d'un profil processeur (.cpuprofile) : fonctions qui prennent le plus de temps propre. node scripts/profile-top.mjs f.cpuprofile [n]
import { readFileSync } from 'node:fs'
const p = JSON.parse(readFileSync(process.argv[2], 'utf8')), n = +(process.argv[3] || 25)
const byId = new Map(p.nodes.map((x) => [x.id, x])), self = new Map()
const dt = p.timeDeltas; let total = 0
p.samples.forEach((id, i) => { const d = dt[i] || 0; total += d; self.set(id, (self.get(id) || 0) + d) })
const agg = new Map()
for (const [id, t] of self) { const c = byId.get(id).callFrame; const k = `${c.functionName || '(anonyme)'} ${c.url.split('/').pop()}:${c.lineNumber + 1}`; agg.set(k, (agg.get(k) || 0) + t) }
console.log(`total ${(total / 1000).toFixed(0)} ms`)
for (const [k, t] of [...agg].sort((a, b) => b[1] - a[1]).slice(0, n)) console.log(`${(t / 1000).toFixed(1).padStart(8)} ms ${(100 * t / total).toFixed(1).padStart(5)} %  ${k}`)
