/* Golden Ace Royale — Roblox-Style 3D Casino World, Character Customizer & Sky Obby.
   Pure native 3D perspective engine on HTML5 Canvas: zero external dependencies, works offline & headless. */
(function (G) {
  'use strict';
  const {$, $$, compact, fmt, escapeHtml, S} = G;

  /* ─── 11 Physical 3D Game Stations + Leaderboard Monument + Obby Portal ─── */
    const STATIONS = [
    {id:'wheel', kind:'game', name:'Lucky Wheel', sub:'12-Slice Fortune Stage', x:0, z:-7, w:3.4, d:2.2, h:1.2, color:'#8a6623', top:'#d9b65c', accent:'#fff0b8'},
    {id:'blackjack', kind:'game', name:'Blackjack', sub:'Classic 21 · 3:2 Natural', x:-13, z:-13, w:3.2, d:2.2, h:1.05, color:'#16442e', top:'#1f6142', accent:'#e4c982', dealer:'#6f1d2b'},
    {id:'roulette', kind:'game', name:'European Roulette', sub:'Single-Zero Wheel', x:-13, z:-3, w:3.4, d:2.2, h:1.05, color:'#4d1d26', top:'#6e2634', accent:'#e5c67e'},
    {id:'slots', kind:'game', name:'Golden 777', sub:'Signature Triple Reels', x:-13, z:7, w:3.2, d:1.6, h:2.3, color:'#6e521d', top:'#b58b38', accent:'#ffdf8e'},
    {id:'poker', kind:'game', name:'Video Poker', sub:'Jacks or Better · 250×', x:-13, z:16, w:2.8, d:1.6, h:2.2, color:'#1b3550', top:'#29517a', accent:'#8ec5ff'},
    {id:'plinko', kind:'game', name:'Plinko', sub:'50× Edge Pyramid', x:-6.5, z:-19, w:3.0, d:1.5, h:2.9, color:'#3d2349', top:'#5d3570', accent:'#eabfff'},
    {id:'baccarat', kind:'game', name:'Baccarat', sub:'VIP Crown Room', x:13, z:-13, w:3.2, d:2.2, h:1.05, color:'#164644', top:'#206663', accent:'#e6cf92', dealer:'#1c2e28'},
    {id:'crash', kind:'game', name:'Crash', sub:'Live Rocket Multiplier', x:13, z:-3, w:3.0, d:2.2, h:2.4, color:'#163a2a', top:'#245c43', accent:'#7df0b3'},
    {id:'hilo', kind:'game', name:'Hi-Lo', sub:'Higher or Lower Streak', x:13, z:7, w:2.8, d:2.0, h:1.15, color:'#55202b', top:'#7a2d3d', accent:'#f2c5cf'},
    {id:'dice', kind:'game', name:'Dice', sub:'36-Outcome Craps Arena', x:13, z:16, w:3.2, d:2.2, h:1.05, color:'#1c3652', top:'#284f78', accent:'#b6d8ff'},
    {id:'mines', kind:'game', name:'Mines', sub:'5×5 Gem Vault Grid', x:6.5, z:-19, w:3.0, d:2.6, h:0.85, color:'#18423c', top:'#25635a', accent:'#84f2dc'},
    {id:'keno', kind:'game', name:'Keno', sub:'Lucky Numbers Draw', x:-9.5, z:-15, w:2.8, d:2.0, h:1.3, color:'#8e44ad', top:'#9b59b6', accent:'#e8f5f9'},
    {id:'war', kind:'game', name:'Casino War', sub:'High Card Battle', x:15.5, z:-15, w:3.0, d:2.0, h:1.1, color:'#8e1c2d', top:'#a03a50', accent:'#ffe4e1'},
    {id:'caribbean', kind:'game', name:'Caribbean Stud', sub:'Progressive Poker', x:15.5, z:-5, w:3.2, d:2.2, h:1.05, color:'#2c3e50', top:'#34495e', accent:'#e8f4f8'},
    {id:'paigow', kind:'game', name:'Pai Gow Poker', sub:'Two Hands', x:-15.5, z:12, w:3.0, d:2.0, h:1.1, color:'#4a3a8e', top:'#6a5acd', accent:'#f0e6ff'},
    {id:'threecard', kind:'game', name:'3 Card Poker', sub:'Pair Plus + Ante', x:-15.5, z:2, w:2.8, d:2.0, h:1.1, color:'#8e44ad', top:'#9b59b6', accent:'#e8f5f9'},
    {id:'sicbo', kind:'game', name:'Sic Bo', sub:'Three Dice', x:15.5, z:5, w:2.8, d:1.8, h:1.3, color:'#f39c12', top:'#e67e22', accent:'#fff4e1'},
    {id:'letitride', kind:'game', name:'Let It Ride', sub:'Five Card Poker', x:-15.5, z:-8, w:3.0, d:2.0, h:1.1, color:'#2ecc71', top:'#27ae60', accent:'#e8f8e9'},
    {id:'reddog', kind:'game', name:'Red Dog', sub:'High or Low Spread', x:15.5, z:12, w:2.8, d:2.0, h:1.1, color:'#8e1c2d', top:'#a03a50', accent:'#ffe4e1'},
    {id:'craps', kind:'game', name:'Craps', sub:'Pass Line Arena', x:-15.5, z:-18, w:3.2, d:2.2, h:1.05, color:'#16a085', top:'#1abc9c', accent:'#e8f8f5'},
    {id:'leaderboard', kind:'modal', modal:'leaderboardModal', name:'Live Leaderboard', sub:'Top Vaults & Online Floor', x:0, z:10.5, w:3.4, d:1.1, h:2.8, color:'#1a2a1e', top:'#c7a455', accent:'#fff0be'},
    {id:'wardrobe', kind:'modal', modal:'characterModal', name:'Avatar Stylist', sub:'Pick Roblox Character & Hat', x:-5.5, z:20, w:2.2, d:1.8, h:1.9, color:'#2a2236', top:'#8c6bb5', accent:'#ebd9ff'}
  ];

  const NPCS = [
    {name:'Lady Evelyn [NPC]', preset:'heiress', hat:'crown', skin:'#f5d8be', chips:'42.5M', cx:-8, cz:-8, rx:3.2, rz:5.5, spd:0.55, phase:0.2},
    {name:'Duke Sterling [NPC]', preset:'sovereign', hat:'tophat', skin:'#e8b98a', chips:'1.8B', cx:8, cz:-7, rx:3.4, rz:5.0, spd:0.48, phase:1.9},
    {name:'Cyber Ace [NPC]', preset:'cyber', hat:'visor', skin:'#f3d4b6', chips:'640K', cx:-7, cz:11, rx:3.5, rz:4.2, spd:0.65, phase:3.4},
    {name:'Baron Chip [NPC]', preset:'pitboss', hat:'tophat', skin:'#8a5837', chips:'9.2T', cx:7.5, cz:11, rx:3.0, rz:4.5, spd:0.52, phase:4.8}
  ];

  /* ─── Dynamic Obby Builder (Normal / Hard / Expert) ─── */
  function buildObby(diff){
    const d = diff || 'normal';
    const padW = d==='expert' ? 1.55 : d==='hard' ? 2.05 : 2.75;
    const padD = d==='expert' ? 1.55 : d==='hard' ? 2.05 : 2.65;
    const moveSpd = d==='expert' ? 2.35 : d==='hard' ? 1.55 : 0.9;
    const platforms = [
      // Start podium at north plaza
      {x:0, y:0.35, z:-26.5, w:4.8, h:0.7, d:3.6, color:'#203829', top:'#c9a857', kind:'start'},
      {x:0, y:1.25, z:-30.6, w:padW, h:0.45, d:padD, color:'#1c3b2b', top:'#356e4f'},
      {x:-2.3, y:2.2, z:-34.0, w:padW, h:0.45, d:padD, color:'#1c3b2b', top:'#356e4f'},
      {x:0.4, y:3.2, z:-37.4, w:padW, h:0.45, d:padD, color:'#1c3b2b', top:'#d4b363', moveX:2.8, spd:moveSpd, phase:0},
      {x:2.4, y:4.25, z:-41.0, w:padW, h:0.45, d:padD, color:'#1c3b2b', top:'#356e4f'},
      // Midpoint Checkpoint
      {x:0, y:5.2, z:-44.8, w:3.6, h:0.55, d:3.2, color:'#1d3545', top:'#59d9c8', kind:'checkpoint'},
      {x:-2.6, y:6.3, z:-48.6, w:padW, h:0.45, d:padD, color:'#2c2440', top:'#7f5ca8', moveX:2.4, spd:moveSpd*1.15, phase:1.6},
      {x:2.2, y:7.45, z:-52.2, w:padW, h:0.45, d:padD, color:'#2c2440', top:'#7f5ca8', moveX:-2.4, spd:moveSpd*1.15, phase:0.7},
      {x:0, y:8.6, z:-55.8, w:padW, h:0.45, d:padD, color:'#4a1f29', top:'#b5455a'},
      // Hazard laser bar on Hard & Expert
      ...(d!=='normal' ? [
        {x:0, y:9.25, z:-55.8, w:3.4, h:0.28, d:0.38, color:'#b82020', top:'#ff5252', kind:'hazard', moveX:1.6, spd:moveSpd*1.35, phase:0.5}
      ] : []),
      {x:-1.8, y:9.8, z:-59.3, w:padW, h:0.45, d:padD, color:'#1c3b2b', top:'#356e4f'},
      ...(d==='expert' ? [
        {x:1.8, y:11.0, z:-62.7, w:1.5, h:0.45, d:1.5, color:'#5c4214', top:'#e4c168', moveX:2.2, spd:2.5, phase:2.2},
        {x:0, y:11.65, z:-62.7, w:3.2, h:0.26, d:0.36, color:'#b82020', top:'#ff5252', kind:'hazard', moveX:-2.0, spd:2.7, phase:1.1},
        {x:0, y:12.3, z:-66.4, w:4.4, h:0.7, d:4.4, color:'#6b5219', top:'#f2d482', kind:'summit'}
      ] : [
        {x:0, y:11.0, z:-63.2, w:4.4, h:0.7, d:4.4, color:'#6b5219', top:'#f2d482', kind:'summit'}
      ])
    ];
    const reward = d==='expert' ? 2500000 : d==='hard' ? 250000 : 25000;
    return {difficulty:d, platforms, reward};
  }

  /* ─── Color Shading Helpers ─── */
  const shadeCache = new Map();
  function shadeHex(hex, factor){
    const key = hex + ':' + factor;
    if(shadeCache.has(key)) return shadeCache.get(key);
    const c = String(hex || '#445544').replace('#','');
    const n = parseInt(c.length===3 ? c.split('').map(x=>x+x).join('') : c, 16) || 0x445544;
    const r = Math.min(255, Math.max(0, Math.round(((n>>16)&255)*factor)));
    const g = Math.min(255, Math.max(0, Math.round(((n>>8)&255)*factor)));
    const b = Math.min(255, Math.max(0, Math.round((n&255)*factor)));
    const out = `rgb(${r},${g},${b})`;
    shadeCache.set(key, out);
    return out;
  }

  /* ─── Core World State ─── */
  const player = {
    x: 0, y: 0, z: 21,
    vx: 0, vy: 0, vz: 0,
    facing: Math.PI, // facing north (-z) into the casino floor
    grounded: true,
    coyoteMs: 0,
    walkPhase: 0,
    checkpoint: {x: 0, y: 0, z: 21},
    obbyCooldown: 0
  };
  const cam = {yaw: 0, pitch: 0.42, dist: 11.5, dragging: false, lastX: 0, lastY: 0, moved: 0};
  const keys = new Set();
  const touchMove = {active: false, id: null, dx: 0, dy: 0, ox: 0, oy: 0};
  let obby = buildObby('normal');
  let running = false, raf = 0, lastTs = 0, worldTime = 0, presenceTimer = 0;
  let nearStation = null;
  let clickableBoxes = [];

  function syncObbyDifficulty(){
    const want = G.Wallet?.avatar?.difficulty || 'normal';
    if(obby.difficulty !== want){
      obby = buildObby(want);
      player.checkpoint = {x: 0, y: 0, z: 21};
    }
    $$('[data-world-diff]').forEach(b => {
      const sel = b.dataset.worldDiff === want;
      b.classList.toggle('selected', sel);
      b.classList.toggle('active', sel);
      b.setAttribute('aria-pressed', String(sel));
    });
    if($('#worldObbyBadge')){
      const label = want==='expert' ? 'EXPERT OBBY · +2.5M' : want==='hard' ? 'HARD OBBY · +250K' : 'NORMAL OBBY · +25K';
      $('#worldObbyBadge').textContent = label;
    }
  }

  /* ─── 3D Projection & Box Rasterizer ─── */
  function createProjector(w, h, cx, cy, cz, yaw, pitch){
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const focal = Math.min(w, h) * 0.92;
    const halfW = w * 0.5, halfH = h * 0.5;
    return {
      focal, halfW, halfH, cx, cy, cz,
      toCam(x, y, z){
        const dx = x - cx, dy = y - cy, dz = z - cz;
        const rx = dx * cosY - dz * sinY;
        const rz1 = dx * sinY + dz * cosY;
        const ry = dy * cosP - rz1 * sinP;
        const rz = dy * sinP + rz1 * cosP;
        return {x: rx, y: ry, z: -rz};
      },
      projectCam(p){
        const z = Math.max(0.25, p.z);
        return {x: halfW + (p.x / z) * focal, y: halfH - (p.y / z) * focal, z: p.z};
      },
      project(x, y, z){
        const c = this.toCam(x, y, z);
        if(c.z < 0.35) return null;
        return {x: halfW + (c.x / c.z) * focal, y: halfH - (c.y / c.z) * focal, z: c.z};
      }
    };
  }

  const FACES = [
    {idx:[0,1,2,3], side:'-z', shade:0.62, top:false}, // north wall
    {idx:[5,4,7,6], side:'+z', shade:0.82, top:false}, // south wall
    {idx:[4,0,3,7], side:'-x', shade:0.55, top:false}, // west wall
    {idx:[1,5,6,2], side:'+x', shade:0.72, top:false}, // east wall
    {idx:[3,2,6,7], side:'+y', shade:1.0, top:true},   // top
    {idx:[4,5,1,0], side:'-y', shade:0.30, top:false}  // bottom
  ];

  /* Rounded rectangle — compatible replacement for ctx.roundRect */
  function roundRect(ctx, x, y, w, h, r){
    if(typeof ctx.roundRect==='function'){ctx.roundRect(x,y,w,h,r);return;}
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

  function clipNear(pts, nearZ=0.32){
    const out = [];
    for(let i=0;i<pts.length;i++){
      const a = pts[i], b = pts[(i+1)%pts.length];
      const aIn = a.z >= nearZ, bIn = b.z >= nearZ;
      if(aIn) out.push(a);
      if(aIn !== bIn){
        const t = (nearZ - a.z) / (b.z - a.z);
        out.push({x: a.x + (b.x - a.x)*t, y: a.y + (b.y - a.y)*t, z: nearZ});
      }
    }
    return out;
  }

  /* Light direction (overhead, slightly front) for consistent shading */
  const LIGHT = {lx: 0.3, ly: -0.8, lz: 0.5};

  function faceLight(side){
    const dirs = {'+y':{x:0,y:1,z:0},'-y':{x:0,y:-1,z:0},'+x':{x:1,y:0,z:0},'-x':{x:-1,y:0,z:0},'+z':{x:0,y:0,z:1},'-z':{x:0,y:0,z:-1}};
    const d = dirs[side] || {x:0,y:0,z:1};
    const dot = d.x*LIGHT.lx + d.y*LIGHT.ly + d.z*LIGHT.lz;
    return Math.max(0.25, Math.min(1.0, 0.55 + dot*0.45));
  }

  function gradFill(ctx, scr, color, side, topColor=null){
    // vertical light-to-dark gradient per face for 3D volume feel
    const ys = scr.map(p=>p.y); const minY=Math.min(...ys), maxY=Math.max(...ys);
    if(maxY-minY < 1) return color;
    const g = ctx.createLinearGradient(0, minY, 0, maxY);
    const base = topColor || color;
    const light = faceLight(side);
    const c1 = shadeHex(base, Math.min(1, light*1.15));   // highlight
    const c2 = shadeHex(base, Math.max(0, light*0.55));   // shadow
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  /* Specular highlight for metallic / gold surfaces — sells real material */
  function metalSpecular(ctx, scr, baseCol, intensity=0.9){
    const ys = scr.map(p=>p.y); const xs = scr.map(p=>p.x);
    const minY=Math.min(...ys), maxY=Math.max(...ys);
    const minX=Math.min(...xs), maxX=Math.max(...xs);
    const cx=(minX+maxX)*0.5, cy=minY + (maxY-minY)*0.25; // shine near top of face
    const r = Math.max(6, (maxX-minX)*0.35);
    const g = ctx.createRadialGradient(cx, cy, r*0.15, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,220,'+intensity+')');
    g.addColorStop(0.45, 'rgba(255,240,180,'+intensity*0.5+')');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
  }

  /* Neon glow ring — draws a soft halo behind neon signs */
  function neonGlow(ctx, x, y, z, proj, w, d, color, rotY=0){
    const hw=w*0.5, hd=d*0.5;
    const cY = rotY ? Math.cos(rotY) : 1, sY = rotY ? Math.sin(rotY) : 0;
    const segs = 16;
    const pts = [];
    for(let i=0;i<segs;i++){
      const a = (i/segs)*Math.PI*2;
      const lx = Math.cos(a)*hw, lz = Math.sin(a)*hd;
      pts.push({x:x + lx*cY + lz*sY, y:y, z:z - lx*sY + lz*cY});
    }
    const camPts = pts.map(p => proj.toCam(p.x, p.y, p.z)).filter(cp => cp.z > 0.35);
    if(camPts.length < 3) return;
    const scr = camPts.map(cp => proj.projectCam(cp));
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const p of scr){ if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x; if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y; }
    if(minX>=maxX||minY>=maxY) return;
    const cx=(minX+maxX)*0.5, cy=(minY+maxY)*0.5;
    const rx=(maxX-minX)*0.5*1.15, ry=(maxY-minY)*0.5*0.9;
    const g = ctx.createRadialGradient(cx, cy, rx*0.1, cx, cy, rx*1.1);
    g.addColorStop(0, color+'cc');
    g.addColorStop(0.35, color+'44');
    g.addColorStop(1, color+'00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
    ctx.fill();
  }

  function pushBox(polys, proj, x, y, z, w, h, d, color, topColor=null, rotY=0, tag=null, mat='matte'){
    const hw = w*0.5, hh = h*0.5, hd = d*0.5;
    const cY = rotY ? Math.cos(rotY) : 1, sY = rotY ? Math.sin(rotY) : 0;
    const raw = [
      [-hw,-hh,-hd],[hw,-hh,-hd],[hw,hh,-hd],[-hw,hh,-hd],
      [-hw,-hh, hd],[hw,-hh, hd],[hw,hh, hd],[-hw,hh, hd]
    ];
    const camPts = new Array(8);
    let anyFront = false;
    for(let i=0;i<8;i++){
      const lx = raw[i][0], ly = raw[i][1], lz = raw[i][2];
      const wx = x + (rotY ? lx*cY + lz*sY : lx);
      const wy = y + ly;
      const wz = z + (rotY ? -lx*sY + lz*cY : lz);
      const cp = proj.toCam(wx, wy, wz);
      if(cp.z > 0.35) anyFront = true;
      camPts[i] = cp;
    }
    if(!anyFront) return;
    let screenMinX=Infinity, screenMaxX=-Infinity, screenMinY=Infinity, screenMaxY=-Infinity, avgDepth=0;
    for(const f of FACES){
      const quadCam = [camPts[f.idx[0]], camPts[f.idx[1]], camPts[f.idx[2]], camPts[f.idx[3]]];
      const clipped = clipNear(quadCam, 0.32);
      if(clipped.length < 3) continue;
      const scr = clipped.map(p => proj.projectCam(p));
      const area = (scr[1].x - scr[0].x)*(scr[2].y - scr[0].y) - (scr[1].y - scr[0].y)*(scr[2].x - scr[0].x);
      if(area >= 0) continue;
      const zAvg = (quadCam[0].z + quadCam[1].z + quadCam[2].z + quadCam[3].z) * 0.25;
      const baseCol = f.top && topColor ? topColor : color;
      const isMetal = mat === 'metal' || mat === 'gold';
      const fill = isMetal ? baseCol : gradFill(null, scr, baseCol, f.side, topColor);
      polys.push({
        pts: scr,
        depth: zAvg,
        fill: fill,
        stroke: 'rgba(8,16,11,0.28)',
        side: f.side,
        mat: mat,
        baseCol: baseCol
      });
      if(tag){
        for(const p of scr){
          if(p.x<screenMinX)screenMinX=p.x;if(p.x>screenMaxX)screenMaxX=p.x;
          if(p.y<screenMinY)screenMinY=p.y;if(p.y>screenMaxY)screenMaxY=p.y;
        }
        avgDepth = zAvg;
      }
    }
    if(tag && screenMinX < screenMaxX){
      clickableBoxes.push({tag, minX:screenMinX, maxX:screenMaxX, minY:screenMinY, maxY:screenMaxY, depth:avgDepth});
    }
  }

  /* ─── Articulated 3D Roblox-Style Character Builder (true Roblox proportions) ─── */
  function pushRobloxAvatar(polys, proj, opts){
    const {x, y, z, facing=0, walk=0, jumping=false, presetId='highroller', hatOverride=null, skinOverride=null, accessoryOverride=null, faceOverride=null, hairOverride=null, time=0} = opts;
    const preset = (G.CONFIG.characters||[]).find(c=>c.id===presetId) || G.CONFIG.characters[0];
    const skin = skinOverride || preset.skin || '#f0c79e';
    const hat = hatOverride || preset.hat || 'none';
    const accessory = accessoryOverride || preset.accessory || 'none';
    const face = faceOverride || preset.face || 'classic';
    const hair = hairOverride || preset.hair || 'none';
    const shoesCol = preset.shoes || '#0c1510';
    const trimCol = preset.trim || '#fff0be';
    const torsoCol = preset.torso || '#445544';
    const legsCol = preset.legs || '#111111';
    const shirtCol = preset.shirt || shadeHex(torsoCol, 0.85);
    const pantsCol = preset.pants || shadeHex(legsCol, 0.75);

    const idle = Math.sin(time * 2.6) * 0.035;          // breathing float
    const squash = jumping ? 0.70 : 1.0;                // jump squash
    const swing = jumping ? 0.55 : Math.sin(walk) * 0.55; // arm/leg swing
    const bend = jumping ? 0.5 : Math.abs(Math.sin(walk)) * 0.45; // leg knee bend
    const cosF = Math.cos(facing), sinF = Math.sin(facing);
    const local = (lx, ly, lz, w, h, d, col, topCol=null, rot=facing) => {
      const wx = x + lx*cosF + lz*sinF;
      const wz = z - lx*sinF + lz*cosF;
      pushBox(polys, proj, wx, y + ly + idle, wz, w, h, d, col, topCol, rot);
    };

    // ── Feet (big blocky Roblox shoes) ──
    local(-0.27, 0.00, swing*0.10, 0.52, 0.16, 0.62, shoesCol, shadeHex(shoesCol, 1.15));
    local( 0.27, 0.00,-swing*0.10, 0.52, 0.16, 0.62, shoesCol, shadeHex(shoesCol, 1.15));
    local(-0.27, 0.10, swing*0.10, 0.52, 0.04, 0.62, '#0b0c0d');            // sole
    local( 0.27, 0.10,-swing*0.10, 0.52, 0.04, 0.62, '#0b0c0d');

    // ── Shins (lower leg) ──
    local(-0.24, 0.52 + (jumping?0.03:Math.max(0, Math.sin(walk)*0.04)), swing*0.14, 0.40, 0.78*squash, 0.44, pantsCol);
    local( 0.24, 0.52 + (jumping?0.03:Math.max(0,-Math.sin(walk)*0.04)),-swing*0.14, 0.40, 0.78*squash, 0.44, pantsCol);
    local(-0.24, 1.16 + (jumping?0.03:Math.max(0, Math.sin(walk)*0.04)), swing*0.14, 0.40, 0.12, 0.44, shadeHex(pantsCol, 0.55)); // cuff
    local( 0.24, 1.16 + (jumping?0.03:Math.max(0,-Math.sin(walk)*0.04)),-swing*0.14, 0.40, 0.12, 0.44, shadeHex(pantsCol, 0.55));

    // ── Thighs (upper leg, knee bend) ──
    const kneeY = 1.42 + (jumping?0.05:Math.max(0, Math.sin(walk)*0.05));
    local(-0.26, kneeY - bend*0.35, swing*0.16, 0.46, 0.82*squash, 0.48, pantsCol);
    local( 0.26, kneeY + bend*0.35,-swing*0.16, 0.46, 0.82*squash, 0.48, pantsCol);

    // ── Torso (wide shoulders, separate from legs) ──
    local(0, 1.95, 0, 1.06, 0.96*squash, 0.52, torsoCol, shadeHex(torsoCol, 1.12)); // body block
    local(0, 2.02, 0.27, 0.92, 0.80*squash, 0.05, shirtCol, shirtCol);              // shirt front
    local(-0.56, 1.95, 0, 0.10, 0.96*squash, 0.52, shadeHex(torsoCol, 0.68));       // left side
    local( 0.56, 1.95, 0, 0.10, 0.96*squash, 0.52, shadeHex(torsoCol, 0.68));       // right side
    local(0, 2.60, 0, 1.06, 0.05, 0.52, trimCol, trimCol);                          // waist belt

    // ── Thick neck ──
    local(0, 2.70, 0, 0.38, 0.18, 0.38, skin);

    // ── Upper arms (shoulder → elbow) ──
    local(-0.74, 2.02 + (jumping?0.10:0), -swing*0.30, 0.34, 0.42*squash, 0.40, torsoCol); // left upper arm
    local(-0.74, 1.70 + (jumping?0.10:0), -swing*0.30, 0.32, 0.30, 0.38, skin);            // left elbow
    local( 0.74, 2.02 + (jumping?0.10:0),  swing*0.30, 0.34, 0.42*squash, 0.40, torsoCol); // right upper arm
    local( 0.74, 1.70 + (jumping?0.10:0),  swing*0.30, 0.32, 0.30, 0.38, skin);            // right elbow

    // ── Forearms (elbow → wrist) ──
    const fArmSwing = swing * 0.75;
    local(-0.96, 1.46 + (jumping?0.14:0), -fArmSwing*0.45, 0.30, 0.40*squash, 0.34, torsoCol); // left forearm
    local(-0.96, 1.18 + (jumping?0.14:0), -fArmSwing*0.45, 0.32, 0.20, 0.32, skin);           // left hand
    local( 0.96, 1.46 + (jumping?0.14:0),  fArmSwing*0.45, 0.30, 0.40*squash, 0.34, torsoCol); // right forearm
    local( 0.96, 1.18 + (jumping?0.14:0),  fArmSwing*0.45, 0.32, 0.20, 0.32, skin);           // right hand

    // ── Big blocky Roblox head (1:1:1 proportions) ──
    local(0, 3.10, 0, 0.90, 0.90, 0.90, skin, shadeHex(skin, 1.08));

    // ── Ears ──
    local(-0.50, 3.08, 0.32, 0.10, 0.26, 0.20, skin);
    local( 0.50, 3.08, 0.32, 0.10, 0.26, 0.20, skin);

    // ── Hair ──
    if(hair === 'short'){
      local(0, 3.34, 0.14, 0.94, 0.26, 0.86, preset.hairColor || '#2a2236');
      local(-0.52, 3.22, 0, 0.12, 0.22, 0.90, preset.hairColor || '#2a2236');
      local( 0.52, 3.22, 0, 0.12, 0.22, 0.90, preset.hairColor || '#2a2236');
    } else if(hair === 'long'){
      local(0, 3.36, 0.16, 0.96, 0.36, 0.88, preset.hairColor || '#2a2236');
      local(0, 3.10, 0.54, 0.92, 0.48, 0.14, preset.hairColor || '#2a2236'); // back
    } else if(hair === 'afro'){
      local(0, 3.38, 0, 1.06, 0.48, 1.06, preset.hairColor || '#1a1417');
    } else if(hair === 'mohawk'){
      local(0, 3.42, 0.12, 0.50, 0.50, 0.70, preset.hairColor || '#1a1417');
    }

    // ── Face (centered on big head) ──
    const hx = 0, hy = 3.10, hz = 0.47;
    if(face === 'cool'){
      local(hx, hy + 0.02, hz, 0.84, 0.18, 0.05, '#141a16', '#222a26'); // shades
      local(hx - 0.22, hy - 0.02, hz + 0.02, 0.14, 0.14, 0.03, skin);
      local(hx + 0.22, hy - 0.02, hz + 0.02, 0.14, 0.14, 0.03, skin);
      local(hx, hy - 0.06, hz, 0.30, 0.06, 0.03, '#3d2b2b'); // closed cool mouth
    } else if(face === 'happy'){
      local(hx - 0.20, hy + 0.04, hz, 0.13, 0.15, 0.04, '#141a16');
      local(hx + 0.20, hy + 0.04, hz, 0.13, 0.15, 0.04, '#141a16');
      local(hx, hy - 0.06, hz, 0.42, 0.14, 0.04, '#e85d75', '#ff8aa0'); // smile
      local(hx - 0.28, hy + 0.10, hz + 0.02, 0.06, 0.09, 0.02, shadeHex(skin,0.7)); // left blush
      local(hx + 0.28, hy + 0.10, hz + 0.02, 0.06, 0.09, 0.02, shadeHex(skin,0.7)); // right blush
    } else if(face === 'fierce'){
      local(hx - 0.22, hy + 0.03, hz, 0.15, 0.09, 0.04, '#141a16');
      local(hx + 0.22, hy + 0.03, hz, 0.15, 0.09, 0.04, '#141a16');
      local(hx - 0.18, hy - 0.02, hz, 0.12, 0.13, 0.04, '#141a16');
      local(hx + 0.18, hy - 0.02, hz, 0.12, 0.13, 0.04, '#141a16');
      local(hx, hy - 0.08, hz, 0.26, 0.04, 0.03, '#2a1a1a'); // grim line
    } else {
      local(hx - 0.19, hy + 0.04, hz, 0.13, 0.15, 0.04, '#141a16');
      local(hx + 0.19, hy + 0.04, hz, 0.13, 0.15, 0.04, '#141a16');
      local(hx, hy - 0.05, hz, 0.36, 0.11, 0.04, '#d46a6a', '#e88a8a'); // smirk
      local(hx, hy - 0.03, hz + 0.02, 0.20, 0.05, 0.02, '#b05a5a'); // smirk highlight
    }

    // ── Hats (scaled for bigger head) ──
    if(hat === 'crown'){
      local(0, 3.66, 0, 0.96, 0.26, 0.96, '#d4af53', '#fff0b5');
      local(-0.32, 3.86, 0.32, 0.18, 0.24, 0.18, '#e6c469', '#fff4c8');
      local( 0.32, 3.86, 0.32, 0.18, 0.24, 0.18, '#e6c469', '#fff4c8');
      local(-0.32, 3.86,-0.32, 0.18, 0.24, 0.18, '#e6c469', '#fff4c8');
      local( 0.32, 3.86,-0.32, 0.18, 0.24, 0.18, '#e6c469', '#fff4c8');
      local(-0.40, 3.70,-0.40, 0.09, 0.12, 0.09, '#e6c469');
      local( 0.40, 3.70,-0.40, 0.09, 0.12, 0.09, '#e6c469');
      local(-0.40, 3.70, 0.40, 0.09, 0.12, 0.09, '#e6c469');
      local( 0.40, 3.70, 0.40, 0.09, 0.12, 0.09, '#e6c469');
    } else if(hat === 'tophat'){
      local(0, 3.60, 0, 1.16, 0.12, 1.16, '#181d1a', '#262e29');   // brim
      local(0, 3.90, 0, 0.74, 0.62, 0.74, '#181d1a', '#29322c');   // crown
      local(0, 3.68, 0, 0.78, 0.14, 0.78, trimCol, trimCol);       // band
    } else if(hat === 'visor'){
      local(0, 3.22, 0.36, 0.92, 0.26, 0.26, '#10242b', trimCol);
      local(0, 3.52, 0, 0.88, 0.16, 0.88, '#18242c', '#243844');
    } else if(hat === 'fedora'){
      local(0, 3.62, 0, 0.96, 0.14, 0.96, '#222a26', '#2e3a34');
      local(0, 3.82, 0, 0.54, 0.54, 0.54, '#222a26', '#323e37');
      local(0, 3.68, 0, 0.60, 0.12, 0.60, trimCol, trimCol);
    } else if(hat === 'horns'){
      local(-0.28, 3.74, 0.18, 0.18, 0.56, 0.18, '#181d1a', '#262e29', facing+0.35);
      local( 0.28, 3.74, 0.18, 0.18, 0.56, 0.18, '#181d1a', '#262e29', facing-0.35);
      local(0, 3.62, 0, 0.82, 0.24, 0.82, '#181d1a', '#262e29');
    } else if(hat === 'halo'){
      const bob = Math.sin(time * 3.2) * 0.06;
      local(0, 3.86 + bob, 0, 0.92, 0.12, 0.92, '#ebd07e', '#fff6cf');
      local(0, 3.96 + bob, 0, 0.56, 0.34, 0.56, '#fff6cf', '#ffffff');
    } else if(hat === 'valkyrie_helm'){
      local(0, 3.62, 0, 0.94, 0.18, 0.94, '#1a2a3a', '#2a4055');
      local(0, 3.88, 0, 0.38, 0.68, 0.38, '#1a2a3a', '#324a62');
      local(-0.32, 4.00, 0.24, 0.14, 0.38, 0.14, '#b88928', '#e8a858');
      local( 0.32, 4.00, 0.24, 0.14, 0.38, 0.14, '#b88928', '#e8a858');
    }

    // ── Accessories (scaled for bigger body) ──
    if(accessory === 'cape'){
      const wave = Math.sin(time * 3.5 + walk) * 0.10;
      local(0, 2.10, -0.38 - wave, 0.06, 0.38, 0.60, '#2a1414');          // clasp
      local(0, 2.10, -0.36 - wave, 1.04, 1.00, 0.74, torsoCol, shadeHex(torsoCol, 0.82));
      local(0, 1.10, -0.34 - wave, 0.80, 0.90, 0.66, torsoCol, shadeHex(torsoCol, 0.78));
    } else if(accessory === 'wings'){
      const flap = jumping ? 1.1 : Math.abs(Math.sin(time * 5)) * 0.80;
      const side = 0.72 + flap * 0.50;
      local(-side, 2.00, -0.36, 0.06, 0.68, 0.82, '#8a6b25', '#c8a85a');
      local( side, 2.00, -0.36, 0.06, 0.68, 0.82, '#8a6b25', '#c8a85a');
      local(-side-0.28, 1.55, -0.34, 0.06, 0.76, 0.90, '#b88928', '#f2d482');
      local( side+0.28, 1.55, -0.34, 0.06, 0.76, 0.90, '#b88928', '#f2d482');
    } else if(accessory === 'jetpack'){
      const flame = jumping ? (Math.abs(Math.sin(time * 22)) * 0.30 + 0.22) : 0;
      local(-0.38, 2.02, -0.40, 0.20, 0.50, 0.38, '#181d1a', '#262e29');
      local( 0.38, 2.02, -0.40, 0.20, 0.50, 0.38, '#181d1a', '#262e29');
      local(0, 2.02, -0.50, 0.64, 0.16, 0.38, '#c8a85a', '#f2d482');
      if(flame > 0){ local(0, 1.02, -0.54, 0.50, flame*1.1, 0.36, '#ff5252', '#ffb347'); }
    } else if(accessory === 'chipbag'){
      local(0.70, 1.62, 0.24, 0.34, 0.52, 0.36, '#1c4d35', '#2e6a4f');
      local(0.70, 1.36, 0.24, 0.26, 0.32, '#d4af52', '#f0d487');
      local(0.70, 1.20, 0.24, 0.18, 0.26, '#f0d487', '#fff4c2');
    } else if(accessory === 'aura'){
      const pulse = 1 + Math.sin(time * 4) * 0.20;
      for(const r of [0, 1.57, 3.14]){
        local(0, 2.15, -0.40, 1.12*pulse, 0.02, 1.12*pulse, '#56e2d9', '#a0f0e8', facing + r);
        local(0, 2.15, -0.40, 0.68*pulse, 0.02, 0.68*pulse, '#b8e6ff', '#e0f7ff', facing + r);
      }
    }
  }

  /* ─── 3D Avatar Preview inside #characterModal ─── */
  function renderPreview(canvas){
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const w = canvas.width = 220, h = canvas.height = 240;
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w*0.5, h*0.42, 12, w*0.5, h*0.5, 130);
    grad.addColorStop(0, '#213a2a');
    grad.addColorStop(1, '#0c1610');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const av = G.Wallet.avatar;
    const proj = createProjector(w, h, 0, 1.75, 4.35, 0, 0.08);
    const polys = [];
    pushBox(polys, proj, 0, -0.12, 0, 1.9, 0.24, 1.9, '#1b3123', '#c8a85a', 0.45);
    pushRobloxAvatar(polys, proj, {
      x:0, y:0, z:0, facing: -0.45, walk: 0.45,
      presetId: av.preset, hatOverride: av.hat, skinOverride: av.skin,
      accessoryOverride: av.accessory, faceOverride: av.face, hairOverride: av.hair, time: performance.now()/1000
    });
    polys.sort((a,b) => b.depth - a.depth);
    for(const p of polys){
      ctx.beginPath();
      ctx.moveTo(p.pts[0].x, p.pts[0].y);
      for(let i=1;i<p.pts.length;i++) ctx.lineTo(p.pts[i].x, p.pts[i].y);
      ctx.closePath();
      ctx.fillStyle = p.fill;
      ctx.fill();
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ─── Platform & World Physics ─── */
  function currentPlatforms(t){
    return obby.platforms.map(p => {
      const ox = p.moveX ? Math.sin(t * p.spd + (p.phase||0)) * p.moveX : 0;
      const prevOx = p.moveX ? Math.sin((t - 0.016) * p.spd + (p.phase||0)) * p.moveX : 0;
      return {...p, cx: p.x + ox, dx: ox - prevOx};
    });
  }

  function stepPhysics(dt, t){
    let mx = 0, mz = 0;
    if(keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1;
    if(keys.has('KeyS') || keys.has('ArrowDown')) mz += 1;
    if(keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if(keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if(keys.has('KeyQ')) cam.yaw -= 1.9 * dt;
    if(keys.has('KeyR')) cam.yaw += 1.9 * dt;
    if(touchMove.active){ mx += touchMove.dx; mz += touchMove.dy; }

    const mag = Math.hypot(mx, mz);
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = sprint ? 12.2 : 8.6;
    if(mag > 0.04){
      const nx = mx / Math.max(1, mag), nz = mz / Math.max(1, mag);
      const cosY = Math.cos(cam.yaw), sinY = Math.sin(cam.yaw);
      const wx = nx * cosY + nz * sinY;
      const wz = -nx * sinY + nz * cosY;
      player.vx = wx * speed;
      player.vz = wz * speed;
      player.facing = Math.atan2(wx, wz);
      player.walkPhase += dt * (sprint ? 14 : 10) * Math.min(1, mag);
    } else {
      player.vx *= Math.pow(0.001, dt);
      player.vz *= Math.pow(0.001, dt);
    }

    if(player.grounded) player.coyoteMs = 120;
    else player.coyoteMs = Math.max(0, player.coyoteMs - dt * 1000);

    if(keys.has('Space') && player.coyoteMs > 0){
      player.vy = 11.4;
      player.grounded = false;
      player.coyoteMs = 0;
      S.click();
    }

    const prevY = player.y;
    player.x += player.vx * dt;
    player.z += player.vz * dt;
    player.vy -= 26.5 * dt;
    player.y += player.vy * dt;

    // World bounds (Grand Floor + North Obby Canyon)
    player.x = Math.max(-23, Math.min(23, player.x));
    player.z = Math.max(-71, Math.min(28, player.z));

    // Solid station collisions on ground floor
    if(player.y < 2.2){
      for(const st of STATIONS){
        const hw = st.w*0.5 + 0.52, hd = st.d*0.5 + 0.52;
        if(Math.abs(player.x - st.x) < hw && Math.abs(player.z - st.z) < hd && player.y < st.h){
          const ox = hw - Math.abs(player.x - st.x), oz = hd - Math.abs(player.z - st.z);
          if(ox < oz) player.x += player.x < st.x ? -ox : ox;
          else player.z += player.z < st.z ? -oz : oz;
        }
      }
    }

    // Obby platforms & hazards
    player.grounded = false;
    const plats = currentPlatforms(t);
    for(const p of plats){
      const hw = p.w*0.5 + 0.32, hd = p.d*0.5 + 0.32, topY = p.y + p.h*0.5;
      if(p.kind === 'hazard'){
        if(Math.abs(player.x - p.cx) < hw && Math.abs(player.z - p.z) < hd && player.y + 1.8 > p.y - p.h*0.5 && player.y < topY + 0.25){
          S.lose();
          G.toast('Laser hazard! Warped back to your checkpoint.','bad');
          player.x = player.checkpoint.x; player.y = player.checkpoint.y + 0.2; player.z = player.checkpoint.z;
          player.vx = player.vy = player.vz = 0;
          return plats;
        }
        continue;
      }
      if(Math.abs(player.x - p.cx) <= hw && Math.abs(player.z - p.z) <= hd){
        if(player.vy <= 0 && prevY >= topY - 0.38 && player.y <= topY + 0.12){
          player.y = topY;
          player.vy = 0;
          player.grounded = true;
          if(p.dx) player.x += p.dx;
          if(p.kind === 'checkpoint' && player.checkpoint.z > p.z + 1){
            player.checkpoint = {x: p.cx, y: topY, z: p.z};
            S.win();
            G.toast('Obby Checkpoint reached!','good');
          } else if(p.kind === 'summit' && t > player.obbyCooldown){
            player.obbyCooldown = t + 8;
            const granted = G.Wallet.grant(obby.reward);
            G.Wallet.unlockAchievement('obby_master');
            S.big(); G.confetti();
            G.toast(`SKY OBBY CONQUERED (${obby.difficulty.toUpperCase()})! +${fmt(granted||obby.reward)} chips!`,'good');
            player.checkpoint = {x: 0, y: 0, z: 21};
            player.x = 0; player.y = 0.2; player.z = -23; player.vy = 0;
          }
        }
      }
    }

    // Main floor (z >= -28.5 is solid marble floor; z < -28.5 is the Sky Obby canyon!)
    if(player.z >= -28.5){
      if(player.y <= 0){ player.y = 0; player.vy = 0; player.grounded = true; }
    } else if(player.y < -6){
      S.lose();
      G.toast('Fell from the Sky Obby! Back to checkpoint.','info');
      player.x = player.checkpoint.x; player.y = player.checkpoint.y + 0.2; player.z = player.checkpoint.z;
      player.vx = player.vy = player.vz = 0;
    }

    // Proximity check for interactive stations
    nearStation = null;
    let bestD = 4.6;
    for(const st of STATIONS){
      const dist = Math.hypot(player.x - st.x, player.z - st.z);
      if(dist < bestD && player.y < 2.6){ bestD = dist; nearStation = st; }
    }
    const prompt = $('#worldPrompt');
    if(prompt){
      prompt.classList.toggle('hidden', !nearStation);
      if(nearStation){
        $('#worldPromptTitle').textContent = nearStation.name;
        $('#worldPromptSub').textContent = nearStation.sub;
      }
    }
    if(t - presenceTimer > 1.5){
      presenceTimer = t;
      G.Floor?.setWorldPos(player.x, player.z, 'world');
    }
    return plats;
  }

  function triggerStation(st){
    if(!st) return;
    S.chip();
    if(st.kind === 'modal') G.Modal.open(st.modal);
    else G.showView(st.id);
  }

  /* ─── Full 3D Scene Renderer ─── */
  function renderScene(plats, t){
    const canvas = $('#worldCanvas');
    if(!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(380, Math.floor(rect.height));
    if(canvas.width !== Math.floor(w*dpr) || canvas.height !== Math.floor(h*dpr)){
      canvas.width = Math.floor(w*dpr);
      canvas.height = Math.floor(h*dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Royal Night Dome Sky with Stars & Moon
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#050d09');
    sky.addColorStop(0.48, '#0f2319');
    sky.addColorStop(1, '#09150f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Stars (subtle, twinkling)
    ctx.fillStyle = '#ffffff';
    const starSeed = Math.floor(t * 0.5);
    const starCount = 24;
    for(let i=0;i<starCount;i++){
      const sx = ((i*37 + starSeed) % w) + Math.sin(t + i)*2;
      const sy = ((i*53 + starSeed*2) % (h*0.45)) + Math.cos(t*0.7 + i)*2;
      const tw = Math.abs(Math.sin(t*3 + i)) * 0.6 + 0.4;
      ctx.globalAlpha = tw;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    // Moon
    const moonX = w * 0.78, moonY = h * 0.16;
    const moonG = ctx.createRadialGradient(moonX-8, moonY-8, 2, moonX, moonY, 22);
    moonG.addColorStop(0, '#fdfae3');
    moonG.addColorStop(0.45, '#e8d4a8');
    moonG.addColorStop(1, 'rgba(232,212,168,0)');
    ctx.fillStyle = moonG;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI*2);
    ctx.fill();

    // Camera orbit position around player's shoulder
    const targetY = player.y + 1.85;
    const camX = player.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
    const camY = Math.max(0.8, targetY + Math.sin(cam.pitch) * cam.dist);
    const camZ = player.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
    const proj = createProjector(w, h, camX, camY, camZ, cam.yaw, cam.pitch);

    const polys = [];
    clickableBoxes = [];

    // 2. Tiled Grand Casino Floor & Red-Gold Royal Carpet
    for(let gx=-20; gx<=20; gx+=8){
      for(let gz=-24; gz<=24; gz+=8){
        const isCarpet = Math.abs(gx) <= 4;
        const checker = ((gx+24)/8 + (gz+24)/8) % 2 === 0;
        const topC = isCarpet ? '#5c1924' : (checker ? '#13261b' : '#172e21');
        pushBox(polys, proj, gx, -0.3, gz, 8, 0.6, 8, '#0b1610', topC);
      }
    }
    // Gold carpet trim rails
    pushBox(polys, proj, -4.15, 0.02, 0, 0.22, 0.05, 52, '#c8a654', '#ecd084');
    pushBox(polys, proj,  4.15, 0.02, 0, 0.22, 0.05, 52, '#c8a654', '#ecd084');

        // Floor grid lines — scale reference so the floor never looks like an empty void
    const gridColor = '#0e2016';
    for(let gx=-20; gx<=20; gx+=4) pushBox(polys, proj, gx, -0.275, 0, 0.05, 0.04, 52, gridColor, gridColor);
    for(let gz=-24; gz<=24; gz+=4) pushBox(polys, proj, 0, -0.275, gz, 52, 0.04, 0.05, gridColor, gridColor);

    // ── Grand perimeter border walls (enclosed casino room feel) ──
    const bw = 1.1, bh = 3.4;
    pushBox(polys, proj, -23.6, bh*0.5, 0, bw, bh, 56, '#14261c', '#1e3a28');   // west wall
    pushBox(polys, proj,  23.6, bh*0.5, 0, bw, bh, 56, '#14261c', '#1e3a28');   // east wall
    pushBox(polys, proj, 0, bh*0.5, -26.6, 56, bh, bw, '#14261c', '#1e3a28');   // south wall
    pushBox(polys, proj, 0, bh*0.5, 26.6, 56, bh, bw, '#14261c', '#1e3a28');   // north wall
    // Wall capitals / crown molding
    pushBox(polys, proj, -23.6, bh + 0.22, 0, bw, 0.42, 56, '#b89443', '#f2da96');
    pushBox(polys, proj,  23.6, bh + 0.22, 0, bw, 0.42, 56, '#b89443', '#f2da96');
    pushBox(polys, proj, 0, bh + 0.22, -26.6, 56, 0.42, bw, '#b89443', '#f2da96');
    pushBox(polys, proj, 0, bh + 0.22, 26.6, 56, 0.42, bw, '#b89443', '#f2da96');

    // Perimeter Columns & Grand Obby Archway
    for(const px of [-21, 21]){
      for(const pz of [-22, -10, 2, 14, 24]){
        pushBox(polys, proj, px, 2.8, pz, 1.1, 5.6, 1.1, '#1a2f22', '#d2b262');
        pushBox(polys, proj, px, 5.75, pz, 1.45, 0.35, 1.45, '#b89443', '#f2da96');
      }
    }
    // North Sky Obby Golden Archway (x: -4..4, z: -25)
    pushBox(polys, proj, -3.4, 2.6, -24.8, 0.9, 5.2, 0.9, '#8c6b25', '#e4c472');
    pushBox(polys, proj,  3.4, 2.6, -24.8, 0.9, 5.2, 0.9, '#8c6b25', '#e4c472');
    pushBox(polys, proj,  0,   5.4, -24.8, 8.2, 0.75, 1.1, '#a88332', '#f7df9c');

    // Hanging golden chandeliers with crystal droplets
    for(const ch of [[-9,-6],[9,-6],[-9,10],[9,10],[0,0]]){
      const cx=ch[0], cz=ch[1];
      const swing = Math.sin(t * 1.2 + cx) * 0.05;
      pushBox(polys, proj, cx+swing, 2.4, cz, 0.04, 1.9, 0.04, '#8a6b25', '#c8a85a');
      pushBox(polys, proj, cx+swing, 0.55, cz, 1.1, 0.55, 1.1, '#c8a85a', '#f7df9c', t * 0.5);
      pushBox(polys, proj, cx+swing, 0.30, cz, 0.7, 0.22, 0.7, '#f2d482', '#fff0b8');
      // Crystal droplets hanging below
      for(const cd of [[-0.28,0.62],[0,0.72],[0.28,0.62],[-0.2,0.85],[0.2,0.85]]){
        pushBox(polys, proj, cx+swing+cd[0], 0.18+cd[1], cz, 0.08, 0.28, 0.08, '#a0e0ff', '#d4f4ff');
        pushBox(polys, proj, cx+swing+cd[0], 0.46+cd[1], cz, 0.10, 0.06, 0.10, '#f2d482', '#fff0b8');
      }
    }

    // Central Golden Fountain (animated water jets + ripples)
    const water = Math.sin(t * 3) * 0.12;
    pushBox(polys, proj, 0, 0.35, 2, 3.8, 0.7, 3.8, '#1e3527', '#265c58');
    pushBox(polys, proj, 0, 0.05, 2, 4.4, 0.12, 4.4, '#14261c', '#1e3a28'); // fountain base ring
    pushBox(polys, proj, 0, 1.25, 2, 1.1, 1.6, 1.1, '#b89444', '#f2da94', t * 0.8);
    pushBox(polys, proj, 0, 1.55 + water, 2, 0.45, 0.5 + water, 0.45, '#a0e0ff', '#d4f4ff', t * 2);
    pushBox(polys, proj, 0.7, 1.45 + water * 0.6, 2, 0.3, 0.35, 0.3, '#a0e0ff', '#d4f4ff');
    pushBox(polys, proj, -0.7, 1.45 + water * 0.6, 2, 0.3, 0.35, 0.3, '#a0e0ff', '#d4f4ff');
    pushBox(polys, proj, 0, 1.45 + water * 0.4, 2.55, 0.20, 0.20, 0.20, '#a0e0ff', '#d4f4ff'); // back jet
    pushBox(polys, proj, 0, 1.45 + water * 0.4, 1.45, 0.20, 0.20, 0.20, '#a0e0ff', '#d4f4ff'); // front jet
    pushBox(polys, proj, 0, 1.15 + water * 0.3, 2, 1.0, 0.10, 1.0, 'rgba(160,224,255,0.5)', '#d4f4ff', t * 1.5); // ripple ring

    // ── Decorative Props: potted plants, banners, VIP statues ──
    const propY = -0.3;
    // Potted plants in corners
    for(const pl of [[-17,-17],[17,-17],[-17,17],[17,17],[-19,-2],[19,-2],[-19,10],[19,10]]){
      const px=pl[0], pz=pl[1];
      pushBox(polys, proj, px, propY + 0.10, pz, 0.5, 0.2, 0.5, '#14261c', '#1e3a28'); // pot
      pushBox(polys, proj, px, propY + 0.28, pz, 0.9, 1.1, 0.9, '#1d4a2e', '#2e6b4f'); // leaves
      pushBox(polys, proj, px, propY + 0.62, pz, 0.7, 0.9, 0.7, '#2e6b4f', '#4a9e6e'); // top leaves
    }
    // Gold banners on walls
    for(const ba of [[-11,1.6,-24],[11,1.6,-24],[-22,1.6,-6],[22,1.6,-6],[-22,1.6,10],[22,1.6,10]]){
      const bx=ba[0], by=ba[1], bz=ba[2];
      const rot = Math.abs(bx) > 20 ? Math.PI/2 : 0;
      pushBox(polys, proj, bx, by, bz, 3.6, 1.6, 0.06, '#8a6b25', '#c8a85a', rot);
      pushBox(polys, proj, bx, by + 0.4, bz, 2.8, 0.8, 0.04, '#f2d482', '#fff0b8', rot);
    }
    // VIP statues in corners (golden busts)
    for(const vs of [[-19,1.2,-12],[19,1.2,-12],[-14,1.2,18],[14,1.2,18]]){
      const vx=vs[0], vy=vs[1], vz=vs[2];
      pushBox(polys, proj, vx, vy, vz, 0.9, 1.6, 0.9, '#c8a85a', '#ecd084'); // pedestal
      pushBox(polys, proj, vx, vy + 1.0, vz, 0.7, 0.8, 0.7, '#f2d482', '#fff0b8'); // bust
      pushBox(polys, proj, vx, vy + 1.55, vz, 0.5, 0.25, 0.5, '#8a6b25', '#c8a85a'); // head
    }

    // 3. All 11 Interactive 3D Game Stations + Leaderboard + Wardrobe
    for(const st of STATIONS){
      const isNear = nearStation && nearStation.id === st.id;
      // Highlight ring underfoot when near
      if(isNear){
        pushBox(polys, proj, st.x, 0.05, st.z, st.w + 1.3, 0.08, st.d + 1.3, '#d8b968', '#fff0b8');
      }
      const tx = st.x, tz = st.z, tw = st.w, th = st.h, td = st.d;
      pushGroundShadow(polys, proj, tx, tz, tw, td, 0.6);

      // ── Neon sign floating above every station ──
      const neonY = th + 0.55;
      neonGlow(ctx, tx, neonY, tz, st, tw*1.05, 0.30, st.accent);
      pushBox(polys, proj, tx, neonY, tz, tw*0.92, 0.22, 0.14, st.color, st.accent, 0, st);
      pushBox(polys, proj, tx, neonY + 0.11, tz, tw*0.86, 0.10, 0.10, '#fff0b8', '#ffffff', 0, st);
      pushGroundShadow(polys, proj, tx, tz, tw*0.96, 0.22, 0.4);

      if(st.id === 'blackjack' || st.id === 'baccarat' || st.id === 'dice' || st.id === 'poker' || st.id === 'war' || st.id === 'caribbean' || st.id === 'paigow' || st.id === 'threecard' || st.id === 'letitride' || st.id === 'reddog' || st.id === 'craps'){
        // ── Solid casino table: four legs, felt top, apron ──
        const legH = 1.35, legW = 0.22, lx = tw*0.5 - 0.30, lz = td*0.5 - 0.30;
        const feltTop = th + 0.02;
        pushBox(polys, proj, tx - lx, legH*0.5, tz - lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx + lx, legH*0.5, tz - lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx - lx, legH*0.5, tz + lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx + lx, legH*0.5, tz + lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx, feltTop + legH + 0.04, tz, tw*0.94, 0.22, td*0.94, shadeHex(st.color,0.78), st.color);
        pushBox(polys, proj, tx, feltTop, tz, tw*0.96, 0.06, td*0.96, st.color, st.top);
        pushBox(polys, proj, tx, feltTop + 0.06, tz, tw*0.98, 0.14, td*0.98, '#8a6b25', '#c8a85a');
        pushBox(polys, proj, tx - tw*0.34, feltTop + 0.20, tz, 0.30, 0.28, 0.30, '#d4af52', '#f0d487');
        pushBox(polys, proj, tx - tw*0.34, feltTop + 0.34, tz, 0.30, 0.06, 0.30, '#f0d487', '#fff4c2');
        // Chip stacks on table
        const chipCols = ['#d4af52','#e85d75','#56e2d9','#c8a85a'];
        for(let cs=0;cs<4;cs++){
          const cAngle = (cs/4)*Math.PI*2 + t*0.3;
          const cx = tx + Math.cos(cAngle)*0.62, cz = tz + Math.sin(cAngle)*0.62;
          pushBox(polys, proj, cx, feltTop + 0.14, cz, 0.22, 0.05, 0.22, chipCols[cs], chipCols[cs]);
          pushBox(polys, proj, cx, feltTop + 0.19, cz, 0.22, 0.05, 0.22, chipCols[cs], chipCols[cs]);
          pushBox(polys, proj, cx, feltTop + 0.24, cz, 0.22, 0.05, 0.22, chipCols[cs], chipCols[cs]);
        }
      }

      if(st.id === 'roulette'){
        // ── Roulette table + spinning wheel + ball ──
        const legH = 1.35, legW = 0.22, lx = tw*0.5 - 0.30, lz = td*0.5 - 0.30;
        pushBox(polys, proj, tx - lx, legH*0.5, tz - lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx + lx, legH*0.5, tz - lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx - lx, legH*0.5, tz + lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx + lx, legH*0.5, tz + lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx, th + 1.4, tz, tw*0.94, 0.22, td*0.94, shadeHex(st.color,0.78), st.color);
        pushBox(polys, proj, tx, th + 1.46, tz, tw*0.96, 0.06, td*0.96, st.color, '#3a1d24');
        pushBox(polys, proj, tx, th + 1.52, tz, tw*0.98, 0.14, td*0.98, '#8a6b25', '#c8a85a');
        pushBox(polys, proj, tx - 0.6, th + 0.30, tz, 1.25, 0.30, 1.25, '#9c7832', '#f0d487', t*2.4, st);
        pushBox(polys, proj, tx - 0.6, th + 0.14, tz, 0.95, 0.06, 0.95, '#141a16', '#222a26', t*2.4, st);
        // Colored roulette pockets (red/black alternating)
        const rPockets = 18;
        for(let rp=0;rp<rPockets;rp++){
          const ra = (rp/rPockets)*Math.PI*2 + t*2.4;
          const rx = tx - 0.6 + Math.cos(ra)*0.48, rz = tz + Math.sin(ra)*0.48;
          const rcol = rp%2===0 ? '#8a1c1c' : '#141a16';
          pushBox(polys, proj, rx, th + 0.18, rz, 0.26, 0.04, 0.26, rcol, rcol, ra + Math.PI/2);
        }
        pushBox(polys, proj, tx - 0.6, th + 0.34, tz - 0.55, 0.14, 0.14, 0.14, '#ffffff', '#eeeeee');
      }

      if(st.id === 'slots'){
        // ── Slot machine: base, cabinet, top light, screen, reels, buttons ──
        const baseY = th + 0.62;
        pushBox(polys, proj, tx, baseY - 0.55, tz, tw*0.9, 0.5, td*0.9, '#181d1a', '#262e29');
        pushBox(polys, proj, tx, baseY + 2.32, tz, tw*0.82, 0.14, td*0.76, '#c8a85a', '#ecd084'); // top cap
        pushBox(polys, proj, tx, baseY + 2.42, tz, tw*0.70, 0.08, td*0.64, '#f2d482', '#fff0b8', 0, st); // top light
        neonGlow(ctx, tx, baseY + 2.46, tz, st, tw*0.80, 0.16, '#f2d482');
        pushBox(polys, proj, tx, baseY + 0.75, tz, tw*0.78, 1.5, td*0.72, '#c8a85a', '#ecd084');
        pushBox(polys, proj, tx, baseY + 0.75 + 0.78 + 0.25, tz, tw*0.72, 0.7, td*0.62, '#141a16', '#222a26');
        pushBox(polys, proj, tx, baseY + 0.75 + 0.78 + 0.25, tz, tw*0.66, 0.62, td*0.56, '#0a0f0c', '#141a16');
        for(const sx of [-0.28, 0, 0.28]) pushBox(polys, proj, tx + sx, baseY + 0.75 + 0.78 + 0.25, tz, 0.55, 0.5, 0.04, '#d4af52', '#fff4c2');
        pushBox(polys, proj, tx, baseY + 0.75 + 0.12, tz, tw*0.4, 0.12, td*0.55, '#8a6b25', '#c8a85a');
        pushBox(polys, proj, tx - 0.14, baseY + 0.75 + 0.12, tz, 0.16, 0.16, 0.04, '#ff5252', '#ffb347');
        pushBox(polys, proj, tx + 0.14, baseY + 0.75 + 0.12, tz, 0.16, 0.16, 0.04, '#56e2d9', '#a0f0e8');
        pushBox(polys, proj, tx, baseY - 0.55 + 0.02, tz, tw*0.5, 0.06, td*0.4, '#f2d482', '#fff4c2');
      }

      if(st.id === 'wheel'){
        // ── Lucky Wheel: central post, base, segmented wheel with colored slices ──
        const standY = th + 1.5;
        pushBox(polys, proj, tx, standY*0.5, tz, 0.30, standY, 0.30, '#8a6b25', '#c8a85a');
        pushBox(polys, proj, tx, th + 0.05, tz, tw*0.8, 0.12, td*0.8, '#4a3818', '#6e521d');
        pushBox(polys, proj, tx, th + 0.30, tz - 0.4, 2.9, 2.9, 0.36, '#c89f44', '#fff0b8', Math.sin(t)*0.18, st);
        // Colored wheel slices (12 segments)
        const wheelSegs = 12;
        for(let s=0;s<wheelSegs;s++){
          const a1 = (s/wheelSegs)*Math.PI*2 + Math.sin(t)*0.18;
          const a2 = ((s+1)/wheelSegs)*Math.PI*2 + Math.sin(t)*0.18;
          const r1 = 1.35, r2 = 1.25;
          const pts = [];
          for(const a of [a1,a2,a2,a1]){
            pts.push({x: tx + Math.cos(a)*r1, z: tz + Math.sin(a)*r1});
            pts.push({x: tx + Math.cos(a)*r2, z: tz + Math.sin(a)*r2});
          }
          // simple projected slice as a thin box approximation
          const midA = (a1+a2)*0.5;
          const mx = tx + Math.cos(midA)*1.30, mz = tz + Math.sin(midA)*1.30;
          const segCol = s%2===0 ? '#ffd984' : '#c89f44';
          pushBox(polys, proj, mx, th + 0.30, mz, 0.75, 0.28, 0.55, segCol, segCol, midA + Math.PI/2, st);
        }
        pushBox(polys, proj, tx, th + 0.30, tz - 0.2, 0.62, 0.62, 0.50, '#6e1d2a', '#ffd984', t*1.9, st);
        pushBox(polys, proj, tx, th + 0.30, tz - 0.62, 0.75, 0.10, 0.75, '#d4af52', '#f0d484');
      }

      if(st.id === 'plinko'){
        // ── Plinko: board frame, pegs, prize buckets ──
        const boardY = th + 0.5;
        pushBox(polys, proj, tx, boardY, tz, tw*0.8, 2.6, 0.22, '#5d3570', '#8a52a8');
        pushBox(polys, proj, tx, boardY + 1.4, tz, tw*0.86, 0.22, 0.22, '#3d2349', '#5a3d68');
        for(let gy=0; gy<5; gy++){
          for(let gx=0; gx<3; gx++){
            const pxo = (gx-1)*0.55, pzo = (gy-1.2)*0.5;
            pushBox(polys, proj, tx + pxo, boardY + 0.4 + gy*0.5, tz + pzo, 0.16, 0.16, 0.16, '#eabfff', '#f2d4ff');
          }
        }
        pushBox(polys, proj, tx - 0.5, boardY - 0.6, tz, 0.42, 0.55, 0.42, '#8a52a8', '#f2d4ff');
        pushBox(polys, proj, tx, boardY - 0.6, tz, 0.42, 0.55, 0.42, '#b88928', '#f0d482');
        pushBox(polys, proj, tx + 0.5, boardY - 0.6, tz, 0.42, 0.55, 0.42, '#56e2d9', '#a0f0e8');
      }

      if(st.id === 'crash'){
        // ── Crash: launchpad + rocket + exhaust flame ──
        const padY = th + 0.05;
        pushBox(polys, proj, tx, padY, tz, tw*0.9, 0.18, td*0.9, '#245c43', '#163a2a');
        pushBox(polys, proj, tx, padY + 0.55, tz, tw*0.62, 0.10, td*0.62, '#c8a85a', '#ecd084');
        const rocketY = th + 0.6 + ((t*1.1)%1.6);
        pushBox(polys, proj, tx, rocketY, tz, 0.55, 1.1, 0.55, '#d9b45b', '#7df0b3', t*1.5, st);
        pushBox(polys, proj, tx, rocketY + 0.7, tz, 0.45, 0.35, 0.45, '#b88928', '#f0d482');
        pushBox(polys, proj, tx - 0.34, rocketY + 0.15, tz, 0.14, 0.45, 0.55, '#c89f44', '#f0d482');
        pushBox(polys, proj, tx + 0.34, rocketY + 0.15, tz, 0.14, 0.45, 0.55, '#c89f44', '#f0d482');
        const flame = Math.abs(Math.sin(t*18))*0.22 + 0.18;
        pushBox(polys, proj, tx, rocketY - flame - 0.30, tz, 0.40, flame*0.9, 0.28, '#ff5252', '#ffb347');
      }

      if(st.id === 'dice'){
        // ── Craps/dice arena: table + two oversized dice ──
        const legH = 1.35, legW = 0.22, lx = tw*0.5 - 0.30, lz = td*0.5 - 0.30;
        pushBox(polys, proj, tx - lx, legH*0.5, tz - lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx + lx, legH*0.5, tz - lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx - lx, legH*0.5, tz + lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx + lx, legH*0.5, tz + lz, legW, legH, legW, shadeHex(st.color,0.55), st.color);
        pushBox(polys, proj, tx, th + 1.4, tz, tw*0.94, 0.22, td*0.94, shadeHex(st.color,0.78), st.color);
        pushBox(polys, proj, tx, th + 1.46, tz, tw*0.96, 0.06, td*0.96, st.color, '#284f78');
        pushBox(polys, proj, tx, th + 1.52, tz, tw*0.98, 0.14, td*0.98, '#8a6b25', '#c8a85a');
        pushBox(polys, proj, tx - 0.45, th + 0.38, tz, 0.52, 0.52, 0.52, '#f2ead8', '#ffffff', t*0.9, st);
        pushBox(polys, proj, tx + 0.45, th + 0.38, tz, 0.52, 0.52, 0.52, '#f2ead8', '#ffffff', -t*0.8, st);
      }

      if(st.id === 'leaderboard'){
        // ── Leaderboard monument: plinth, board, header plaque ──
        pushBox(polys, proj, tx, th*0.5, tz, tw*0.9, th*1.0, td*0.5, st.color, st.top);
        pushBox(polys, proj, tx, th + 0.9, tz, tw*0.86, 1.4, 0.14, '#1a2a1e', '#2a4032');
        pushBox(polys, proj, tx, th + 0.9, tz, tw*0.80, 1.3, 0.06, '#e2cc92', '#f0d487');
        pushBox(polys, proj, tx, th + 1.75, tz, tw*0.5, 0.35, 0.10, '#c7a455', '#f2da94');
      }

      if(st.id === 'wardrobe'){
        // ── Wardrobe: cabinet, mirror, mannequin bust ──
        pushBox(polys, proj, tx, th*0.5, tz, tw*0.8, th*0.9, td*0.6, st.color, st.top);
        pushBox(polys, proj, tx, th + 0.55, tz, tw*0.6, 1.1, 0.10, '#141a16', '#222a26');
        pushBox(polys, proj, tx, th + 1.15, tz, tw*0.66, 0.12, td*0.7, '#c8a85a', '#ecd084');
        pushBox(polys, proj, tx, th + 1.35, tz, tw*0.4, 0.4, td*0.5, '#b88928', '#f0d482');
      }

      if(st.dealer){
        pushGroundShadow(polys, proj, tx + (tx<0?-1.9:1.9), tz, 0.9, 0.7, 0.5);
        pushRobloxAvatar(polys, proj, {x:tx + (tx<0?-1.9:1.9), y:0, z:tz, facing:tx<0?Math.PI*0.5:-Math.PI*0.5, presetId:'pitboss', hatOverride:'none', time:t});
      }
    }

    // 4. Sky Obby Platforms & Treasure Summit (chunky, with glow edges)
    for(const p of plats){
      pushBox(polys, proj, p.cx, p.y, p.z, p.w, p.h, p.d, p.color, p.top);
      pushBox(polys, proj, p.cx, p.y - p.h*0.5 - 0.02, p.z, p.w*0.85, 0.04, p.d*0.85, '#0a1a10', '#1b3a26');
      if(p.kind === 'summit'){
        pushBox(polys, proj, p.cx, p.y + 0.85 + Math.sin(t*3)*0.15, p.z, 1.1, 0.85, 0.85, '#b88928', '#fff2b2', t*1.2);
        pushBox(polys, proj, p.cx, p.y + p.h*0.5 + 0.02, p.z, 1.5, 0.06, 1.5, '#f2d482', '#fff0b8', t*1.5);
      }
    }

    // 5. Roaming NPCs + Live Cross-Tab Online Sessions
    const billboards = [];
    for(const npc of NPCS){
      const ang = t * npc.spd + npc.phase;
      const nx = npc.cx + Math.cos(ang) * npc.rx;
      const nz = npc.cz + Math.sin(ang) * npc.rz;
      const nFacing = Math.atan2(-Math.sin(ang)*npc.rx, Math.cos(ang)*npc.rz);
      pushGroundShadow(polys, proj, nx, nz, 0.9, 0.7, 0.5);
      pushRobloxAvatar(polys, proj, {x:nx, y:0, z:nz, facing:nFacing, walk:t*6 + npc.phase, presetId:npc.preset, hatOverride:npc.hat, skinOverride:npc.skin, hairOverride:npc.hair||'none', time:t});
      const tagPt = proj.project(nx, 3.05, nz);
      if(tagPt && tagPt.z < 36) billboards.push({x:tagPt.x, y:tagPt.y, z:tagPt.z, title:npc.name, sub:npc.chips+' chips', color:'#b8c7a6'});
    }

    if(G.Floor){
      const peers = G.Floor.onlineSessions().filter(s => s.sid !== G.Floor.sessionId);
      peers.forEach((p, idx) => {
        const px = Number.isFinite(p.x) ? p.x : (idx%2?3:-3);
        const pz = Number.isFinite(p.z) ? p.z : 16;
        pushGroundShadow(polys, proj, px, pz, 0.9, 0.7, 0.5);
        pushRobloxAvatar(polys, proj, {x:px, y:0, z:pz, facing:0, walk:t*4, presetId:p.avatar?.preset||'sovereign', hatOverride:p.avatar?.hat, skinOverride:p.avatar?.skin, hairOverride:p.avatar?.hair||'none', time:t});
        const tagPt = proj.project(px, 3.15, pz);
        if(tagPt && tagPt.z < 44) billboards.push({x:tagPt.x, y:tagPt.y, z:tagPt.z, title:(p.loggedIn?'@'+p.username:'Guest')+' [LIVE]', sub:compact(p.balance)+' chips', color:'#8ef0b8'});
      });
    }

    // 6. Local Player Avatar + Ground Shadow
    pushBox(polys, proj, player.x, Math.max(0.02, player.grounded ? player.y + 0.02 : 0.02), player.z, 1.05, 0.03, 0.85, '#050b07', '#070f0a');
    const av = G.Wallet.avatar;
    pushGroundShadow(polys, proj, player.x, player.z, 0.9, 0.7, player.grounded ? 0.6 : 0.25);
    pushRobloxAvatar(polys, proj, {
      x:player.x, y:player.y, z:player.z,
      facing:player.facing, walk:Math.hypot(player.vx, player.vz)>0.4 ? player.walkPhase : 0,
      jumping:!player.grounded,
      presetId:av.preset, hatOverride:av.hat, skinOverride:av.skin,
      accessoryOverride:av.accessory, faceOverride:av.face, hairOverride:av.hair, time:t
    });
    const myName = G.Accounts.current.loggedIn ? '@'+G.Accounts.current.username : 'You (Guest)';
    const myTag = proj.project(player.x, player.y + 3.18, player.z);
    if(myTag) billboards.push({x:myTag.x, y:myTag.y, z:myTag.z, title:myName, sub:compact(G.Wallet.balance)+' chips · '+G.Wallet.vip.tier.name, color:'#f5dfa3', bold:true});

    // Station Floating Labels
    for(const st of STATIONS){
      const pt = proj.project(st.x, st.h + (st.id==='wheel'?4.8:1.65), st.z);
      if(pt && pt.z < 46){
        const active = nearStation && nearStation.id === st.id;
        billboards.push({x:pt.x, y:pt.y, z:pt.z, title:st.name.toUpperCase(), sub:active?'[E] or Click to Open':st.sub, color:active?'#ffe49c':'#e2cc92', station:st, active});
      }
    }
    const obbySign = proj.project(0, 6.5, -24.8);
    if(obbySign && obbySign.z < 55){
      billboards.push({x:obbySign.x, y:obbySign.y, z:obbySign.z, title:`SKY OBBY (${obby.difficulty.toUpperCase()})`, sub:`Reach Summit for +${compact(obby.reward)} Chips`, color:'#7df0d8'});
    }

    // Painter's Sort & Draw Polygons
    polys.sort((a,b) => b.depth - a.depth);
    ctx.lineJoin = 'round';
    for(const p of polys){
      ctx.beginPath();
      ctx.moveTo(p.pts[0].x, p.pts[0].y);
      for(let i=1;i<p.pts.length;i++) ctx.lineTo(p.pts[i].x, p.pts[i].y);
      ctx.closePath();
      // ---- professional volume lighting: vertical gradient per face ----
      if(p.mat === 'metal' || p.mat === 'gold'){
        ctx.fillStyle = p.fill;
        // specular shine on metallic faces
        const light = faceLight(p.side||'+y');
        if(light > 0.6){
          metalSpecular(ctx, p.pts, p.baseCol, light*0.85);
        }
      } else {
        const ys = p.pts.map(pt=>pt.y); const mnY=Math.min(...ys), mxY=Math.max(...ys);
        if(mxY-mnY > 1){
          const g = ctx.createLinearGradient(0, mnY, 0, mxY);
          const light = faceLight(p.side||'+y');
          const c1 = shadeHex(p.baseCol, Math.min(1, light*1.15));
          const c2 = shadeHex(p.baseCol, Math.max(0, light*0.5));
          g.addColorStop(0, c1);
          g.addColorStop(1, c2);
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = p.fill;
        }
      }
      ctx.fill();
      // ---- rim highlight on top edges (sells 3D thickness) ----
      if(p.side === '+y' || p.side === '+x' || p.side === '-x'){
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      } else {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // ── Atmospheric fog — distant objects fade into the royal night sky ──
    const fog = ctx.createLinearGradient(0, h * 0.30, 0, h * 0.95);
    fog.addColorStop(0, 'rgba(5, 13, 9, 0.52)');
    fog.addColorStop(0.55, 'rgba(5, 13, 9, 0.14)');
    fog.addColorStop(1, 'rgba(5, 13, 9, 0.00)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);

    // ── Vignette — focuses the view, sells depth ──
    const vig = ctx.createRadialGradient(w*0.5, h*0.42, w*0.35, w*0.5, h*0.5, w*0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0.00)');
    vig.addColorStop(0.72, 'rgba(0,6,3,0.18)');
    vig.addColorStop(1, 'rgba(0,6,3,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Draw Depth-Sorted 3D Floating Nameplates
    billboards.sort((a,b) => b.z - a.z);
    ctx.textAlign = 'center';
    for(const b of billboards){
      const scale = Math.max(0.62, Math.min(1.08, 13 / b.z));
      const padX = 9 * scale, boxH = 30 * scale;
      ctx.font = `600 ${Math.round(11*scale)}px Outfit, sans-serif`;
      const tw1 = ctx.measureText(b.title).width;
      ctx.font = `400 ${Math.round(9*scale)}px Outfit, sans-serif`;
      const tw2 = ctx.measureText(b.sub).width;
      const bw = Math.max(tw1, tw2) + padX * 2;
      const bx = b.x - bw*0.5, by = b.y - boxH*0.5;
    ctx.fillStyle = b.active ? 'rgba(32, 48, 28, 0.94)' : 'rgba(10, 20, 14, 0.82)';
    ctx.strokeStyle = b.active ? '#f3d98b' : 'rgba(206, 181, 116, 0.42)';
    ctx.lineWidth = b.active ? 1.6 : 1;
    roundRect(ctx, bx, by, bw, boxH, 6*scale);
    ctx.fill();
    ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.font = `600 ${Math.round(11*scale)}px Outfit, sans-serif`;
      ctx.fillText(b.title, b.x, by + 13*scale);
      ctx.fillStyle = b.active ? '#fff2c2' : '#9fb292';
      ctx.font = `400 ${Math.round(9*scale)}px Outfit, sans-serif`;
      ctx.fillText(b.sub, b.x, by + 24*scale);
      if(b.station){
        clickableBoxes.push({tag:b.station, minX:bx, maxX:bx+bw, minY:by, maxY:by+boxH, depth:b.z - 0.5});
      }
    }
  }

  function loop(ts){
    if(!running) return;
    const dt = Math.min(0.05, lastTs ? (ts - lastTs)/1000 : 0.016);
    lastTs = ts;
    worldTime += dt;
    const plats = stepPhysics(dt, worldTime);
    renderScene(plats, worldTime);
    raf = requestAnimationFrame(loop);
  }

  function enterWorld(){
    syncObbyDifficulty();
    if(running) return;
    running = true;
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function leaveWorld(){
    running = false;
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    keys.clear();
    touchMove.active = false; touchMove.dx = 0; touchMove.dy = 0;
  }

  /* ─── Input & HUD Wiring ─── */
  function initWorld(){
    const canvas = $('#worldCanvas');
    if(!canvas) return;

    window.addEventListener('keydown', e => {
      if(G.currentView !== 'world' || G.Modal.active) return;
      if(e.target.closest('input,select,textarea')) return;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if((e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') && nearStation){
        e.preventDefault();
        triggerStation(nearStation);
      }
    });
    window.addEventListener('keyup', e => keys.delete(e.code));
    window.addEventListener('blur', () => keys.clear());

    canvas.addEventListener('pointerdown', e => {
      cam.dragging = true; cam.lastX = e.clientX; cam.lastY = e.clientY; cam.moved = 0;
      try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    });
    canvas.addEventListener('pointermove', e => {
      if(!cam.dragging) return;
      const dx = e.clientX - cam.lastX, dy = e.clientY - cam.lastY;
      cam.lastX = e.clientX; cam.lastY = e.clientY;
      cam.moved += Math.abs(dx) + Math.abs(dy);
      cam.yaw -= dx * 0.0065;
      cam.pitch = Math.max(0.14, Math.min(1.05, cam.pitch + dy * 0.005));
    });
    const endDrag = e => {
      if(!cam.dragging) return;
      cam.dragging = false;
      if(cam.moved < 8){
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
        const hits = clickableBoxes.filter(b => sx>=b.minX && sx<=b.maxX && sy>=b.minY && sy<=b.maxY).sort((a,b)=>a.depth-b.depth);
        if(hits[0]?.tag) triggerStation(hits[0].tag);
      }
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => { cam.dragging = false; });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      cam.dist = Math.max(5.5, Math.min(22, cam.dist + Math.sign(e.deltaY) * 1.1));
    }, {passive:false});

    $('#worldPromptBtn')?.addEventListener('click', () => { if(nearStation) triggerStation(nearStation); });
    $('#worldJumpBtn')?.addEventListener('pointerdown', e => {
      e.preventDefault();
      if(player.coyoteMs > 0 || player.grounded){ player.vy = 11.4; player.grounded = false; player.coyoteMs = 0; S.click(); }
    });
    $('#worldSpawnBtn')?.addEventListener('click', () => {
      player.x = 0; player.y = 0; player.z = 21; player.vx = player.vy = player.vz = 0;
      player.checkpoint = {x: 0, y: 0, z: 21}; S.click();
    });
    $('#worldObbyTeleport')?.addEventListener('click', () => {
      player.x = 0; player.y = 0.8; player.z = -26.5; player.vx = player.vy = player.vz = 0;
      player.facing = 0; cam.yaw = 0; S.chip();
      G.toast(`Teleported to Sky Obby (${obby.difficulty.toUpperCase()})! Jump with Space.`, 'info');
    });

    $$('[data-world-diff]').forEach(btn => btn.addEventListener('click', () => {
      G.Wallet.setAvatar({difficulty: btn.dataset.worldDiff});
      syncObbyDifficulty();
      S.chip();
      G.toast(`Sky Obby set to ${btn.dataset.worldDiff.toUpperCase()} mode!`, 'good');
    }));

    // Quick-jump station pills
    const quickBar = $('#worldQuickGames');
    if(quickBar){
      quickBar.innerHTML = G.LIBRARY.map(g => `<button type="button" class="world-qpill" data-world-goto="${g.id}">${escapeHtml(g.short)}</button>`).join('');
      quickBar.addEventListener('click', e => {
        const b = e.target.closest('[data-world-goto]');
        if(!b) return;
        const st = STATIONS.find(s => s.id === b.dataset.worldGoto);
        if(st){
          player.x = st.x + (st.x < 0 ? 2.6 : st.x > 0 ? -2.6 : 0);
          player.y = 0;
          player.z = st.z + (st.x === 0 ? 2.9 : 0);
          player.facing = Math.atan2(st.x - player.x, st.z - player.z);
          S.click();
        }
      });
    }

    // Mobile virtual thumbstick
    const pad = $('#worldJoyPad'), knob = $('#worldJoyKnob');
    if(pad && knob){
      pad.addEventListener('pointerdown', e => {
        e.preventDefault();
        const r = pad.getBoundingClientRect();
        touchMove.active = true; touchMove.id = e.pointerId;
        touchMove.ox = r.left + r.width*0.5; touchMove.oy = r.top + r.height*0.5;
        try{ pad.setPointerCapture(e.pointerId); }catch(_){}
      });
      pad.addEventListener('pointermove', e => {
        if(!touchMove.active || e.pointerId !== touchMove.id) return;
        const maxR = 34;
        const rx = e.clientX - touchMove.ox, ry = e.clientY - touchMove.oy;
        const dist = Math.hypot(rx, ry), cl = dist > maxR ? maxR / dist : 1;
        const kx = rx * cl, ky = ry * cl;
        knob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;
        touchMove.dx = kx / maxR; touchMove.dy = ky / maxR;
      });
      const resetJoy = e => {
        if(e.pointerId !== touchMove.id) return;
        touchMove.active = false; touchMove.dx = 0; touchMove.dy = 0;
        knob.style.transform = 'translate(0px, 0px)';
      };
      pad.addEventListener('pointerup', resetJoy);
      pad.addEventListener('pointercancel', resetJoy);
    }

    G.on('avatar', syncObbyDifficulty);
  }

  G.World3D = {enter: enterWorld, leave: leaveWorld, renderPreview, stations: STATIONS, player};
  G.games.world = {enter: enterWorld, leave: leaveWorld, player};
  G.hooks.worldInit = initWorld;
})(window.GAR);
