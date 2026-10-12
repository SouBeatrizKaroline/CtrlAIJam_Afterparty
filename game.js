'use strict';
// All artwork is drawn in code. No downloads, libraries, or live AI services.
const canvas = document.getElementById('room'), ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const keys = new Set();
const W = 1040, H = 650, TOTAL = 72;
const obstacles = [
  {x:728,y:108,w:255,h:130}, // sofa
  {x:432,y:263,w:198,h:113}, // coffee table
  {x:70,y:116,w:120,h:64}, // record player
  {x:895,y:455,w:76,h:85}, // armchair
  {x:72,y:482,w:122,h:63}, // service dock
  {x:670,y:491,w:155,h:47} // lost-and-found shelf
];
const stories = [
  {name:'A tiny astronaut',icon:'🚀',x:282,y:177,color:'#eee6b9',text:'A toy astronaut with a sticky note: "For your first day at the new job. Go make some space." Someone brought a whole galaxy to a living-room party.'},
  {name:'One very brave speech',icon:'✉',x:857,y:284,color:'#b9d7ec',text:'A crumpled speech: "I know we promised not to make a big deal out of this, but we are so proud of you." The last line is crossed out three times. It just says: "We will miss you."'},
  {name:'The terrible group photo',icon:'▣',x:335,y:488,color:'#ebbbc7',text:'A photo strip. Four friends. Nobody looking at the camera. In the final frame, they are all laughing. A perfect photograph, technically speaking.'},
  {name:'A key with no door',icon:'⚿',x:682,y:357,color:'#edc778',text:'An old apartment key, tied to a ribbon: "Keep it. You always have a place here." So this was a leaving party. Good thing you are here to take care of what is left.'}
];
let state, particles = [], lastTime = 0, mode = 'title', muted = false, quietTouch = false, audio;
function randomGenerator(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function circleHitsRect(x,y,r,o){return Math.hypot(x-Math.max(o.x,Math.min(x,o.x+o.w)),y-Math.max(o.y,Math.min(y,o.y+o.h)))<r;}
function blocked(x,y,r=18){return x<46+r||x>994-r||y<88+r||y>584-r||obstacles.some(o=>circleHitsRect(x,y,r,o));}
function makeTrash(){
  const rand=randomGenerator(1907), items=[];
  for(let i=0;i<TOTAL;i++){
    let x,y; do {x=65+rand()*900;y=110+rand()*450;} while(blocked(x,y,29)||Math.hypot(x-244,y-545)<50||stories.some(s=>Math.hypot(x-s.x,y-s.y)<30));
    const type=i%3;
    items.push({x,y,type,kind:['crumb','cup','paper'][type],angle:rand()*6.28,pulse:rand()*6.28});
  } return items;
}
function freshState(){return {x:244,y:545,angle:-Math.PI/2,noise:0,time:360,bag:[],scrap:0,cleaned:0,sorted:0,found:[],trash:makeTrash(),capacity:12,radius:43,silencer:false,motor:false,combo:0,bump:0,toast:0,elapsed:0,moving:false,vacuum:false,quiet:false};}
state=freshState();
function tone(freq=500,duration=.07,volume=.025,type='sine'){
  if(muted||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);
}
function initAudio(){try {audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{/* Audio is optional. */}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');state.toast=3;}
function burst(x,y,color,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*95,vy:(Math.random()-.5)*95,life:.5,color});}
function show(html,newMode){mode=newMode;keys.clear();$('panel').innerHTML=html;$('overlay').classList.remove('hidden');$('prompt').textContent='';$('pause').textContent='Pause';}
function resume(){mode='play';$('overlay').classList.add('hidden');keys.clear();canvas.focus();}
function start(){state=freshState();particles=[];quietTouch=false;$('quiet-touch').textContent='Quiet: off';initAudio();resume();toast('Morning shift online. Hold SPACE to vacuum leftovers.');}
function title(){show(`<div class="eyebrow">ONE ROOM. ONE LAST KINDNESS.</div><h1>The party is over.<br>Your shift is not.</h1><p>You are MOP-01, a tiny cleaning robot with a big heart. Your human fell asleep after their leaving party. Make the room feel like home one last time.</p><div class="steps"><div><b>01 / Tidy up.</b> Hold SPACE to vacuum crumbs, cups, and paper.</div><div><b>02 / Make something of it.</b> Bring your bag to the dock, sort it, and buy upgrades.</div><div><b>03 / Leave a little love.</b> Find four keepsakes. Take them to the Lost & Found shelf.</div><div><b>Shhh.</b> Hold SHIFT for quiet cleaning near the sofa. Let go of SPACE to let the noise settle.</div></div><div class="buttons"><button class="primary" id="start">Clock in →</button></div><p class="hint">WASD / arrows to move · E to interact · 6 minutes until sunrise<br>Original HTML5 game · LEFTOVERS · Don't Wake It</p>`,'title');$('start').onclick=start;}
function pause(){if(mode==='play'){show(`<div class="eyebrow">TAKE A BREATHER</div><h2>Even robots need a break.</h2><p>The clock and the room are paused. Clean all 72 leftovers, empty your bag, and return all four keepsakes to the shelf.</p><div class="buttons"><button class="primary" id="resume">Back to work</button><button id="restart">Start over</button></div>`,'pause');$('resume').onclick=resume;$('restart').onclick=start;}else if(mode==='pause')resume();}
function nearestStory(){return stories.find((s,i)=>!state.found.includes(i)&&Math.hypot(state.x-s.x,state.y-s.y)<49);}
function atDock(){return Math.hypot(state.x-165,state.y-563)<96;}
function atShelf(){return state.x>641&&state.x<855&&Math.abs(state.y-557)<58;}
function interact(){
  if(mode!=='play')return;initAudio();
  if(atDock()){dock();return;}
  if(atShelf()){const count=state.found.filter(i=>!state.returned?.includes(i)).length;if(count){state.returned=[...state.found];tone(780,.2);toast(`${count} keepsake${count>1?'s':''} safe. Some things are not leftovers.`);checkWin();}else toast('Lost & Found: bring the four glowing keepsakes here.');return;}
  const s=nearestStory();if(s){const i=stories.indexOf(s);state.found.push(i);tone(600,.18);show(`<div class="eyebrow">A LITTLE PIECE OF LAST NIGHT · ${state.found.length} / 4</div><div class="item-art">${s.icon}</div><h2>${s.name}</h2><p>${s.text}</p><p class="hint">Saved in your keepsake tray. Return it to the Lost & Found shelf.</p><div class="buttons"><button id="continue" class="primary">Keep it safe →</button></div>`,'story');$('continue').onclick=resume;return;}
  toast('Get closer to a glowing keepsake, the dock, or the Lost & Found shelf.');
}
function dock(){
  show(`<div class="eyebrow">MOP-01 SERVICE STATION</div><h2>Nothing goes to waste.</h2><p><b>${state.scrap} scrap</b> available · ${state.bag.length} leftovers in your bag.<br>Sort leftovers to earn scrap. Each upgrade is permanent for this shift.</p><button id="sort" class="primary" ${state.bag.length?'':'disabled'}>Sort my bag (${state.bag.length}) →</button><button class="upgrade" id="u-radius" ${state.radius>43||state.scrap<12?'disabled':''}><span>Wide-mouth nozzle<small>Vacuum reaches 50% farther.</small></span><b>${state.radius>43?'Installed':'12 scrap'}</b></button><button class="upgrade" id="u-silent" ${state.silencer||state.scrap<15?'disabled':''}><span>Soft little motor<small>Vacuum makes 45% less noise.</small></span><b>${state.silencer?'Installed':'15 scrap'}</b></button><button class="upgrade" id="u-bag" ${state.capacity>12||state.scrap<10?'disabled':''}><span>Bigger-on-the-inside bag<small>Carry 24 leftovers instead of 12.</small></span><b>${state.capacity>12?'Installed':'10 scrap'}</b></button><div class="buttons"><button id="leave">Back to the room →</button></div>`,'dock');
  $('sort').onclick=sorting;$('leave').onclick=resume;
  $('u-radius').onclick=()=>upgrade('radius',65,12);
  $('u-silent').onclick=()=>upgrade('silencer',true,15);
  $('u-bag').onclick=()=>upgrade('capacity',24,10);
}
function upgrade(key,value,cost){if(state.scrap<cost)return;state.scrap-=cost;state[key]=value;tone(880,.12);dock();hud();}
function sorting(){
  if(!state.bag.length){toast('Bag empty. Every leftover gets another chance.');dock();return;}
  const item=state.bag[0],names=['Food crumbs','Plastic cup','Paper napkin'],icons=['●','▱','▧'];
  show(`<div class="eyebrow">SORT & RECYCLE · ${state.bag.length} LEFT</div><h2>Where does this go?</h2><div class="item-art">${icons[item.type]}</div><p><b>${names[item.type]}</b><br>Correct bin: +2 scrap. Wrong bin: +1 scrap and a little clatter.</p><div class="bins"><button id="bin-0">Compost<small>Food scraps</small></button><button id="bin-1">Recycling<small>Plastic cups</small></button><button id="bin-2">Paper<small>Napkins & notes</small></button></div><p class="hint">Choose with 1 / 2 / 3, or click a bin.</p><div class="buttons"><button id="back-dock">Back to dock</button></div>`,'sort');
  for(let i=0;i<3;i++)$('bin-'+i).onclick=()=>sortItem(i);$('back-dock').onclick=dock;
}
function sortItem(bin){if(mode!=='sort'||!state.bag.length)return;const item=state.bag.shift(),correct=item.type===bin;state.scrap+=correct?2:1;state.sorted++;if(!correct)state.noise=Math.min(100,state.noise+7);tone(correct?800:140,.08,.03);hud();if(state.noise>=100){end(false,'clatter');return;}if(checkWin())return;sorting();}
function checkWin(){if(state.cleaned===TOTAL&&state.bag.length===0&&(state.returned?.length||0)===4){end(true);return true;}return false;}
function end(win,reason){
  tone(win?1046:130,.4,.04);
  show(`<div class="eyebrow">${win?'SHIFT COMPLETE · THE SOFTEST GOODBYE':'SHIFT INTERRUPTED'}</div><h1>${win?'A fresh start.<br>A familiar home.':reason==='time'?'Hello, sunshine.<br>Hello, unfinished chores.':'Oops.<br>Good morning?'}</h1><p>${win?'The room is clean. Four little memories are waiting on the shelf. Your human wakes up to a place that still feels like theirs. You cannot pack a friendship into a moving box. But you can take care of what it leaves behind.':reason==='time'?'Sunrise arrived before the room was ready. A little less wandering and a bigger bag might do the trick.':'Your human woke up. They appreciate the effort, but perhaps the vacuum solo was a little much. Try quiet mode near the sofa and pause your vacuum to let the noise settle.'}</p><div class="steps"><div><b>${state.cleaned} / ${TOTAL}</b> leftovers collected · <b>${state.sorted}</b> sorted</div><div><b>${state.returned?.length||0} / 4</b> keepsakes returned · <b>${Math.floor(state.time/60)}:${String(Math.floor(state.time%60)).padStart(2,'0')}</b> left before sunrise</div></div><div class="buttons"><button id="again" class="primary">${win?'Another little kindness':'Try another shift'} →</button><button id="menu">Main menu</button></div>`,'end');$('again').onclick=start;$('menu').onclick=title;}
function hud(){
  $('progress').textContent=Math.round(state.cleaned/TOTAL*100)+'%';$('clean-count').textContent=`${state.cleaned} / ${TOTAL} leftovers`;
  $('noise').style.width=state.noise+'%';$('noise').style.background=state.noise>75?'#ed927f':state.noise>40?'#eed089':'#b9eb9c';
  $('sleep-label').textContent=state.noise>75?'About to wake!':state.noise>40?'Tossing & turning':'Deep sleep';
  $('found-count').textContent=`${state.returned?.length||0} / 4`;
  $('bag-count').textContent=`Bag ${state.bag.length} / ${state.capacity} · Scrap ${state.scrap}`;
  $('timer').textContent=`${Math.floor(state.time/60)}:${String(Math.floor(state.time%60)).padStart(2,'0')}`;
  $('mode-label').textContent=state.quiet?'Quiet mode · shhh':state.bag.length===state.capacity?'Bag full · visit dock':mode==='play'?'Cleaning shift':'Shift on hold';
}
function update(dt){
  state.elapsed+=dt;state.time=Math.max(0,state.time-dt);state.bump=Math.max(0,state.bump-dt);state.toast-=dt;if(state.toast<0)$('toast').classList.remove('visible');
  const dx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),dy=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  state.quiet=keys.has('ShiftLeft')||keys.has('ShiftRight')||quietTouch;state.moving=!!(dx||dy);state.vacuum=keys.has('Space')&&state.bag.length<state.capacity;
  const length=Math.hypot(dx,dy)||1,speed=state.quiet?95:174,nx=state.x+dx/length*speed*dt,ny=state.y+dy/length*speed*dt;
  if(state.moving){state.angle=Math.atan2(dy,dx);let hit=false;if(!blocked(nx,state.y))state.x=nx;else hit=true;if(!blocked(state.x,ny))state.y=ny;else hit=true;
    if(hit&&state.bump===0){state.noise+=state.quiet?1:4;state.bump=.8;tone(100,.06,.02);burst(state.x,state.y,'#edc778',3);}
  }
  const nearHost=Math.hypot(state.x-840,state.y-173)<230;
  let noiseRate=state.vacuum?(state.quiet?2.2:7.5)*(state.silencer?.55:1)*(nearHost?2.2:1):-10;
  if(state.moving&&!state.quiet)noiseRate+=nearHost?3:1;
  state.noise=Math.max(0,Math.min(100,state.noise+noiseRate*dt));
  if(state.vacuum){
    for(let i=state.trash.length-1;i>=0&&state.bag.length<state.capacity;i--){const t=state.trash[i],dist=Math.hypot(t.x-state.x,t.y-state.y);
      if(dist<state.radius){const pull=Math.min(1,dt*(state.quiet?5:9));t.x+=(state.x-t.x)*pull;t.y+=(state.y-t.y)*pull;
        if(dist<18){state.bag.push(t);state.trash.splice(i,1);state.cleaned++;burst(t.x,t.y,['#efc37b','#92cdd8','#d4afd4'][t.type]);tone(430+state.bag.length*25,.025,.012);if(state.bag.length===state.capacity)toast('Bag full! Bring your leftovers to the dock in the bottom-left corner.');}
      }
    }
  }
  const s=nearestStory();$('prompt').textContent=atDock()?'[E] Dock · sort leftovers & upgrade':atShelf()?'[E] Return keepsakes to Lost & Found':s?`[E] Keep ${s.name.toLowerCase()}`:state.bag.length===state.capacity?'Bag full → visit the bottom-left dock':nearHost?'Near the host · hold SHIFT to clean quietly':'';
  if(state.noise>=100)end(false,'noise');else if(state.time<=0)end(false,'time');else checkWin();
}
// Drawing helpers keep the room's visual language consistent.
function rect(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(x,y,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function text(str,x,y,size=12,color='#d7dcca',align='left'){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(str,x,y);}
function shadow(x,y,w,h,r=10){rect(x+6,y+9,w,h,'#111a3340',r);}
function plant(x,y){ellipse(x,y+10,24,14,'#16263844');rect(x-13,y-8,26,26,'#cf8b74',5);ellipse(x,y-10,15,6,'#e4a38b');for(let i=0;i<7;i++){const a=i*2.399;ctx.save();ctx.translate(x,y-12);ctx.rotate(a);ellipse(0,-16,8,20,i%2?'#549778':'#77ad8b');ctx.restore();}ellipse(x,y-15,7,7,'#a4c68e');}
function drawRoom(t){
  rect(0,0,W,H,'#1c253b');rect(27,55,986,552,'#10192d',19);rect(34,52,972,534,'#303951',12);
  rect(45,88,950,497,'#dab58f');
  // Warm floorboards and inset border.
  for(let y=88;y<585;y+=40){rect(46,y,948,1,'#bb967355');for(let x=45+((y/40|0)%2)*100;x<995;x+=200)line(x,y,x,y+40,'#bb96733a',1);}
  rect(45,61,950,28,'#535477',5);rect(46,83,948,6,'#242e46');rect(45,585,950,12,'#7d6b74');
  // Window, framed prints and string lights stay in this one room.
  rect(425,22,165,63,'#222f49',5);rect(431,28,153,51,'#566b94',2);rect(435,32,145,43,'#8194af');
  const dawn=1-state.time/360;rect(435,32,145,43,`rgba(247,195,136,${dawn*.55})`);line(508,29,508,79,'#25314b',5);line(431,56,585,56,'#25314b',4);
  rect(241,38,47,41,'#d4b88e',3);rect(246,43,37,30,'#718779');ellipse(264,56,9,9,'#d8cb9e');
  rect(311,31,44,47,'#c08d79',3);rect(316,36,34,36,'#cbb6ac');line(320,66,342,44,'#815c7a',5);
  ctx.strokeStyle='#252c45';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(69,61);ctx.bezierCurveTo(350,130,680,5,966,66);ctx.stroke();
  for(let i=0;i<19;i++){const x=75+i*48,y=63+Math.sin(i/3)*14;ellipse(x,y,8,8,'#edbd5c15');ellipse(x,y,3,4,i%3===0?'#db9aac':'#e8ca83');}
  // Rug.
  shadow(300,222,441,233,30);rect(300,222,441,233,'#687f86',30);rect(312,234,417,209,'#9caca3',22);rect(322,244,397,189,'#6c8987',17);
  for(let x=339;x<700;x+=32)line(x,247,x,428,'#84a09b',1);for(let y=252;y<433;y+=28)line(325,y,714,y,'#84a09b',1);
  for(let x=330;x<718;x+=14){line(x,220,x,213,'#9caca3',2);line(x,454,x,461,'#9caca3',2);}
  // Record player cabinet.
  shadow(70,116,120,64);rect(70,116,120,64,'#8a655c',9);rect(75,116,110,54,'#bc8d70',7);rect(82,123,65,40,'#364057',5);ellipse(112,143,17,17,'#202a3e');ellipse(112,143,6,6,'#cf9d81');line(141,126,137,148,'#e3c3a4',3);rect(155,126,21,34,'#3b4258',3);for(let y=130;y<157;y+=5)line(159,y,173,y,'#6a7284',1);text('NO MORE ENCORES',130,202,9,'#795d5a','center');
  // Sofa and sleeping host.
  shadow(728,108,255,130,20);rect(728,108,255,130,'#4c616f',19);rect(734,113,243,35,'#7b9b95',12);rect(740,150,226,72,'#91aaa0',13);line(849,151,849,217,'#76948e',2);rect(728,124,24,109,'#719189',10);rect(957,124,26,109,'#719189',10);
  rect(756,145,47,46,'#dfb47f',11);ctx.save();ctx.translate(829,179);ctx.rotate(-.08);ellipse(27,3,61,24,'#b77e92');rect(-11,-18,69,38,'#d3939e',18);line(20,-13,52,14,'#b27789',2);ellipse(-25,0,18,21,'#e7b594');ellipse(-29,-12,19,13,'#4d3e4b');line(-32,1,-23,2,'#674651',2);rect(73,-7,25,12,'#e5b292',5);rect(94,-9,16,14,'#eee0b4',5);ctx.restore();
  const z=state.noise>75?'!':state.noise>40?'z?':'z';text(z,887,125+Math.sin(t*1.5)*4,19,'#eaf0d3');text('z',909,106+Math.sin(t*1.5+1)*4,13,'#c7ded0');
  // Coffee table with cake remnants.
  shadow(432,263,198,113,24);rect(432,263,198,113,'#86635e',24);rect(432,258,198,108,'#c89574',24);rect(440,265,181,91,'#dbad85',21);
  ellipse(533,310,38,27,'#f0dfb4');ellipse(533,310,30,20,'#caaa94');ctx.fillStyle='#edb8a0';ctx.beginPath();ctx.moveTo(522,294);ctx.lineTo(553,303);ctx.lineTo(522,321);ctx.closePath();ctx.fill();line(536,298,536,280,'#c48da1',4);ellipse(536,278,3,4,'#e9ca86');
  ellipse(465,288,12,9,'#7d685f');ellipse(465,285,12,9,'#dce4c5');ellipse(465,285,8,5,'#976254');rect(573,325,24,17,'#ddd3b4',2);line(579,332,591,332,'#bd9c87',1);
  // Armchair, lamp, party banner, and plants.
  shadow(895,455,76,85);rect(895,455,76,85,'#b37d83',15);rect(906,477,53,45,'#d2a194',12);rect(895,467,13,62,'#c48c89',7);rect(959,467,13,62,'#c48c89',7);
  ellipse(936,367,20,12,'#73636a');line(936,364,936,317,'#60636b',6);ellipse(936,314,35,25,'#f0d194');ellipse(936,306,28,16,'#f8dfad');
  plant(96,295);plant(932,117);plant(251,113);
  text('WE’LL MISS YOU!',523,153,14,'#7e5a68','center');for(let i=0;i<9;i++){const x=379+i*35,y=171;ctx.fillStyle=['#ae728f','#7d9c9a','#d5a565'][i%3];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+24,y);ctx.lineTo(x+12,y+22);ctx.fill();}
  // Dock and sorting bins.
  shadow(72,482,122,63);rect(72,482,122,63,'#566979',9);rect(79,489,108,41,'#8ca399',5);
  for(let i=0;i<3;i++){rect(84+i*33,495,26,28,['#7f9566','#6c98a6','#af85a1'][i],4);text(['C','R','P'][i],97+i*33,514,11,'#eaf0d1','center');}
  rect(113,538,39,13,'#445364',4);text('DOCK & UPGRADES',139,574,10,'#695857','center');ellipse(226,560,17,7,'#f5dfa830');
  // Keepsake shelf.
  shadow(670,491,155,47,7);rect(670,491,155,47,'#846b68',7);rect(677,495,141,32,'#b99980',5);for(let i=0;i<4;i++){rect(685+i*32,501,25,19,'#d9bd9a',4);if(state.returned?.includes(i))text(['★','✉','▣','⚿'][i],697+i*32,516,15,stories[i].color,'center');}text('LOST & FOUND',749,566,10,'#695857','center');
  // Balloons and untouched wall clutter are scenery, not collectible trash.
  for(const b of [{x:214,y:239,c:'#c588a0'},{x:228,y:226,c:'#84a5a1'},{x:208,y:214,c:'#e1b568'}]){line(b.x,b.y+14,224,284,'#aa8b83',1);ellipse(b.x,b.y,12,16,b.c);ellipse(b.x-4,b.y-5,3,5,'#ffffff25');}
  text('MOP-01 / NIGHT SHIFT',52,628,10,'#7687a3');text('A TINY ROBOT. A VERY BIG MESS.',987,628,10,'#7687a3','right');
}
function drawTrash(item){ctx.save();ctx.translate(item.x,item.y);ctx.rotate(item.angle);if(item.type===0){ellipse(1,3,7,4,'#604c4825');rect(-5,-3,9,7,'#e6bc68',2);rect(4,4,4,3,'#b47852',1);rect(-7,5,3,3,'#d69560',1);}else if(item.type===1){ellipse(2,4,7,5,'#604c4825');rect(-5,-8,10,16,'#bd697d',2);ellipse(0,-7,5,2,'#efd1af');line(-3,-4,-3,4,'#e19a9d',2);}else{rect(-7,-6,14,12,'#f1dfbd',2);line(-3,-2,4,2,'#c9b799',1);line(-4,3,2,4,'#c9b799',1);}ctx.restore();}
function drawRobot(t){
  const {x,y,angle,quiet,vacuum,radius}=state;
  if(vacuum){ctx.strokeStyle=quiet?'#efffcf55':'#e2f2a777';ctx.lineWidth=1.5;ctx.setLineDash([4,8]);ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<8;i++){const a=i*Math.PI/4+t*2,r=20+(1-(t*3+i*.13)%1)*(radius-20);line(x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5),'#eaf2c788',2);}}
  ellipse(x+3,y+8,23,18,'#25334c40');ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  rect(-9,-22,19,8,'#354758',3);rect(-9,14,19,8,'#354758',3);ellipse(0,0,22,21,'#415365');ellipse(0,-3,20,19,'#d9dfbc');ellipse(-3,-4,15,14,'#eaf0ce');rect(4,-11,10,17,'#344d59',5);ellipse(9,-7,2,2,'#aee8b4');ellipse(9,1,2,2,'#aee8b4');rect(-13,-6,9,7,quiet?'#a2d5b0':'#dbb27f',3);
  for(let i=0;i<3;i++){const a=t*(vacuum?20:5)+i*2.09;line(18,13,18+Math.cos(a)*9,13+Math.sin(a)*9,'#6c8184',2);}ctx.restore();
  if(quiet)text('shhh',x,y-31,10,'#36574e','center');
}
function draw(t,dt){
  ctx.clearRect(0,0,W,H);drawRoom(t);for(const item of state.trash)drawTrash(item);
  stories.forEach((s,i)=>{if(state.found.includes(i))return;const pulse=1+Math.sin(t*3+i)*.1;ellipse(s.x,s.y,23*pulse,18*pulse,'#f4e5a52a');ctx.strokeStyle='#fcf1c17a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.y,21*pulse,0,Math.PI*2);ctx.stroke();rect(s.x-10,s.y-9,20,18,s.color,4);text(['★','✉','▣','⚿'][i],s.x,s.y+5,16,'#71616c','center');text('✦',s.x+19,s.y-16,13,'#fff0b7','center');});
  drawRobot(t);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(mode==='play'){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}ctx.globalAlpha=Math.max(0,p.life*2);ellipse(p.x,p.y,3,3,p.color);ctx.globalAlpha=1;if(p.life<=0)particles.splice(i,1);}
  // Soft vignette instead of a separate scene or camera transition.
  const gradient=ctx.createRadialGradient(520,310,190,520,310,620);gradient.addColorStop(0,'#18233b00');gradient.addColorStop(1,'#18233b48');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
}
function frame(now){const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(mode==='play')update(dt);hud();draw(now/1000,dt);requestAnimationFrame(frame);}
document.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Escape','Tab'].includes(e.code)&&e.code!=='Tab')e.preventDefault();
  if(e.repeat)return;
  if(e.code==='Escape'){if(mode==='play'||mode==='pause')pause();else if(['dock','sort','story'].includes(mode))resume();return;}
  if(mode==='sort'&&['Digit1','Digit2','Digit3'].includes(e.code)){sortItem(Number(e.code.at(-1))-1);return;}
  if(e.code==='KeyE'){interact();return;}if(mode==='play')keys.add(e.code);
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(mode==='play')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause();});
$('pause').onclick=pause;
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=`Sound: ${muted?'off':'on'}`;if(!muted)initAudio();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen();}catch{toast('Fullscreen is unavailable here. Enable it in the itch.io embed settings.');}};
document.querySelectorAll('[data-key]').forEach(b=>{const release=()=>keys.delete(b.dataset.key);b.onpointerdown=e=>{e.preventDefault();if(mode!=='play')return;initAudio();keys.add(b.dataset.key);b.setPointerCapture(e.pointerId);};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;});
$('quiet-touch').onclick=()=>{quietTouch=!quietTouch;$('quiet-touch').textContent=`Quiet: ${quietTouch?'on':'off'}`;};$('interact-touch').onclick=interact;
title();requestAnimationFrame(frame);
