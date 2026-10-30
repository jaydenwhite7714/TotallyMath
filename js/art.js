/* Original Golden Ace vector artwork. All shapes are inline; no image requests. */
(function (G) {
  'use strict';
  const paths={
    logo:'<path fill="currentColor" stroke="none" d="M12 3C9 7 3.5 9 3.5 13.5A4.3 4.3 0 0 0 11 16c0 2-1.2 3.8-3 5h8c-1.8-1.2-3-3-3-5a4.3 4.3 0 0 0 7.5-2.5C20.5 9 15 7 12 3Z"/><path d="m5 3 2 2m10-2-2 2"/>',
    spade:'<path d="M12 3C9 7 4 9 4 13a4 4 0 0 0 7 2.5c0 2.3-1 4-2.5 5h7c-1.5-1-2.5-2.7-2.5-5a4 4 0 0 0 7-2.5c0-4-5-6-8-10Z"/>',
    lobby:'<path d="m3 11 9-8 9 8M5 9v11h5v-6h4v6h5V9"/>',
    cards:'<rect x="9" y="4" width="12" height="17" rx="2"/><path d="m6 3-3 1 2 16 3-.5m7-10-3 3 3 3 3-3Z"/>',
    roulette:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5M5.6 5.6 9 9m6 6 3.4 3.4m0-12.8L15 9m-6 6-3.4 3.4"/>',
    slots:'<rect x="2" y="5" width="18" height="15" rx="3"/><path d="M8 8v9m6-9v9m6-7h2V5m-17 7h1m5 0h1m5 0h1M6 3h10"/><circle cx="22" cy="3" r="1"/>',
    baccarat:'<rect x="2" y="5" width="9" height="15" rx="2"/><rect x="13" y="3" width="9" height="15" rx="2"/><path d="m6.5 10-2 3 2 3 2-3Zm11-2v5m-2.5-2.5h5"/>',
    plinko:'<circle cx="12" cy="4" r="2"/><path d="M8 9h.01M16 9h.01M4 14h.01M12 14h.01M20 14h.01M2 20h20M6 19v3m6-3v3m6-3v3"/>',
    chart:'<path d="M3 3v18h18M6 16l4-4 3 2 7-10m-5 0h5v5"/>',
    hilo:'<path d="M7 20V4m-4 4 4-4 4 4m6-4v16m-4-4 4 4 4-4"/>',
    dice:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.5 7.5h.01m9 0h.01m-4.5 4.5h.01m-4.5 4.5h.01m9 0h.01" stroke-width="3"/>',
    diamond:'<path d="m3 9 4-5h10l4 5-9 12Zm0 0h18M7 4l5 17 5-17M8.5 9h7"/>',
    wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7m0 4v7M3 12h7m4 0h7M6 6l4.5 4.5m3 3L18 18M18 6l-4.5 4.5m-3 3L6 18"/>',
    sound:'<path d="M11 4 6 8H3v8h3l5 4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute:'<path d="M11 4 6 8H3v8h3l5 4Zm5 5 5 6m0-6-5 6"/>',
    settings:'<path d="m9 3-1 3-3 .5-2 3 2 2v2l-2 2 2 3 3 .5 1 3h6l1-3 3-.5 2-3-2-2v-2l2-2-2-3-3-.5-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H7a3 3 0 1 1 3-3Zm0 0h5a3 3 0 1 0-3-3Z"/>',
    key:'<circle cx="8" cy="9" r="5"/><path d="m12 13 8 8m-5-5 3-3m0 6 3-3"/>',
    stats:'<path d="M4 20h16M6 16v-5m6 5V4m6 12V8"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back:'<path d="m14 5-7 7 7 7"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    check:'<path d="m5 12 5 5L20 7"/>',
    crown:'<path d="m3 6 5 4 4-7 4 7 5-4-2 12H5Zm2 15h14"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chip:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2 2m8.8 8.8 2 2m0-12.8-2 2m-8.8 8.8-2 2"/>',
    mine:'<circle cx="12" cy="12" r="5.5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3m0-14-3 3m-8 8-3 3"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/>',
    bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    flame:'<path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4.5 3-6 0 2 1 3 2 3-.5-2.5-.5-5 0-7Z"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0ZM8 6H5a2 2 0 0 0 2 4h1m8-4h3a2 2 0 0 1-2 4h-1M12 13v4m-4 3h8"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>',
    copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5m-9 5-9-5m9 5v10"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 6.5M21.5 19a5.5 5.5 0 0 0-4.5-5.3"/>',
    gamepad:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 12.5h4m-2-2v4m6.5-1h.01m2.5-2h.01"/>',
    minus:'<path d="M5 12h14"/>'
  };
  const suits={
    spade:'M40 8C29 22 12 29 12 44c0 13 17 18 25 8 0 10-5 16-10 20h26c-5-4-10-10-10-20 8 10 25 5 25-8C68 29 51 22 40 8Z',
    heart:'M40 69 12 40C-5 17 24-2 40 20 56-2 85 17 68 40Z',
    diamond:'M40 5 66 40 40 75 14 40Z',
    club:'M34 53C19 68 1 52 10 39c4-6 11-7 17-4C10 9 51-7 54 20c1 5-1 10-4 15 22-10 32 22 10 24-6 0-11-2-15-6 0 8 4 15 10 19H25c6-4 10-11 9-19Z'
  };
  function defs(){
    const el=document.createElementNS('http://www.w3.org/2000/svg','svg');
    el.setAttribute('aria-hidden','true');el.setAttribute('class','svg-defs');
    el.innerHTML='<defs>'+Object.entries(paths).map(([id,p])=>`<symbol id="icon-${id}" viewBox="0 0 24 24">${p}</symbol>`).join('')+
      Object.entries(suits).map(([id,d])=>`<symbol id="suit-${id}" viewBox="0 0 80 80"><path d="${d}"/></symbol>`).join('')+
      '<linearGradient id="metal" x2=".7" y2="1"><stop stop-color="#fff0b4"/><stop offset=".35" stop-color="#d4ae5e"/><stop offset=".6" stop-color="#997037"/><stop offset=".85" stop-color="#e2c17d"/><stop offset="1" stop-color="#83612f"/></linearGradient><linearGradient id="ruby" x2=".8" y2="1"><stop stop-color="#ed8d74"/><stop offset=".45" stop-color="#b4333e"/><stop offset="1" stop-color="#651e29"/></linearGradient><linearGradient id="ivory" x2=".6" y2="1"><stop stop-color="#fffdf3"/><stop offset="1" stop-color="#c8c4b3"/></linearGradient><radialGradient id="felt-art"><stop stop-color="#1e6654"/><stop offset="1" stop-color="#092720"/></radialGradient><pattern id="card-pattern" width="12" height="12" patternUnits="userSpaceOnUse"><path d="m6 0 6 6-6 6-6-6Z" fill="none" stroke="#c9ab68" stroke-opacity=".23" stroke-width=".6"/></pattern></defs>';
    document.body.prepend(el);
  }
  const icon=(name,cls='')=>`<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
  const suitName=s=>({'♠':'spade','♥':'heart','♦':'diamond','♣':'club'}[s]||'spade');
  const suit=(s,cls='')=>`<svg class="suit ${cls}" viewBox="0 0 80 80" fill="currentColor" aria-hidden="true"><use href="#suit-${suitName(s)}"/></svg>`;
  const suitUse=(s,x,y,size,color)=>`<use href="#suit-${suitName(s)}" x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}"/>`;
  function card(r='A',s='♠',back=false){
    const color=['♥','♦'].includes(s)?'#a32f3e':'#1d302d';
    if(back)return'<rect x="0" y="0" width="94" height="136" rx="8" fill="#d0b77d"/><rect x="3" y="3" width="88" height="130" rx="6" fill="#103a32"/><rect x="8" y="8" width="78" height="120" rx="3" fill="url(#card-pattern)" stroke="#b89b5e" stroke-width=".8"/><path d="m47 24 28 44-28 44-28-44Z" fill="#103a32" stroke="#cdb270" stroke-width="1"/>'+suitUse('♠',28,47,38,'url(#metal)')+'<path d="M28 98h38M28 38h38" stroke="#b39354"/>';
    return `<rect y="4" width="94" height="136" rx="8" fill="#080e0b" opacity=".3"/><rect width="94" height="136" rx="8" fill="url(#ivory)" stroke="#fff6db"/><rect x="5" y="5" width="84" height="126" rx="4" fill="none" stroke="#b2a57f" stroke-opacity=".5"/><text x="11" y="25" font-family="Outfit,sans-serif" font-size="20" font-weight="600" fill="${color}">${r}</text>${suitUse(s,10,28,15,color)}${suitUse(s,25,46,44,color)}<g transform="rotate(180 47 68)"><text x="11" y="25" font-family="Outfit,sans-serif" font-size="20" font-weight="600" fill="${color}">${r}</text>${suitUse(s,10,28,15,color)}</g>`;
  }
  function chip(x,y,r=30,color='#255a48',label='100',layers=1){
    let out='';
    for(let i=layers-1;i>=0;i--)out+=`<g transform="translate(${x} ${y-i*5})"><ellipse cy="5" rx="${r}" ry="${r*.57}" fill="#080d0c"/><ellipse cy="2" rx="${r}" ry="${r*.57}" fill="${color}" stroke="#ad935c" stroke-width="1"/><g transform="scale(1 .57)"><circle r="${r}" fill="${color}" stroke="#d0bc8b" stroke-width="2" stroke-dasharray="8 13"/><circle r="${r*.74}" fill="none" stroke="#d7bd80" stroke-width=".8"/><circle r="${r*.62}" fill="#070e0b" fill-opacity=".25"/><text y="5" fill="#f0e2bc" text-anchor="middle" font-size="${r*.4}" font-weight="600" font-family="Outfit,sans-serif">${label}</text></g></g>`;
    return out;
  }
  const point=(deg,r,c=180)=>[c+r*Math.sin(deg*Math.PI/180),c-r*Math.cos(deg*Math.PI/180)];
  function wedge(a,b,outer,inner,c=180){const p=point(a,outer,c),q=point(b,outer,c),u=point(b,inner,c),v=point(a,inner,c);return`M${p}A${outer} ${outer} 0 0 1 ${q}L${u}A${inner} ${inner} 0 0 0 ${v}Z`;}
  function rouletteSvg(){
    const {WHEEL,RL_RED}=G.Rules,seg=360/37;
    let p='<circle cx="180" cy="184" r="177" fill="#050b08"/><circle cx="180" cy="180" r="177" fill="#241f16" stroke="url(#metal)" stroke-width="3"/><circle cx="180" cy="180" r="169" fill="#0b1712" stroke="#78653d" stroke-width="2"/>';
    WHEEL.forEach((n,i)=>{
      const a=i*seg,pt=point(a,145);
      p+=`<path class="roulette-pocket" data-pocket="${n}" d="${wedge(a-seg/2,a+seg/2,162,121)}" fill="${n===0?'#1e7857':RL_RED.has(n)?'#972c3b':'#16231f'}" stroke="#b49a61" stroke-width=".65"/><text x="${pt[0]}" y="${pt[1]+4}" transform="rotate(${a} ${pt[0]} ${pt[1]})" text-anchor="middle" fill="#f4ead4" font-family="Outfit,sans-serif" font-weight="600" font-size="12">${n}</text><path d="${wedge(a-seg/2,a+seg/2,119,87)}" fill="${i%2?'#16382b':'#123024'}" stroke="#ab955a" stroke-width=".5"/>`;
    });
    p+='<circle cx="180" cy="180" r="85" fill="url(#felt-art)" stroke="url(#metal)" stroke-width="4"/><circle cx="180" cy="180" r="71" fill="none" stroke="#bfa364" stroke-opacity=".5"/><path d="M180 121v118m-59-59h118" stroke="#bfa364" stroke-width="5"/><circle cx="180" cy="180" r="39" fill="url(#metal)" stroke="#ffe5a1"/>'+suitUse('♠',159,159,42,'#28362a')+'<circle cx="180" cy="180" r="173" fill="none" stroke="#eed5a1" stroke-width=".8"/>';
    return `<svg width="360" height="360" viewBox="0 0 360 360" class="wheel-vector" aria-hidden="true">${p}</svg>`;
  }
  function prizeSvg(prizes=G.Rules.LUCKY_SEGMENTS){
    const values=prizes,step=360/values.length;
    let p='<circle cx="180" cy="184" r="177" fill="#040906"/><circle cx="180" cy="180" r="175" fill="url(#metal)"/><circle cx="180" cy="180" r="166" fill="#13271f"/>';
    values.forEach((v,i)=>{
      const pt=point(i*step,129),a=i*step;
      p+=`<g class="wheel-segment" data-segment="${i}"><path class="segment-face" d="${wedge(a-step/2,a+step/2,159,48)}" fill="${v>=10?'#b0924e':v===0?'#552c32':i%2?'#123e31':'#1d2923'}" stroke="#a58953" stroke-width="1"/><path class="segment-highlight" d="${wedge(a-step/2+1,a+step/2-1,156,53)}" fill="none" stroke="#f6dfaa" stroke-width="2.4"/><text x="${pt[0]}" y="${pt[1]+7}" transform="rotate(${a} ${pt[0]} ${pt[1]})" text-anchor="middle" font-family="Outfit,sans-serif" font-size="21" font-weight="600" fill="${v>=10?'#17281e':'#e8d8ad'}">${G.short?G.short(v):v}×</text></g>`;
    });
    for(let a=0;a<360;a+=10){const pt=point(a,169);p+=`<circle cx="${pt[0]}" cy="${pt[1]}" r="1.6" fill="#f2d38c"/>`;}
    p+='<circle cx="180" cy="180" r="48" fill="#102d23" stroke="url(#metal)" stroke-width="6"/>'+suitUse('♠',155,155,50,'url(#metal)');
    return `<svg width="360" height="360" viewBox="0 0 360 360" class="wheel-vector" aria-hidden="true">${p}</svg>`;
  }
  function slotSymbol(t){
    let p='';
    if(t==='7')p='<text x="40" y="64" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="67" fill="url(#ruby)" stroke="#df9b73" stroke-width=".8">7</text>';
    if(t==='diamond')p='<path d="M12 29 27 12h26l15 17-28 39Z" fill="#679f9b" stroke="#d9eee4" stroke-width="2"/><path d="m27 12-8 17 21 39 21-39-8-17M12 29h56M27 12l13 17 13-17M19 29h42M40 29v39" fill="none" stroke="#c4e5d9" stroke-width="1.4"/>';
    if(t==='bell')p='<path d="M19 54c8-10 4-22 10-29 7-9 23-6 25 5l2 15 7 9v6H17v-6Z" fill="url(#metal)" stroke="#ffe6a9" stroke-width="1.4"/><path d="M33 65c1 8 13 8 14 0M36 15a4 4 0 0 1 8 0m-17 36h27" fill="none" stroke="#d7b46a" stroke-width="3"/>';
    if(t==='BAR')p='<rect x="7" y="23" width="66" height="35" rx="5" fill="#152921" stroke="#d5bc7d" stroke-width="2"/><rect x="11" y="27" width="58" height="27" rx="2" fill="none" stroke="#d5bc7d" stroke-width=".6"/><text x="40" y="47" text-anchor="middle" font-family="Outfit,sans-serif" font-size="23" font-weight="800" fill="#e4d4ad">BAR</text>';
    if(t==='cherry')p='<path d="M27 42c-1-18 20-10 18-31m3 38c6-12-2-24-3-38" stroke="#84a765" stroke-width="3" fill="none"/><path d="M44 12c18-10 21 3 7 6Z" fill="#72975a"/><circle cx="26" cy="53" r="16" fill="url(#ruby)" stroke="#d36a65"/><circle cx="52" cy="56" r="16" fill="url(#ruby)" stroke="#d36a65"/><path d="M18 46c1-2 3-3 5-3m21 7 3-3" stroke="#f6b194" stroke-width="3" stroke-linecap="round"/>';
    if(t==='lemon')p='<path d="M10 50C8 24 41 9 58 21l11 1-1 11c9 23-28 48-47 28l-10-1Z" fill="#e0bc57" stroke="#ffe89d" stroke-width="2"/><path d="M19 47c0-12 9-22 20-24" fill="none" stroke="#f5dea0" stroke-width="3" stroke-linecap="round"/><path d="m56 21 10-10c-1 11-4 14-10 10" fill="#739663"/>';
    return `<svg viewBox="0 0 80 80" class="slot-symbol" aria-hidden="true">${p}</svg>`;
  }
  function diceFace(n,x=0,y=0,size=78,rotation=0){
    const map={1:[[.5,.5]],2:[[.28,.28],[.72,.72]],3:[[.28,.28],[.5,.5],[.72,.72]],4:[[.28,.28],[.72,.28],[.28,.72],[.72,.72]],5:[[.28,.28],[.72,.28],[.5,.5],[.28,.72],[.72,.72]],6:[[.28,.25],[.72,.25],[.28,.5],[.72,.5],[.28,.75],[.72,.75]]};
    return `<g transform="translate(${x} ${y}) rotate(${rotation} ${size/2} ${size/2})"><rect y="6" width="${size}" height="${size}" rx="${size*.17}" fill="#797e6c"/><rect width="${size}" height="${size}" rx="${size*.17}" fill="url(#ivory)" stroke="#fff4d6" stroke-width="1.5"/>${map[n].map(p=>`<circle cx="${size*p[0]}" cy="${size*p[1]}" r="${size*.067}" fill="#173d30"/>`).join('')}</g>`;
  }
  function gameArt(id){
    let p='';
    if(id==='blackjack')p=`<g transform="translate(105 30) rotate(-18 47 68)">${card('K','♠',true)}</g><g transform="translate(159 22) rotate(12 47 68)">${card('A','♠')}</g>${chip(104,169,30,'#164c3b','100',3)}${chip(241,177,26,'#8d6a39','25',2)}`;
    if(id==='roulette')p=`<g transform="translate(75 -6) scale(.59)">${rouletteSvg()}</g>${chip(252,170,25,'#742d37','25',3)}<circle cx="181" cy="15" r="4" fill="#fff0d3"/>`;
    if(id==='slots')p=`<rect x="68" y="17" width="224" height="169" rx="22" fill="#342d21" stroke="url(#metal)" stroke-width="3"/><rect x="77" y="24" width="206" height="152" rx="15" fill="#18271e" stroke="#9f8552"/><text x="180" y="47" text-anchor="middle" font-family="Cinzel,serif" font-size="16" font-weight="700" fill="#d9be81">GOLDEN 777</text><rect x="87" y="57" width="186" height="96" rx="8" fill="#ebe4cf"/><path d="M150 58v94m61-94v94" stroke="#665632" stroke-width="2"/>${[0,1,2].map(i=>`<g transform="translate(${88+i*62} 68)"><svg width="61" height="73" viewBox="0 0 80 80">${slotSymbol('7').replace(/<svg[^>]*>|<\/svg>/g,'')}</svg></g>`).join('')}<path d="M294 72h14V47" stroke="url(#metal)" stroke-width="7"/><circle cx="308" cy="40" r="12" fill="url(#ruby)" stroke="#cfad6e"/><path d="M103 163h154" stroke="#c1a268"/>`;
    if(id==='poker')p=[['10','♠',-25],['J','♠',-12],['Q','♠',0],['K','♠',12],['A','♠',25]].map(([r,s,rot],i)=>`<g transform="translate(${80+i*29} ${29+Math.abs(i-2)*6}) rotate(${rot} 47 117) scale(.86)">${card(r,s)}</g>`).join('')+chip(254,182,27,'#315167','100',2);
    if(id==='baccarat')p=`<ellipse cx="180" cy="164" rx="142" ry="24" fill="#071910" opacity=".5"/><g transform="translate(93 33) rotate(-12 47 68)">${card('4','♥',true)}</g><g transform="translate(170 28) rotate(12 47 68)">${card('9','♥')}</g><path d="m143 29 9-6 9 6 9-6 9 6-5 12h-26Z" fill="url(#metal)"/>${chip(99,179,29,'#8d6a39','500',3)}${chip(260,175,27,'#194b42','25',3)}`;
    if(id==='plinko'){
      p='<path d="M78 175 180 12l102 163Z" fill="#212536" stroke="#a393bb" stroke-opacity=".3"/>';
      for(let i=0;i<7;i++)for(let j=0;j<i+1;j++)p+=`<circle cx="${180+(j-i/2)*27}" cy="${34+i*20}" r="2.8" fill="#c5bbd1"/>`;
      p+='<path d="m180 12 0 22-14 20 14 20 13 20-13 20 14 20" stroke="#d0b580" stroke-width="1.5" stroke-dasharray="3 4" fill="none"/><circle cx="194" cy="134" r="7" fill="url(#metal)"/>';
      for(let i=0;i<9;i++)p+=`<rect x="${72+i*24}" y="178" width="21" height="15" rx="3" fill="${i<2||i>6?'#ab6e64':'#5d5e7c'}"/>`;
    }
    if(id==='crash')p='<path d="M48 176h266M48 176V32M48 128h266M48 80h266M101 32v144m53-144v144m53-144v144m53-144v144" fill="none" stroke="#719b7f" stroke-opacity=".15"/><path d="M55 169q77-2 119-32t103-99v138H55Z" fill="#649f77" fill-opacity=".13"/><path d="M55 169q77-2 119-32t103-99" fill="none" stroke="#b8cb8f" stroke-width="3"/><circle cx="277" cy="38" r="5" fill="#e9d797"/><text x="101" y="94" font-size="39" font-weight="500" font-family="Outfit,sans-serif" fill="#e9dba9">3.24<tspan font-size="22">×</tspan></text>';
    if(id==='hilo')p=`<g transform="translate(73 38) rotate(-12 47 68) scale(.9)">${card('5','♠')}</g><g transform="translate(202 26) rotate(12 47 68) scale(.9)">${card('Q','♥',true)}</g><path d="M168 75h24m-6-6 7 6-7 6M192 127h-24m6-6-7 6 7 6" fill="none" stroke="#cfb478" stroke-width="2.5"/>`;
    if(id==='dice')p=diceFace(5,83,55,83,-15)+diceFace(3,191,39,87,16)+chip(184,181,23,'#375669','100',2);
    if(id==='mines'){
      for(let i=0;i<5;i++)for(let j=0;j<5;j++){const x=106+j*31,y=24+i*31;const safe=[0,6,7,12,17].includes(i*5+j);p+=`<rect x="${x}" y="${y+3}" width="27" height="27" rx="5" fill="#0b201b"/><rect x="${x}" y="${y}" width="27" height="27" rx="5" fill="${safe?'#24604b':'#1c3c32'}" stroke="#849371" stroke-opacity=".35"/>${safe?`<path d="m${x+6} ${y+11} 4-4h7l4 4-7.5 10Z" fill="#d6c281" stroke="#f2dfa7"/>`:''}`;}
      p+=chip(271,181,24,'#8d6a39','25',2);
    }
    if(id==='wheel')p=`<g transform="translate(74 -7) scale(.6)">${prizeSvg()}</g><path d="m174 5 6 17 6-17Z" fill="#efce8b"/>${chip(266,175,24,'#866436','500',3)}`;
    if(id==='stocks')p=`<rect x="68" y="17" width="224" height="169" rx="22" fill="#342d21" stroke="url(#metal)" stroke-width="3"/><rect x="77" y="24" width="206" height="152" rx="15" fill="#18271e" stroke="#9f8552"/><text x="180" y="47" text-anchor="middle" font-family="Cinzel,serif" font-size="14" font-weight="700" fill="#d9be81">STOCK MARKET</text><path d="M95 110 L130 80 L165 100 L200 70 L235 110 L270 90" fill="none" stroke="#56e2d9" stroke-width="3"/><circle cx="95" cy="110" r="4" fill="#56e2d9"/><circle cx="130" cy="80" r="4" fill="#56e2d9"/><circle cx="165" cy="100" r="4" fill="#56e2d9"/><circle cx="200" cy="70" r="4" fill="#56e2d9"/><circle cx="235" cy="110" r="4" fill="#56e2d9"/><circle cx="270" cy="90" r="4" fill="#56e2d9"/><path d="M103 163h154" stroke="#c1a268"/><circle cx="180" cy="155" r="6" fill="#c8a85a" stroke="#fff" stroke-width="2"/>`;
    if(id==='keno')p=`<rect x="68" y="17" width="224" height="169" rx="22" fill="#342d21" stroke="url(#metal)" stroke-width="3"/><rect x="77" y="24" width="206" height="152" rx="15" fill="#18271e" stroke="#9f8552"/><text x="180" y="47" text-anchor="middle" font-family="Cinzel,serif" font-size="14" font-weight="700" fill="#d9be81">KENO</text><path d="M95 70 L130 90 L165 70 L200 90 L235 70" fill="none" stroke="#56e2d9" stroke-width="3"/><circle cx="95" cy="70" r="3" fill="#56e2d9"/><circle cx="130" cy="90" r="3" fill="#56e2d9"/><circle cx="165" cy="70" r="3" fill="#56e2d9"/><circle cx="200" cy="90" r="3" fill="#56e2d9"/><circle cx="235" cy="70" r="3" fill="#56e2d9"/><path d="M103 163h154" stroke="#c1a268"/><circle cx="180" cy="155" r="6" fill="#c8a85a" stroke="#fff" stroke-width="2"/>`;
    if(id==='war')p=`<g transform="translate(93 33) rotate(-12 47 68)">${card('A','♠')}</g><g transform="translate(170 28) rotate(12 47 68)">${card('K','♥')}</g><path d="M180 120l-20-30 20-30Z" fill="#d4af52" stroke="#fff0b8" stroke-width="2"/><path d="M170 75h20m-10-10v20" fill="none" stroke="#ff5252" stroke-width="2"/><path d="M103 163h154" stroke="#c1a268"/><circle cx="180" cy="155" r="6" fill="#c8a85a" stroke="#fff" stroke-width="2"/>`;
    if(id==='caribbean')p=`<ellipse cx="180" cy="164" rx="142" ry="24" fill="#071910" opacity=".5"/><g transform="translate(93 33) rotate(-12 47 68)">${card('4','♥',true)}</g><g transform="translate(170 28) rotate(12 47 68)">${card('9','♥')}</g><path d="m143 29 9-6 9 6 9-6 9 6-5 12h-26Z" fill="url(#metal)"/>${chip(99,179,29,'#8d6a39','500',3)}${chip(260,175,27,'#194b42','25',3)}`;
    return `<svg class="game-art" viewBox="0 0 360 210" aria-hidden="true"><ellipse cx="180" cy="190" rx="115" ry="12" fill="#040a07" opacity=".35"/>${p}</svg>`;
  }
  function hero(){return `<svg viewBox="0 0 660 430" class="hero-vector" aria-hidden="true"><defs><radialGradient id="hero-halo"><stop stop-color="#517153" stop-opacity=".24"/><stop offset="1" stop-color="#517153" stop-opacity="0"/></radialGradient></defs><ellipse cx="358" cy="250" rx="280" ry="170" fill="url(#hero-halo)"/><path d="M63 359Q176 170 534 86M101 386Q248 207 594 160" fill="none" stroke="#c8a86a" stroke-opacity=".12"/><ellipse cx="383" cy="327" rx="232" ry="59" fill="#030e0a" opacity=".5"/><g transform="translate(286 28) rotate(12 150 150) scale(.89)">${rouletteSvg()}</g><g transform="translate(114 172) rotate(-23 47 68) scale(1.4)">${card('K','♠',true)}</g><g transform="translate(199 151) rotate(9 47 68) scale(1.4)">${card('A','♠')}</g>${chip(443,335,49,'#8d6b3c','500',8)}${chip(535,351,43,'#173f32','100',6)}${chip(351,366,39,'#692f38','25',4)}${chip(489,390,38,'#1a3126','100',1)}<circle cx="434" cy="53" r="5" fill="url(#ivory)"/><path d="M582 109v14m-7-7h14M100 115v9m-4.5-4.5h9" stroke="#d2b879" stroke-opacity=".45"/><path d="m396 413 3-5 3 5-3 5Z" fill="#a78c54" opacity=".5"/></svg>`;}
  G.Art={defs,icon,suit,suitName,card,chip,rouletteSvg,prizeSvg,slotSymbol,diceFace,gameArt,hero};
})(window.GAR);
