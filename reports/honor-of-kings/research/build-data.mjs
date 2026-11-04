import fs from 'node:fs/promises';
const root = 'reports/honor-of-kings';
const read = async p => JSON.parse(await fs.readFile(`.cache/hok-research/${p}`, 'utf8'));
const { yxlb20_2489: roster } = await read('roster.json');
const legacy = await read('legacy.json');
const details = await read('details.json');
const manifest = await read('manifest.json');
const notes = (await fs.readFile(`${root}/research/hero-notes.tsv`, 'utf8')).trim().split(/\r?\n/).filter(s => !s.startsWith('#')).map(line => {
  const fields = line.split('\t');
  if (fields.length !== 9) throw new Error(`Invalid note: ${fields[0]}`);
  const [id, theme, mechanics, combo, early, team, build, buildNote, mistake] = fields;
  return { id, theme, mechanics: mechanics.split('；'), combo, early, team, build, buildNote, mistake };
});
const laneNames = { 1: '对抗路', 2: '打野', 3: '中路', 4: '发育路', 5: '游走' };
const typeNames = { 1: '战士', 2: '法师', 3: '坦克', 4: '刺客', 5: '射手', 6: '辅助' };
const aliases = { 177: ['成吉思汗'], 167: ['猴子'], 549: ['六耳', '孙悟空命格'], 581: ['元坦'], 582: ['元法'], 583: ['元刺'], 584: ['元射'], 585: ['元辅'], 513: ['婉儿'], 106: ['乔妹'] };
const heroes = roster.map(h => {
  const id = h.yxid_a7;
  const d = details.find(d => d.ename === id);
  const l = legacy.find(l => String(l.ename) === id);
  const n = notes.find(n => n.id === id);
  if (!d || !l || !n) throw new Error(`Missing hero ${id}`);
  const difficultyScore = Number(d.difficulty_value);
  const skillNames = Array.from({ length: 10 }, (_, i) => d[`skill${i + 1}_name`]).filter(Boolean);
  return {
    ...n, name: h.yxmclb_9965, pinyin: h.yxpymc_4614, aliases: aliases[id] || [],
    title: h.pfmclb_5571.split('|')[0].split('&')[0],
    roles: [...new Set([h.zzy_2397, h.fzy_8576].filter(Boolean).map(t => typeNames[t]))],
    lanes: id === '547' ? ['发育路'] : [...new Set(l.roles.split('|').map(t => laneNames[t]))],
    secondaryLanes: (l.extra_cold_lane || '').split('|').filter(Boolean).map(t => laneNames[t]),
    difficultyScore, difficulty: difficultyScore <= 3 ? '基础' : difficultyScore <= 6 ? '进阶' : '挑战',
    avatar: `assets/${id}.jpg`, date: h.sxsjlb_1516, skillNames,
    variant: h.sfsmgy_4767 === '1' ? '孙悟空命格' : h.yxpymc_4614.startsWith('yuanliuzhizi') ? '元流之子职业' : '',
    partners: [d.partner1, d.partner2].filter(id => roster.some(h => h.yxid_a7 === id)),
    favorable: [d.inhibit1, d.inhibit2].filter(id => roster.some(h => h.yxid_a7 === id)),
    difficult: [d.resist1, d.resist2].filter(id => roster.some(h => h.yxid_a7 === id)),
    source: `https://pvp.qq.com/zlkdatasys/zsbd_herolist/${id}.json`,
    sourceNote: ['119', '125', '172', '509', '582', '583'].includes(id) ? '该条目涉及重做或官网录入差异。机制按本次官方快照整理，完整形态、倍率与实机表现请核对游戏内说明。' : ''
  };
});
if (new Set(heroes.map(h => h.id)).size !== 132 || notes.length !== 132) throw new Error('Roster integrity check failed');
const buildGuides = {
  tank: ['前排与控制', '优先辅助或分路所需基础装备，再选生命、物防、法防和冷却。对手主要靠普攻就重视物防；法术爆发高则提前补法防。'],
  fighter: ['半肉持续作战', '物理输出与生存交替成型。优先解决清线或刷野效率，再根据敌方主要威胁补抗性；有足够存活时间，第二轮技能才有价值。'],
  burst: ['法术爆发', '先保证清线与资源续航，再建立法强和法术穿透。对手补法防后调整穿透投资；敌方突进强时，保命装备可早于最后一件输出。'],
  poke: ['远程法术消耗', '法强、法穿与冷却兼顾。先用技能压低血线，再争夺塔和中立资源；资源回复和保命要服从实际站位需求。'],
  controlMage: ['控制与法术输出', '冷却和持续施法能力优先，再补法伤、穿透或团队功能。游走打法先保证辅助经济和保护能力，不能直接照搬中路全输出。'],
  battleMage: ['持续法术作战', '法强、冷却、回复与生存结合。根据普攻参与度选择攻速收益，面对爆发补防御，避免只堆伤害却无法完成循环。'],
  utility: ['机动与团队功能', '先满足游走装备与移速，再按团队需要选择保护、冷却和抗性。观察最需要帮助的人，用装备保证关键技能能施放出来。'],
  healer: ['治疗与保护', '结合技能的生命或法强加成，选择治疗、护盾、生存和冷却。自己存活是持续保护的前提；对手限制回复时更需谨慎站位。'],
  assassin: ['物理切入爆发', '物攻、穿透与技能回转构成主要路线。打野先保证刷野效率，中后期用保命装备争取撤退或第二轮切入机会。'],
  magicAssassin: ['法术切入爆发', '法强与法穿为主，按英雄的普攻参与度补相应收益。法力、冷却和保命决定能否连续作战，不只比较一套理论伤害。'],
  crit: ['普攻与暴击', '物攻、攻速、暴击、穿透和续航需要形成完整组合。先完成关键输出节点，再根据前排护甲、敌方突进调整穿透与保命顺序。'],
  onhit: ['攻速与附加效果', '利用攻速与普攻附加效果提高持续输出，再补穿透、续航或防御。不同技能对附加效果有折算，具体以客户端装备和技能为准。'],
  marksmanBurst: ['强化射击', '物攻、穿透与强化攻击收益优先，冷却或攻速依技能循环选择。仍需补兵、走射和续航，不要让远程技能取代全部普攻。'],
  hybrid: ['先确定输出路线', '先决定以普攻还是技能作为主要收益，再补匹配的穿透、回复和防御。混合伤害不意味着物理与法术装备可以随意拼凑。'],
  roamer: ['移速与反复进出', '移速、物攻、冷却与防御共同服务切入节奏。根据敌方减速与控制压力选鞋和抗性，确保能完成接近、输出、撤离。'],
  summoner: ['召唤物与推进', '重视法强、冷却及召唤物继承收益，保证连续清线和磨塔。己方没有前排时，自己更需通过站位或保命装备控制风险。']
};
const result = {
  edition: '2026.09', reviewed: '2026-09-12', entryCount: heroes.length, identityCount: 127,
  rosterSource: 'https://pvp.qq.com/zlkdatasys/heroskinlist.json',
  laneSource: 'https://pvp.qq.com/web201605/js/herolist.json',
  recommended: ['166', '106', '133', '114', '107'], heroes, buildGuides
};
await fs.writeFile(`${root}/data.js`, `// Research snapshot; built from official metadata and original editorial notes.\nwindow.HOK_REPORT = ${JSON.stringify(result)};\n`);
await fs.writeFile(`${root}/research/source-manifest.json`, JSON.stringify({ reviewed: result.reviewed, counts: { entries: 132, identities: 127 }, sources: manifest.sources, failed: manifest.failed }, null, 2));
console.log(`Built ${heroes.length} illustrated hero entries; ${Object.keys(buildGuides).length} equipment frameworks.`);
