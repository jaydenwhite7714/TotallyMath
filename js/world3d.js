/* Golden Ace Royale — Roblox-Style 3D Casino World, Character Customizer & Sky Obby.
   Pure native 3D perspective engine on HTML5 Canvas: zero external dependencies, works offline & headless. */
(function (G) {
  'use strict';
  const {$, $$, compact, fmt, escapeHtml, S} = G;

  /* ─── 11 Physical 3D Game Stations + Leaderboard Monument + Obby Portal ─── */
  const STATIONS = [
    {id:'wheel',     kind:'game', name:'Lucky Wheel',       sub:'12-Slice Fortune Stage', x:0,   z:-7,  w:3.4, d:2.2, h:1.2, color:'#8a6623', top:'#d9b65c', accent:'#fff0b8'},
    {id:'blackjack', kind:'game', name:'Blackjack',         sub:'Classic 21 · 3:2 Natural',x:-13, z:-13, w:3.2, d:2.2, h:1.05,color:'#16442e', top:'#1f6142', accent:'#e4c982', dealer:'#6f1d2b'},
    {id:'roulette',  kind:'game', name:'European Roulette', sub:'Single-Zero Wheel',      x:-13, z:-3,  w:3.4, d:2.2, h:1.05,color:'#4d1d26', top:'#6e2634', accent:'#e5c67e'},
    {id:'slots',     kind:'game', name:'Golden 777',        sub:'Signature Triple Reels', x:-13, z:7,   w:3.2, d:1.6, h:2.3, color:'#6e521d', top:'#b58b38', accent:'#ffdf8e'},
    {id:'poker',     kind:'game', name:'Video Poker',       sub:'Jacks or Better · 250×', x:-13, z:16,  w:2.8, d:1.6, h:2.2, color:'#1b3550', top:'#29517a', accent:'#8ec5ff'},
    {id:'plinko',    kind:'game', name:'Plinko',            sub:'50× Edge Pyramid',       x:-6.5,z:-19, w:3.0, d:1.5, h:2.9, color:'#3d2349', top:'#5d3570', accent:'#eabfff'},
    {id:'baccarat',  kind:'game', name:'Baccarat',          sub:'VIP Crown Room',         x:13,  z:-13, w:3.2, d:2.2, h:1.05,color:'#164644', top:'#206663', accent:'#e6cf92', dealer:'#1c2e28'},
    {id:'crash',     kind:'game', name:'Crash',             sub:'Live Rocket Multiplier', x:13,  z:-3,  w:3.0, d:2.2, h:2.4, color:'#163a2a', top:'#245c43', accent:'#7df0b3'},
    {id:'hilo',      kind:'game', name:'Hi-Lo',             sub:'Higher or Lower Streak', x:13,  z:7,   w:2.8, d:2.0, h:1.15,color:'#55202b', top:'#7a2d3d', accent:'#f2c5cf'},
    {id:'dice',      kind:'game', name:'Dice',              sub:'36-Outcome Craps Arena', x:13,  z:16,  w:3.2, d:2.2, h:1.05,color:'#1c3652', top:'#284f78', accent:'#b6d8ff'},
    {id:'mines',     kind:'game', name:'Mines',             sub:'5×5 Gem Vault Grid',     x:6.5, z:-19, w:3.0, d:2.6, h:0.85,color:'#18423c', top:'#25635a', accent:'#84f2dc'},
    {id:'leaderboard',kind:'modal',modal:'leaderboardModal',name:'Live Leaderboard',     sub:'Top Vaults & Online Floor',x:0, z:10.5,w:3.4,d:1.1,h:2.8, color:'#1a2a1e', top:'#c7a455', accent:'#fff0be'},
    {id:'wardrobe',  kind:'modal',modal:'characterModal',   name:'Avatar Stylist',        sub:'Pick Roblox Character & Hat',x:-5.5,z:20,w:2.2,d:1.8,h:1.9,color:'#2a2236',top:'#8c6bb5',accent:'#ebd9ff'}
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
    {idx:[0,1,2,3], shade:0.68, top:false}, // -z north
    {idx:[5,4,7,6], shade:0.86, top:false}, // +z south
    {idx:[4,0,3,7], shade:0.62, top:false}, // -x west
    {idx:[1,5,6,2], shade:0.76, top:false}, // +x east
    {idx:[3,2,6,7], shade:1.05, top:true},  // +y top
    {idx:[4,5,1,0], shade:0.42, top:false}  // -y bottom
  ];

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

  function pushBox(polys, proj, x, y, z, w, h, d, color, topColor=null, rotY=0, tag=null){
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
      // 2D cross product backface cull in screen space
      const area = (scr[1].x - scr[0].x)*(scr[2].y - scr[0].y) - (scr[1].y - scr[0].y)*(scr[2].x - scr[0].x);
      if(area >= 0) continue;
      const zAvg = (quadCam[0].z + quadCam[1].z + quadCam[2].z + quadCam[3].z) * 0.25;
      const baseCol = f.top && topColor ? topColor : color;
      polys.push({
        pts: scr,
        depth: zAvg,
        fill: f.top && topColor ? topColor : shadeHex(baseCol, f.shade),
        stroke: 'rgba(8,16,11,0.34)'
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

  /* ─── Articulated 3D Roblox-Style Character Builder ─── */
  function pushRobloxAvatar(polys, proj, opts){
    const {x, y, z, facing=0, walk=0, jumping=false, presetId='highroller', hatOverride=null, skinOverride=null, time=0} = opts;
    const preset = (G.CONFIG.characters||[]).find(c=>c.id===presetId) || G.CONFIG.characters[0];
    const skin = skinOverride || preset.skin || '#f0c79e';
    const hat = hatOverride || preset.hat || 'none';
    const swing = jumping ? 0.55 : Math.sin(walk) * 0.48;
    const cosF = Math.cos(facing), sinF = Math.sin(facing);
    const local = (lx, ly, lz, w, h, d, col, topCol=null) => {
      const wx = x + lx*cosF + lz*sinF;
      const wz = z - lx*sinF + lz*cosF;
      pushBox(polys, proj, wx, y + ly, wz, w, h, d, col, topCol, facing);
    };
    // Legs
    local(-0.23, 0.44 + (jumping?0.08:Math.max(0, Math.sin(walk)*0.08)), swing*0.22, 0.40, 0.88, 0.42, preset.legs);
    local( 0.23, 0.44 + (jumping?0.08:Math.max(0,-Math.sin(walk)*0.08)),-swing*0.22, 0.40, 0.88, 0.42, preset.legs);
    // Torso + Gold/Accent Lapel Stripe
    local(0, 1.34, 0, 0.90, 0.94, 0.46, preset.torso, shadeHex(preset.torso, 1.12));
    local(0, 1.38, 0.24, 0.24, 0.68, 0.05, preset.trim, preset.trim);
    // Arms + Hands
    local(-0.65, 1.34 + (jumping?0.22:0), -swing*0.26, 0.36, 0.86, 0.38, preset.torso);
    local(-0.65, 0.96 + (jumping?0.22:0), -swing*0.26, 0.34, 0.20, 0.36, skin);
    local( 0.65, 1.34 + (jumping?0.22:0),  swing*0.26, 0.36, 0.86, 0.38, preset.torso);
    local( 0.65, 0.96 + (jumping?0.22:0),  swing*0.26, 0.34, 0.20, 0.36, skin);
    // Blocky Head + Eyes
    local(0, 2.14, 0, 0.64, 0.64, 0.64, skin, shadeHex(skin, 1.06));
    local(-0.14, 2.18, 0.33, 0.09, 0.11, 0.04, '#141a16');
    local( 0.14, 2.18, 0.33, 0.09, 0.11, 0.04, '#141a16');
    // Hats & Accessories
    if(hat === 'crown'){
      local(0, 2.54, 0, 0.68, 0.18, 0.68, '#d4af53', '#fff0b5');
      local(-0.22, 2.70, 0.22, 0.14, 0.16, 0.14, '#e6c469', '#fff4c8');
      local( 0.22, 2.70, 0.22, 0.14, 0.16, 0.14, '#e6c469', '#fff4c8');
      local(-0.22, 2.70,-0.22, 0.14, 0.16, 0.14, '#e6c469', '#fff4c8');
      local( 0.22, 2.70,-0.22, 0.14, 0.16, 0.14, '#e6c469', '#fff4c8');
    } else if(hat === 'tophat'){
      local(0, 2.49, 0, 0.86, 0.08, 0.86, '#181d1a', '#262e29');
      local(0, 2.76, 0, 0.58, 0.48, 0.58, '#181d1a', '#29322c');
      local(0, 2.57, 0, 0.60, 0.10, 0.60, preset.trim, preset.trim);
    } else if(hat === 'visor'){
      local(0, 2.20, 0.28, 0.68, 0.18, 0.18, '#10242b', preset.trim);
      local(0, 2.49, 0, 0.66, 0.12, 0.66, '#18242c', '#243844');
    } else if(hat === 'halo'){
      const bob = Math.sin(time * 3.2) * 0.06;
      local(0, 2.74 + bob, 0, 0.66, 0.08, 0.66, '#ebd07e', '#fff6cf');
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
      presetId: av.preset, hatOverride: av.hat, skinOverride: av.skin, time: performance.now()/1000
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

    // 1. Royal Night Dome Sky & Horizon Glow
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#050d09');
    sky.addColorStop(0.48, '#0f2319');
    sky.addColorStop(1, '#09150f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

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

    // Central Golden Fountain
    pushBox(polys, proj, 0, 0.35, 2, 3.8, 0.7, 3.8, '#1e3527', '#265c58');
    pushBox(polys, proj, 0, 1.25, 2, 1.1, 1.6, 1.1, '#b89444', '#f2da94', t * 0.8);

    // 3. All 11 Interactive 3D Game Stations + Leaderboard + Wardrobe
    for(const st of STATIONS){
      const isNear = nearStation && nearStation.id === st.id;
      if(isNear){
        pushBox(polys, proj, st.x, 0.04, st.z, st.w + 1.1, 0.06, st.d + 1.1, '#d8b968', '#fff0b8');
      }
      pushBox(polys, proj, st.x, st.h*0.5, st.z, st.w, st.h, st.d, st.color, st.top, 0, st);
      pushBox(polys, proj, st.x, st.h + 0.08, st.z, st.w*0.86, 0.14, st.d*0.86, st.accent, st.accent, 0, st);
      // Signature 3D toppers per game
      if(st.id === 'wheel'){
        pushBox(polys, proj, st.x, 3.0, st.z - 0.4, 2.8, 2.8, 0.32, '#c89f44', '#fff0b8', Math.sin(t)*0.18, st);
        pushBox(polys, proj, st.x, 3.0, st.z - 0.2, 0.55, 0.55, 0.45, '#6e1d2a', '#ffd984', t*1.9, st);
      } else if(st.id === 'roulette'){
        pushBox(polys, proj, st.x - 0.6, st.h + 0.26, st.z, 1.1, 0.28, 1.1, '#9c7832', '#f0d487', t*2.4, st);
      } else if(st.id === 'slots'){
        for(const sx of [-0.9, 0, 0.9]) pushBox(polys, proj, st.x + sx, st.h + 0.35, st.z, 0.72, 0.55, 0.72, '#d4af52', '#fff4c2', 0, st);
      } else if(st.id === 'plinko'){
        pushBox(polys, proj, st.x, st.h + 0.55, st.z, 1.5, 0.9, 0.8, '#8a52a8', '#f2d4ff', 0, st);
      } else if(st.id === 'crash'){
        const rocketY = st.h + 0.6 + ((t*1.1)%1.6);
        pushBox(polys, proj, st.x, rocketY, st.z, 0.55, 1.1, 0.55, '#d9b45b', '#7df0b3', t*1.5, st);
      } else if(st.id === 'dice'){
        pushBox(polys, proj, st.x - 0.45, st.h + 0.38, st.z, 0.52, 0.52, 0.52, '#f2ead8', '#ffffff', t*0.9, st);
        pushBox(polys, proj, st.x + 0.45, st.h + 0.38, st.z, 0.52, 0.52, 0.52, '#f2ead8', '#ffffff', -t*0.8, st);
      }
      if(st.dealer){
        pushRobloxAvatar(polys, proj, {x:st.x + (st.x<0?-1.9:1.9), y:0, z:st.z, facing:st.x<0?Math.PI*0.5:-Math.PI*0.5, presetId:'pitboss', hatOverride:'none', time:t});
      }
    }

    // 4. Sky Obby Platforms & Treasure Summit
    for(const p of plats){
      pushBox(polys, proj, p.cx, p.y, p.z, p.w, p.h, p.d, p.color, p.top);
      if(p.kind === 'summit'){
        pushBox(polys, proj, p.cx, p.y + 0.85 + Math.sin(t*3)*0.15, p.z, 1.1, 0.85, 0.85, '#b88928', '#fff2b2', t*1.2);
      }
    }

    // 5. Roaming NPCs + Live Cross-Tab Online Sessions
    const billboards = [];
    for(const npc of NPCS){
      const ang = t * npc.spd + npc.phase;
      const nx = npc.cx + Math.cos(ang) * npc.rx;
      const nz = npc.cz + Math.sin(ang) * npc.rz;
      const nFacing = Math.atan2(-Math.sin(ang)*npc.rx, Math.cos(ang)*npc.rz);
      pushRobloxAvatar(polys, proj, {x:nx, y:0, z:nz, facing:nFacing, walk:t*6 + npc.phase, presetId:npc.preset, hatOverride:npc.hat, skinOverride:npc.skin, time:t});
      const tagPt = proj.project(nx, 3.05, nz);
      if(tagPt && tagPt.z < 36) billboards.push({x:tagPt.x, y:tagPt.y, z:tagPt.z, title:npc.name, sub:npc.chips+' chips', color:'#b8c7a6'});
    }

    if(G.Floor){
      const peers = G.Floor.onlineSessions().filter(s => s.sid !== G.Floor.sessionId);
      peers.forEach((p, idx) => {
        const px = Number.isFinite(p.x) ? p.x : (idx%2?3:-3);
        const pz = Number.isFinite(p.z) ? p.z : 16;
        pushRobloxAvatar(polys, proj, {x:px, y:0, z:pz, facing:0, walk:t*4, presetId:p.avatar?.preset||'sovereign', hatOverride:p.avatar?.hat, skinOverride:p.avatar?.skin, time:t});
        const tagPt = proj.project(px, 3.15, pz);
        if(tagPt && tagPt.z < 44) billboards.push({x:tagPt.x, y:tagPt.y, z:tagPt.z, title:(p.loggedIn?'@'+p.username:'Guest')+' [LIVE]', sub:compact(p.balance)+' chips', color:'#8ef0b8'});
      });
    }

    // 6. Local Player Avatar + Ground Shadow
    pushBox(polys, proj, player.x, Math.max(0.02, player.grounded ? player.y + 0.02 : 0.02), player.z, 1.05, 0.03, 0.85, '#050b07', '#070f0a');
    const av = G.Wallet.avatar;
    pushRobloxAvatar(polys, proj, {
      x:player.x, y:player.y, z:player.z,
      facing:player.facing, walk:Math.hypot(player.vx, player.vz)>0.4 ? player.walkPhase : 0,
      jumping:!player.grounded,
      presetId:av.preset, hatOverride:av.hat, skinOverride:av.skin, time:t
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
      ctx.fillStyle = p.fill;
      ctx.fill();
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }

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
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, boxH, 6*scale);
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
