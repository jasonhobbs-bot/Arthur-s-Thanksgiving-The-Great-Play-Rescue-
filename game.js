/* BACKSTAGE MAYHEM — original offline, static-site HTML5 arcade game. */
(()=>{
'use strict';
const W=1280,H=720,TAU=Math.PI*2,canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id), clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), lerp=(a,b,t)=>a+(b-a)*t, rand=(a,b)=>Math.random()*(b-a)+a;
const STAGES=[
 {name:'CAMPUS CHAOS',short:'Campus Chaos',icon:'🍁',story:'Arthur needs the script for the Thanksgiving play—but the pages have scattered across campus. Race to recover them before the rehearsal begins. Watch for rogue prop carts!',task:'COLLECT 6 SCRIPT PAGES',finish:'The script is safe! Now someone needs to find the missing turkey costume.',spawn:[210,650],world:[2350,1350],exit:[2210,650],colors:['#173c40','#397865','#8cbb98']},
 {name:'THE PROP VAULT',short:'Prop Vault',icon:'🗝️',story:'Somebody locked the turkey costume inside the prop warehouse. Find three access badges, dodge runaway equipment, then open the costume trunk.',task:'FIND 3 ACCESS BADGES + OPEN THE TRUNK',finish:'Turkey costume recovered! But the rehearsal lights are still completely broken.',spawn:[220,650],world:[2350,1350],exit:[2180,650],colors:['#1c2943','#304760','#678ca3']},
 {name:'SPOTLIGHT SHUFFLE',short:'Spotlight Shuffle',icon:'💡',story:'The stage consoles are out of sync. Find four color-coded towers. Stand beside each and tap INTERACT until its light matches its glowing ring. Dodge the roaming spotlights.',task:'CALIBRATE 4 SPOTLIGHT TOWERS',finish:'Every spotlight is back online. One final rehearsal should bring this crew together.',spawn:[220,650],world:[2350,1350],exit:[2200,650],colors:['#221d48','#51408d','#7f75c0']},
 {name:'CURTAIN CALL RUN',short:'Curtain Call Run',icon:'🎬',story:'Now put everything to the test: race through the rehearsal course and hit four glowing checkpoints IN ORDER. Timing, teamwork, and precision win.',task:'REACH 4 CHECKPOINTS IN ORDER',finish:'Rehearsal complete! Oh no—the stage equipment is going haywire. Head to the main theater!',spawn:[210,650],world:[2350,1350],exit:[2200,650],colors:['#421d3f','#8c395c','#d37b7f']},
 {name:'MAYHEM MACHINE',short:'Final Showdown',icon:'🤖',story:'The misfiring Mayhem Machine is wrecking the Thanksgiving finale! Activate three stage lights to weaken it. Then use INTERACT to launch confetti blasts while dodging incoming props.',task:'POWER 3 LIGHTS • DEFEAT THE MACHINE',finish:'A perfect save! The school play goes on—and the audience gives a standing ovation!',spawn:[210,590],world:[2000,1200],exit:[1850,600],colors:['#28153f','#66386c','#b4609e']}
];
const C=['#f46e77','#68c9ff','#ffd56c','#69e7af'];
const SAVE='backstage-mayhem-arcade-v3-30min';
const WAVE_KIND={collect:'checkpoint',checkpoint:'collect',badges:'checkpoint',consoles:'collect',towers:'collect',boss:'boss'};
const ACTS=[
 [{title:'THE WINDSTORM',kind:'collect',hint:'Recover the scattered script before rehearsal.'},{title:'REHEARSAL RELAY',kind:'checkpoint',hint:'Race between rehearsal stations in the right order.'},{title:'THE TURKEY TRAIL',kind:'collect',hint:'Find the trail of clues about the missing turkey role.'},{title:'SHOWTIME SPRINT',kind:'checkpoint',hint:'Follow every glowing marker to restore the script.'}],
 [{title:'SECRET PASS',kind:'badges',hint:'Gather access badges and unlock the storage trunk.'},{title:'PROP CART PURSUIT',kind:'checkpoint',hint:'Dash through the warehouse delivery route.'},{title:'COSTUME CLUES',kind:'collect',hint:'Collect props for a great turkey costume.'},{title:'THE COSTUME VAULT',kind:'badges',hint:'Recover the badges and open the final costume trunk.'}],
 [{title:'POWER CELL DASH',kind:'collect',hint:'Bring power cells back to the lighting room.'},{title:'COLOR CALIBRATION',kind:'consoles',hint:'Recover fuses, then match the rings on the consoles.'},{title:'BACKSTAGE CIRCUIT',kind:'checkpoint',hint:'Carry the signal through each relay checkpoint.'},{title:'THE BIG BLACKOUT',kind:'consoles',hint:'Find backup fuses, then synchronize the final lights.'}],
 [{title:'THE FIRST RUN',kind:'checkpoint',hint:'Follow the course and dodge runaway props.'},{title:'CONFETTI RECOVERY',kind:'collect',hint:'Find the scattered supplies before the show.'},{title:'STAGE DIRECTIONS',kind:'consoles',hint:'Match the color cues to practice the effects.'},{title:'DRESS REHEARSAL',kind:'checkpoint',hint:'Complete the longest, trickiest rehearsal course.'}],
 [{title:'FINAL SUPPLY RUN',kind:'collect',hint:'Collect the supplies to fix the finale.'},{title:'CONTROL DESK',kind:'consoles',hint:'Restore the color-coded control consoles.'},{title:'POWER STATION',kind:'towers',hint:'Activate every glowing power tower.'},{title:'MAYHEM MACHINE',kind:'boss',hint:'Power three spotlights and shut down the machine!'}]
];
const ROUTE=[[365,445],[720,1005],[1040,555],[1480,930],[1810,420],[2120,965],[1740,755],[1305,510],[865,925],[390,1090],[610,335],[1045,820],[1520,630],[2095,350],[2100,1085],[1640,940],[1120,485],[755,730],[400,885],[935,1120]];
const MODE_SPEC={rookie:{label:'PRE-K–1',health:9,speed:258,targets:9,console:4,checkpoints:8,hazard:.65,boss:6},adventure:{label:'GRADES 2–3',health:7,speed:287,targets:12,console:5,checkpoints:11,hazard:.87,boss:9},expert:{label:'GRADES 4–5',health:6,speed:307,targets:16,console:7,checkpoints:15,hazard:1.18,boss:13}};
const modeSpec=()=>MODE_SPEC[st.mode]||MODE_SPEC.adventure;

let save={unlocked:0,bests:{},mode:'adventure',actProgress:{}};
try{const raw=JSON.parse(localStorage.getItem(SAVE)||'{}');if(raw&&typeof raw==='object'){save={...save,...raw,bests:raw.bests||{},actProgress:raw.actProgress||{}};save.unlocked=clamp(Number(save.unlocked)||0,0,5)}}catch{}
const persist=()=>{try{localStorage.setItem(SAVE,JSON.stringify(save))}catch{}};
const st={screen:'menu',mode:MODE_SPEC[save.mode]?save.mode:'adventure',level:0,act:0,wave:0,actElapsed:0,world:null,player:null,cam:{x:0,y:0},elapsed:0,now:0,last:0,score:0,particles:[],floaters:[],burst:[],popupUntil:0,shake:0,goalComplete:false,boss:null,fireballs:[],prompt:'',hudClock:0,attractLeaves:Array.from({length:28},()=>({x:rand(0,W),y:rand(0,H),spd:rand(.5,1.8),s:rand(8,20),rot:rand(0,TAU)}))};
const keys=new Set(),stick={x:0,y:0,pointer:null},touchUI=$('touchUI');let audio=null,muted=false;
const views=['menu','mode','map','briefing','actclear','paused','clear','dead','won'];
const on=(el,ev,fn)=>el.addEventListener(ev,fn);
function beep(type='coin'){
 if(muted)return;
 try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const t=audio.currentTime,os=audio.createOscillator(),gain=audio.createGain();os.connect(gain);gain.connect(audio.destination);let f=550,d=.095,kind='sine',peak=.075;
 if(type==='coin'){f=880;d=.13;kind='triangle'}else if(type==='dash'){f=180;d=.13;kind='sawtooth';peak=.047}else if(type==='hit'){f=120;d=.24;kind='sawtooth';peak=.065}else if(type==='fire'){f=510;d=.085;kind='square';peak=.028}else if(type==='complete'){f=650;d=.27;kind='triangle'}else if(type==='click'){f=370;d=.06;peak=.035}
 os.type=kind;os.frequency.setValueAtTime(f,t);os.frequency.exponentialRampToValueAtTime(type==='hit'?65:type==='fire'?230:f*1.3,t+d);gain.gain.setValueAtTime(0.001,t);gain.gain.exponentialRampToValueAtTime(peak,t+.018);gain.gain.exponentialRampToValueAtTime(.001,t+d);os.start(t);os.stop(t+d+.01)
 }catch{}
}
function showView(view){st.screen=view;$('screen').classList.remove('hidden');views.forEach(v=>$(v).classList.toggle('hidden',v!==view));$('hud').classList.add('hidden');$('progressRail').classList.add('hidden');touchUI.classList.add('hidden');$('gameTip').classList.add('hidden');$('missionPopup').classList.add('hidden')}
function liveView(){st.screen='playing';$('screen').classList.add('hidden');$('hud').classList.remove('hidden');$('progressRail').classList.remove('hidden');touchUI.classList.remove('hidden');$('missionPopup').classList.add('hidden');st.hudClock=0;hudUpdate()}
function popup(title,text,icon='✦'){if(st.screen!=='playing')return;$('popupTitle').textContent=title;$('popupText').textContent=text;$('popupIcon').textContent=icon;$('missionPopup').classList.remove('hidden');st.popupUntil=st.elapsed+3}
function menu(){showView('menu')}
function map(){renderMap();showView('map')}
function renderMap(){let html='';for(let i=0;i<STAGES.length;i++){const s=STAGES[i],locked=i>save.unlocked,best=save.bests[i+'-'+st.mode];html+=`<button type="button" class="stage-node ${locked?'locked':''} ${best?'done':''}" data-stage="${i}" ${locked?'disabled':''}><span>${locked?'🔒':s.icon}</span><small>STAGE 0${i+1}</small><strong>${s.short.toUpperCase()}</strong><small>${best?'✓ '+best.rank+' RANK':'TAP TO PLAY'}</small></button>`}$('stageMap').innerHTML=html;document.querySelectorAll('[data-stage]').forEach(b=>on(b,'click',()=>{if(st.mode)briefLevel(+b.dataset.stage);else showView('mode')}))}
function briefLevel(i){st.level=i;st.act=clamp(save.actProgress[st.mode+'-'+i]||0,0,3);let s=STAGES[i];$('briefingKicker').textContent=`CHAPTER 0${i+1} / 05 • ${modeSpec().label} • 4 ACTS`; $('briefingIcon').textContent=s.icon;$('briefingPosterTitle').textContent=s.name;$('briefingTitle').textContent=s.name;$('briefingStory').textContent=s.story;$('briefingTask').textContent='START WITH ACT '+(st.act+1)+': '+ACTS[i][st.act].title+' • '+ACTS[i][st.act].hint;showView('briefing')}
function freshPlayer(){return{x:STAGES[st.level].spawn[0],y:STAGES[st.level].spawn[1],vx:0,vy:0,face:1,r:24,hp:modeSpec().health,maxHp:modeSpec().health,inv:0,dash:0,dashCD:0,walk:0,knockX:0,knockY:0}}
function pickup(x,y,type='page',extra={}){return{x,y,type,r:25,got:false,phase:rand(0,TAU),...extra}}
function hazard(type,x,y,opts={}){return{type,x,y,ax:x,ay:y,range:160,speed:1.0,phase:rand(0,TAU),r:29,...opts}}
function scenery(x,y,type,extra={}){return{x,y,type,...extra}}
function createBaseWorld(i){const s=STAGES[i],w={w:s.world[0],h:s.world[1],items:[],secrets:[],hazards:[],objects:[],walls:[],decor:[],completed:false,checkpoint:0,lights:0,progress:0};
 if(i===0){w.items=[pickup(392,520),pickup(745,858),pickup(1040,555),pickup(1380,820),pickup(1750,520),pickup(1960,765)];w.hazards=[hazard('cart',615,650,{axis:'y',range:165,speed:1.55}),hazard('pumpkin',1180,675,{axis:'x',range:215,speed:1.6,phase:0}),hazard('cart',1730,670,{axis:'y',range:220,speed:1.75})];w.objects=[{type:'npc',x:440,y:670,dialogue:'Arthur is directing the play. Nobody wants to play the turkey yet—and now the script is gone! Gather every page.',name:'STAGE MANAGER'}];w.walls=[{x:875,y:72,w:640,h:330},{x:1590,y:1020,w:360,h:280}];}
 if(i===1){w.items=[pickup(580,400,'key'),pickup(1140,960,'key'),pickup(1795,400,'key')];w.objects=[{type:'trunk',x:1930,y:940,open:false},{type:'npc',x:400,y:650,name:'PROP MASTER',dialogue:'Three access badges unlock the turkey costume trunk. Watch for the wild stage carts!'}];w.hazards=[hazard('cart',710,680,{axis:'y',range:220,speed:1.25}),hazard('cart',1350,700,{axis:'x',range:185,speed:1.6}),hazard('pumpkin',1780,720,{axis:'y',range:200,speed:1.8})];w.walls=[{x:680,y:50,w:320,h:260},{x:1270,y:970,w:290,h:310},{x:1630,y:70,w:330,h:190}];}
 if(i===2){w.objects=[{type:'console',x:530,y:390,idx:0,sel:3,target:1,locked:false},{type:'console',x:1000,y:910,idx:1,sel:0,target:3,locked:false},{type:'console',x:1440,y:405,idx:2,sel:2,target:0,locked:false},{type:'console',x:1930,y:850,idx:3,sel:1,target:2,locked:false},{type:'npc',x:410,y:650,name:'LIGHTING TECH',dialogue:'Match the color of each console to the bright ring around it. INTERACT cycles colors. Four matches power up the theater.'}];w.hazards=[hazard('beam',790,680,{axis:'y',range:240,speed:1.0,r:52}),hazard('beam',1270,680,{axis:'y',range:220,speed:1.3,r:50}),hazard('beam',1760,680,{axis:'y',range:220,speed:1.5,r:50})];w.walls=[{x:670,y:30,w:290,h:245},{x:1260,y:1000,w:225,h:290}];}
 if(i===3){w.objects=[{type:'checkpoint',x:525,y:650,idx:0,lit:false},{type:'checkpoint',x:940,y:340,idx:1,lit:false},{type:'checkpoint',x:1430,y:940,idx:2,lit:false},{type:'checkpoint',x:1920,y:570,idx:3,lit:false}];w.hazards=[hazard('cart',710,655,{axis:'y',range:220,speed:2.1}),hazard('pumpkin',1120,670,{axis:'x',range:145,speed:2.3}),hazard('beam',1570,660,{axis:'y',range:235,speed:1.8,r:55}),hazard('cart',1890,785,{axis:'x',range:100,speed:2.5})];w.walls=[{x:785,y:60,w:260,h:150},{x:1160,y:1010,w:235,h:275}];}
 if(i===4){w.objects=[{type:'tower',x:565,y:400,idx:0,lit:false},{type:'tower',x:1040,y:920,idx:1,lit:false},{type:'tower',x:1480,y:300,idx:2,lit:false}];w.hazards=[];}
 const secrets=[[[720,210],[2090,1130]],[[1200,330],[2090,1110]],[[790,990],[1730,1150]],[[570,260],[2020,1070]],[[660,1040],[1730,930]]];w.secrets=secrets[i].map(([x,y])=>pickup(x,y,'ticket'));
 for(let j=0;j<42;j++){let x=110+((j*211)%Math.max(400,w.w-180)),y=75+((j*331)%Math.max(400,w.h-150));if(i===0)w.decor.push(scenery(x,y,j%4===0?'tree':'leaf',{size:rand(10,24),seed:j}));else if(i===1)w.decor.push(scenery(x,y,j%3===0?'crate':'mark',{size:rand(15,31),seed:j}));else w.decor.push(scenery(x,y,j%4===0?'sparkle':'mark',{size:rand(9,18),seed:j}))}
 w.exit={x:s.exit[0],y:s.exit[1],r:52};return w}

function createWorld(i,act,wave=0){
 const w=createBaseWorld(i),spec=modeSpec(),meta=ACTS[i][act];w.kind=wave%2===0?meta.kind:WAVE_KIND[meta.kind];w.act=act;w.wave=wave;w.roundCount=2+(act===0||i===2&&act===3?1:0);w.actName=meta.title;
 w.items=[];w.objects=[];w.checkpoint=0;w.lights=0;w.hazards=w.hazards.slice();
 // Each act features a full traversal of the original illustrated world.
 // Routes zig-zag between upper and lower areas so a pickup cannot end in a few seconds.
 const shift=(act*3+i*2+wave*7)%ROUTE.length;
 const point=k=>{const a=ROUTE[(k+shift)%ROUTE.length];return [clamp(a[0]+((act%2)*35),110,w.w-120),clamp(a[1],110,w.h-110)]};
 const addItems=(count,type)=>{for(let j=0;j<count;j++){const [x,y]=point(j);w.items.push(pickup(x,y,type))}};
 const addCheckpoints=count=>{for(let j=0;j<count;j++){const [x,y]=point(j);w.objects.push({type:'checkpoint',x,y,idx:j,lit:false})}};
 const addConsoles=count=>{for(let j=0;j<count;j++){const [x,y]=point(j*2+1);w.objects.push({type:'console',x,y,idx:j,sel:(j+act)%4,target:(j*3+act+1)%4,locked:false})}};
 if(w.kind==='collect'){addItems(spec.targets+(act===3?2:0),'page')}
 if(w.kind==='badges'){addItems(spec.targets-2,'key');w.objects.push({type:'trunk',x:1990,y:850,open:false})}
 if(w.kind==='checkpoint'){addCheckpoints(spec.checkpoints+(act===3?2:0))}
 if(w.kind==='consoles'){addItems(spec===MODE_SPEC.rookie?3:5,'key');addConsoles(spec.console)}
 if(w.kind==='towers'){const n=spec===MODE_SPEC.rookie?4:6;for(let j=0;j<n;j++){const [x,y]=point(j*3+1);w.objects.push({type:'tower',x,y,idx:j,lit:false})}}
 if(w.kind==='boss'){w.objects=[{type:'tower',x:410,y:395,idx:0,lit:false},{type:'tower',x:810,y:1010,idx:1,lit:false},{type:'tower',x:1650,y:340,idx:2,lit:false}]}
 // More interactive hazard variety in every act, while keeping early learners safe.
 if(w.kind!=='boss'){const hcount=act===3?5:3;for(let j=0;j<hcount;j++){const [x,y]=point(j*3+2);w.hazards.push(hazard(j%3===0?'cart':j%3===1?'pumpkin':'beam',x,y,{axis:j%2?'x':'y',range:act>=2?160:100,speed:1.0+j*.19,r:j%3===2?42:27}))}}
 // The exit is near the far end, but it remains locked until every objective is done.
 w.exit={x:Math.min(2190,w.w-110),y:i===4?610:665,r:52};
 return w;
}
function beginAct(keepChapter=false){
 st.wave=0;st.actElapsed=0;st.goalComplete=false;st.world=createWorld(st.level,st.act,st.wave);
 const previous=st.player;st.player=freshPlayer();if(keepChapter&&previous){st.player.hp=Math.min(st.player.maxHp,previous.hp+2)}
 st.boss=st.world.kind==='boss'?{x:1410,y:585,baseY:585,hp:modeSpec().boss+st.wave*2,max:modeSpec().boss+st.wave*2,alive:true,shoot:2,hit:0}:null;
 st.fireballs=[];st.burst=[];st.particles=[];st.floaters=[];
 st.cam={x:0,y:clamp(st.player.y-H/2,0,st.world.h-H)};st.shake=0;st.prompt='';keys.clear();stick.x=stick.y=0;
 liveView();popup('ACT '+(st.act+1)+' / 4 — '+ACTS[st.level][st.act].title,'Round 1 of '+st.world.roundCount+'. '+ACTS[st.level][st.act].hint,STAGES[st.level].icon);beep('complete');
}
function completeWave(){
 if(st.screen!=='playing')return;
 if(st.wave+1>=st.world.roundCount){completeAct();return}
 const max=st.world.roundCount;st.wave++;
 const old=st.player;
 st.world=createWorld(st.level,st.act,st.wave);st.player=freshPlayer();
 st.player.hp=Math.min(st.player.maxHp,old.hp+2);
 st.boss=st.world.kind==='boss'?{x:1410,y:585,baseY:585,hp:modeSpec().boss+st.wave*2,max:modeSpec().boss+st.wave*2,alive:true,shoot:2,hit:0}:null;
 st.fireballs=[];st.burst=[];st.particles=[];st.floaters=[];st.cam={x:0,y:clamp(st.player.y-H/2,0,st.world.h-H)};
 st.shake=0;st.goalComplete=false;keys.clear();stick.x=stick.y=0;
 popup('ROUND '+(st.wave+1)+' / '+max,st.world.kind==='boss'?'The Mayhem Machine rebooted! Power up again for the next showdown.':st.world.kind==='checkpoint'?'New rehearsal relay! Follow the glowing checkpoints in order.':st.world.kind==='collect'?'Another supply run! Gather the scattered props and head for the EXIT.':st.world.kind==='consoles'?'New controls are online! Recover fuses and synchronize the lights.':'The stage needs another rescue mission!',STAGES[st.level].icon);
 beep('complete');hudUpdate();
}
function completeAct(){
 if(st.screen!=='playing')return;
 if(st.act>=3){completeLevel();return}
 st.act++;
 const key=st.mode+'-'+st.level;
 save.actProgress[key]=Math.max(save.actProgress[key]||0,st.act);persist();
 $('actCompleteTitle').textContent='ACT '+st.act+' CLEARED!';
 $('actNextTitle').textContent='NEXT: '+ACTS[st.level][st.act].title;
 $('actNextCopy').textContent=ACTS[st.level][st.act].hint;
 $('actProgressCopy').textContent=`CHAPTER ${st.level+1} • ${st.act} OF 4 ACTS COMPLETE • ${formatTime(st.elapsed)} ELAPSED`;
 beep('complete');showView('actclear');
}
function launchLevel(){st.elapsed=0;st.score=0;beginAct()}
function formatTime(t){const n=Math.floor(t);return`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function progressStatus(){
 const w=st.world,k=w.kind,items=w.items.filter(x=>x.got).length;
 if(k==='collect')return{n:items,all:w.items.length,text:`${st.level===4?'SUPPLIES':'COLLECTIBLES'} ${items} / ${w.items.length}`};
 if(k==='badges'){let open=w.objects.find(x=>x.type==='trunk').open;return{n:items+(open?1:0),all:w.items.length+1,text:`BADGES ${items} / ${w.items.length} • TRUNK ${open?'OPEN':'LOCKED'}`}}
 if(k==='consoles'){const n=w.objects.filter(x=>x.type==='console'&&x.locked).length,all=w.objects.filter(x=>x.type==='console').length;return{n:items+n,all:w.items.length+all,text:`FUSES ${items}/${w.items.length} • LIGHTS ${n}/${all}`}}
 if(k==='checkpoint')return{n:w.checkpoint,all:w.objects.filter(x=>x.type==='checkpoint').length,text:`CHECKPOINTS ${w.checkpoint} / ${w.objects.length}`};
 if(k==='towers'){const n=w.objects.filter(x=>x.type==='tower'&&x.lit).length;return{n,all:w.objects.length,text:`POWER STATIONS ${n}/${w.objects.length}`}}
 const n=w.objects.filter(x=>x.type==='tower'&&x.lit).length;const hp=st.boss?.hp||0;
 return{n:n+(st.boss&&!st.boss.alive?1:0),all:4,text:`LIGHTS ${n}/3 • MACHINE ${Math.max(0,hp)} HP`};
}

function hudUpdate(){if(!st.world)return;const p=progressStatus();$('missionIndex').textContent=`CHAPTER ${st.level+1}/5 • ACT ${st.act+1}/4 • ROUND ${st.wave+1}/${st.world.roundCount} • ${formatTime(st.elapsed)}`;$('missionName').textContent=ACTS[st.level][st.act].title;$('missionTask').textContent=p.text;$('starCount').textContent=st.score.toLocaleString();$('hearts').textContent='♥ '.repeat(st.player.hp).trim()+' ♡ '.repeat(st.player.maxHp-st.player.hp).trim();$('progressFill').style.width=(p.n/p.all*100)+'%';$('actionCaption').textContent=st.world.kind==='boss'&&st.world.lights===3&&st.boss?.alive?'BLAST':'INTERACT';$('actionSymbol').textContent=st.world.kind==='boss'&&st.world.lights===3&&st.boss?.alive?'⚡':'✦'}
function award(points,x,y,label){st.score+=points;if(points>0){floatText(x,y,label||`+${points}`,'#ffe292');beep('coin')}}
function sparks(x,y,color='#ffd78a',count=13,speed=150){for(let i=0;i<count;i++){const a=Math.random()*TAU,v=rand(speed*.2,speed);st.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.34,.85),total:.85,size:rand(2,6),color})}}
function floatText(x,y,text,color='#fff'){st.floaters.push({x,y,text,color,life:1.0})}
function near(a,b,r=78){return Math.hypot(a.x-b.x,a.y-b.y)<r}
function issueGoalHint(){if(st.screen==='playing')popup('MISSION CONTROL',progressStatus().text,'📡')}
function completeLevel(){if(st.screen!=='playing')return;let bonus=Math.max(0,Math.floor(2400-st.elapsed))*2+st.player.hp*110;st.score+=bonus;const rank=st.player.hp===st.player.maxHp&&st.elapsed<480?'S':st.player.hp>=Math.ceil(st.player.maxHp*.7)?'A':'B';let key=st.level+'-'+st.mode,best=save.bests[key];if(!best||st.score>best.score)save.bests[key]={score:st.score,time:Math.round(st.elapsed),rank};save.unlocked=Math.max(save.unlocked,st.level+1);save.actProgress[st.mode+'-'+st.level]=0;save.mode=st.mode;persist();$('clearMedal').textContent=rank;$('clearTitle').textContent=STAGES[st.level].name+' CLEARED!';$('clearCopy').textContent=STAGES[st.level].finish;$('resultPoints').textContent=st.score.toLocaleString();$('resultTime').textContent=formatTime(st.elapsed);$('resultRank').textContent=rank;$('nextBtn').textContent=st.level===4?'SEE THE FINALE →':'NEXT MISSION →';beep('complete');showView('clear')}
function healthHit(sourceX,sourceY){let p=st.player;if(p.inv>0||p.dash>0)return;p.hp--;p.inv=st.mode==='rookie'?2.2:1.55;st.shake=18;beep('hit');sparks(p.x,p.y,'#ff7388',20,220);let a=Math.atan2(p.y-sourceY,p.x-sourceX);p.knockX=Math.cos(a)*500;p.knockY=Math.sin(a)*500;floatText(p.x,p.y,'OUCH!','#ff8faa');if(p.hp<=0){showView('dead');beep('hit')}else{hudUpdate()}}
function dash(){if(st.screen!=='playing')return;let p=st.player;if(p.dashCD>0)return;p.dash=.2;p.dashCD=1.23;beep('dash');sparks(p.x,p.y,'#7df1d3',13,100);let d=moveDirection();if(Math.hypot(d.x,d.y)<.1){p.vx=p.face*1;p.vy=0}}
function action(){
 if(st.screen!=='playing')return;
 const w=st.world,p=st.player;
 if(near(p,w.exit,85)){
   if(goalReady()){sparks(w.exit.x,w.exit.y,'#87ffe0',45,300);completeWave()}
   else issueGoalHint();
   return;
 }
 const interact=w.objects.filter(o=>o.type!=='checkpoint'&&near(p,o,o.type==='npc'?93:100))
   .sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];
 if(interact){
   if(interact.type==='npc'){
     popup(interact.name,interact.dialogue,'💬');beep('click');
   }else if(interact.type==='trunk'){
     if(w.items.every(o=>o.got)){
       if(!interact.open){
         interact.open=true;sparks(interact.x,interact.y,'#ffd778',42,250);
         award(500,interact.x,interact.y,'COSTUME SAVED!');
         popup('COSTUME FOUND','The costume is safe! Head to the glowing EXIT.','🦃');
         st.goalComplete=true;
       }
     }else popup('SECURITY LOCKED','Find all three access badges first.','🔐');
   }else if(interact.type==='console'){
     if(interact.locked){popup('ALREADY LOCKED','This spotlight is ready. Find the next console.','✓')}
     else if(w.items.some(x=>!x.got)){popup('FUSES NEEDED','Collect the glowing power fuses before using these controls.','🔋')}
     else{
       interact.sel=(interact.sel+1)%4;beep('click');sparks(interact.x,interact.y,C[interact.sel],8,90);
       if(interact.sel===interact.target){
         interact.locked=true;award(350,interact.x,interact.y,'SYNCED!');
         sparks(interact.x,interact.y,C[interact.sel],32);
         popup('SPOTLIGHT SYNCED',`${w.objects.filter(o=>o.type==='console'&&o.locked).length} / ${w.objects.filter(o=>o.type==='console').length} stage lights calibrated.`,'💡');
       }else popup('COLOR TUNED','Keep turning until the center matches the glowing outer ring.','🎨');
     }
   }else if(interact.type==='tower'){
     if(!interact.lit){
       interact.lit=true;w.lights++;award(300,interact.x,interact.y,'LIGHT ON!');
       sparks(interact.x,interact.y,'#ffde8a',33,270);
       popup('STAGE POWER',`${w.lights} / ${w.objects.filter(o=>o.type==='tower').length} spotlights activated.${w.kind==='boss'&&w.lights===3?' The machine is vulnerable!':''}`,'⚡');
     }
   }
   return;
 }
 if(w.kind==='boss'&&st.boss&&st.boss.alive){
   if(w.lights<3){popup('SHIELD ACTIVE',`Activate all three light towers first. ${w.lights} of 3 online.`,'🛡️');return}
   if(p.blastCD>0)return;
   if(near(p,st.boss,860)){
     p.blastCD=.49;st.burst.push({x:p.x,y:p.y,tx:st.boss.x,ty:st.boss.y,life:.26,max:.26});
     beep('fire');sparks(p.x,p.y,'#86efff',8,90);st.boss.hp--;st.boss.hit=.24;st.shake=5;
     if(st.boss.hp<=0){
       st.boss.alive=false;st.fireballs.length=0;st.score+=1500;
       sparks(st.boss.x,st.boss.y,'#ffe989',150,410);
       popup('MACHINE SHUT DOWN','Amazing! Reach the glowing EXIT to start the show.','🏆');beep('complete');
     }else floatText(st.boss.x,st.boss.y-60,'-1 HP','#ffc184');
     hudUpdate();
   }else popup('OUT OF RANGE','Move closer to the machine and try again.','⚡');
   return;
 }
 popup('KEEP MOVING','Explore the area and follow the glowing mission markers.','🧭');
}
function goalReady(){const w=st.world;if(!w)return false;switch(w.kind){case 'collect':return w.items.every(o=>o.got);case 'badges':return w.objects.some(o=>o.type==='trunk'&&o.open);case 'consoles':return w.items.every(o=>o.got)&&w.objects.filter(o=>o.type==='console').every(o=>o.locked);case 'checkpoint':return w.checkpoint>=w.objects.filter(o=>o.type==='checkpoint').length;case 'towers':return w.objects.filter(o=>o.type==='tower').every(o=>o.lit);case 'boss':return !!st.boss&&!st.boss.alive;}return false}
function moveDirection(){let x=stick.x+(keys.has('a')||keys.has('arrowleft')?-1:0)+(keys.has('d')||keys.has('arrowright')?1:0),y=stick.y+(keys.has('w')||keys.has('arrowup')?-1:0)+(keys.has('s')||keys.has('arrowdown')?1:0);const mag=Math.hypot(x,y);if(mag>1){x/=mag;y/=mag}return{x,y}}
function collides(x,y,p){if(x<p.r+20||y<p.r+22||x>st.world.w-p.r-20||y>st.world.h-p.r-25)return true;return st.world.walls.some(w=>{const qx=clamp(x,w.x,w.x+w.w),qy=clamp(y,w.y,w.y+w.h);return Math.hypot(x-qx,y-qy)<p.r+4})}
function movement(dt){let p=st.player,d=moveDirection(),spd=modeSpec().speed; p.inv=Math.max(0,p.inv-dt);p.dash=Math.max(0,p.dash-dt);p.dashCD=Math.max(0,p.dashCD-dt);p.blastCD=Math.max(0,(p.blastCD||0)-dt);if(p.dash>0)spd*=3.0;if(Math.abs(d.x)>0.05)p.face=Math.sign(d.x);
 if(p.dash>0&&Math.hypot(d.x,d.y)<.1){d={x:p.face,y:0}}
 const dx=(d.x*spd+p.knockX)*dt,dy=(d.y*spd+p.knockY)*dt;p.vx=lerp(p.vx,d.x,clamp(dt*12,0,1));p.vy=lerp(p.vy,d.y,clamp(dt*12,0,1));p.knockX*=Math.max(0,1-dt*11);p.knockY*=Math.max(0,1-dt*11);if(!collides(p.x+dx,p.y,p))p.x+=dx;if(!collides(p.x,p.y+dy,p))p.y+=dy;p.walk+=Math.hypot(dx,dy)*.06;if(p.dash>0&&Math.random()<.7)sparks(p.x-p.face*12,p.y,'#72ebdb',1,45);
 const maxX=Math.max(0,st.world.w-W),maxY=Math.max(0,st.world.h-H);st.cam.x=lerp(st.cam.x,clamp(p.x-W*.43,0,maxX),Math.min(1,dt*7));st.cam.y=lerp(st.cam.y,clamp(p.y-H*.50,0,maxY),Math.min(1,dt*7));
}
function updateHazards(dt){const w=st.world,p=st.player,speedFactor=modeSpec().hazard;for(const h of w.hazards){const wave=Math.sin(st.elapsed*h.speed*speedFactor+h.phase);h.x=h.ax+(h.axis==='x'?wave*h.range:0);h.y=h.ay+(h.axis==='y'?wave*h.range:0);h.spin=(h.spin||0)+dt*3.8;if(near(p,h,(h.r||31)+p.r-6))healthHit(h.x,h.y)}
 if(w.kind==='boss'&&st.boss?.alive){let b=st.boss;b.y=b.baseY+Math.sin(st.elapsed*1.4)*155;b.hit=Math.max(0,b.hit-dt);b.shoot-=dt;if(b.shoot<0){b.shoot=st.mode==='rookie'?1.85:st.mode==='expert'?.82:1.18;const a=Math.atan2(p.y-b.y,p.x-b.x);const speed=st.mode==='rookie'?155:st.mode==='expert'?275:220;st.fireballs.push({x:b.x-60,y:b.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:5,rot:0});beep('click')}
 for(let i=st.fireballs.length-1;i>=0;i--){let f=st.fireballs[i];f.x+=f.vx*dt;f.y+=f.vy*dt;f.life-=dt;f.rot+=dt*7;if(near(f,p,p.r+23)){healthHit(f.x,f.y);st.fireballs.splice(i,1)}else if(f.life<0||f.x<0||f.y<0||f.x>w.w||f.y>w.h)st.fireballs.splice(i,1)}}}
function updatePickups(){let w=st.world,p=st.player;for(const it of w.secrets){if(!it.got&&near(p,it,49)){it.got=true;award(550,it.x,it.y,'SECRET BONUS!');sparks(it.x,it.y,'#ffe18a',38,230);popup('SECRET DISCOVERED','You found a hidden golden backstage ticket! +550 points.','🏅')}}for(const it of w.items){if(!it.got&&near(p,it,49)){it.got=true;award(it.type==='key'?240:180,it.x,it.y,it.type==='key'?'BADGE GET!':'PAGE GET!');sparks(it.x,it.y,it.type==='key'?'#ffd78b':'#aafcdd',23,165);if(w.items.every(x=>x.got)){popup('ALL COLLECTED',w.kind==='badges'?'Now open the costume trunk!':w.kind==='consoles'?'Now synchronize the lights!':'Head to the EXIT once the objectives are done.','✦')}hudUpdate()}}
 if(w.kind==='checkpoint'){const cp=w.objects.find(o=>o.type==='checkpoint'&&o.idx===w.checkpoint);if(cp&&near(p,cp,76)){cp.lit=true;w.checkpoint++;award(375,cp.x,cp.y,`CHECKPOINT ${w.checkpoint}!`);sparks(cp.x,cp.y,'#ffd97e',31,190);popup('CHECKPOINT CLEARED',w.checkpoint===w.objects.length?'Route complete! Head to the EXIT.':`Great timing! Now reach checkpoint ${w.checkpoint+1}.`,'🏁');hudUpdate()}}
}
function updateFX(dt){for(let i=st.particles.length-1;i>=0;i--){let p=st.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*.6;p.vy*=1-dt*.6;p.life-=dt;if(p.life<0)st.particles.splice(i,1)}for(let i=st.floaters.length-1;i>=0;i--){let f=st.floaters[i];f.y-=dt*60;f.life-=dt;if(f.life<=0)st.floaters.splice(i,1)}for(let i=st.burst.length-1;i>=0;i--){st.burst[i].life-=dt;if(st.burst[i].life<=0)st.burst.splice(i,1)}st.shake*=Math.max(0,1-dt*10)}
function updateTip(){let p=st.player,w=st.world,goal=goalReady(),msg='';if(near(p,w.exit,130))msg=goal?'✦ INTERACT to exit the stage':'🔒 Finish your mission before leaving';else{let o=w.objects.filter(o=>['console','trunk','tower','npc'].includes(o.type)&&near(p,o,130)).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];if(o){msg=o.type==='npc'?`✦ INTERACT • TALK TO ${o.name}`:o.type==='trunk'?'✦ INTERACT • OPEN COSTUME TRUNK':o.type==='console'?'✦ INTERACT • TUNE COLOR':o.type==='tower'?'✦ INTERACT • ACTIVATE SPOTLIGHT':''}}if(w.kind==='boss'&&w.lights===3&&st.boss?.alive&&near(p,st.boss,830))msg='⚡ INTERACT to BLAST the Mayhem Machine';$('gameTip').textContent=msg;$('gameTip').classList.toggle('hidden',!msg)}
function tick(dt){if(st.screen!=='playing')return;st.elapsed+=dt;st.actElapsed+=dt;movement(dt);updateHazards(dt);if(st.screen!=='playing')return;updatePickups();updateFX(dt);if(st.popupUntil<st.elapsed)$('missionPopup').classList.add('hidden');st.hudClock+=dt;if(st.hudClock>.16){st.hudClock=0;hudUpdate();updateTip()}}
/* ------------------------- CANVAS VECTOR ART ---------------------------- */
function rounded(x,y,w,h,r=10){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
function box(x,y,w,h,color,r=0){ctx.fillStyle=color;if(r){rounded(x,y,w,h,r);ctx.fill()}else ctx.fillRect(x,y,w,h)}
function circ(x,y,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function ellipse(x,y,rx,ry,color,rotation=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,TAU);ctx.fillStyle=color;ctx.fill()}
function line(x1,y1,x2,y2,color,lw=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.stroke()}
function text(t,x,y,font='20px system-ui',color='#fff',align='center',stroke=null){ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';if(stroke){ctx.lineWidth=4;ctx.strokeStyle=stroke;ctx.strokeText(String(t),x,y)}ctx.fillText(String(t),x,y)}
function glow(x,y,r,c){ctx.save();const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function polygon(points,color,stroke=null,lw=2){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let j=1;j<points.length;j++)ctx.lineTo(points[j][0],points[j][1]);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function ground(w){const s=STAGES[st.level],c=s.colors;ctx.fillStyle=c[0];ctx.fillRect(0,0,w.w,w.h);let g=ctx.createLinearGradient(0,0,0,w.h);g.addColorStop(0,c[1]+'aa');g.addColorStop(.55,c[0]+'00');g.addColorStop(1,'#02091f73');ctx.fillStyle=g;ctx.fillRect(0,0,w.w,w.h);
 ctx.save();ctx.globalAlpha=.11;ctx.strokeStyle=c[2];ctx.lineWidth=2;for(let x=0;x<w.w;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,w.h);ctx.stroke()}for(let y=0;y<w.h;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w.w,y);ctx.stroke()}ctx.restore();
 if(st.level===0){box(0,506,w.w,308,'#78948c');box(0,523,w.w,272,'#536b70');box(0,534,w.w,248,'#677d76');ctx.setLineDash([35,34]);line(0,659,w.w,659,'#f8de9b87',4);ctx.setLineDash([]);
 for(let i=0;i<18;i++){const x=i*140+20;box(x,485,65,9,'#e0d3af63',5);box(x,802,65,9,'#e0d3af63',5)}box(70,870,590,65,'#4d806e66',31);box(1490,285,570,80,'#75a77b56',31);
 }else if(st.level===1){for(let y=170;y<w.h;y+=180){box(0,y,w.w,16,'#c8b99916');line(0,y,w.w,y,'#b9d9e328',2)}for(let x=240;x<w.w;x+=490){box(x,120,12,w.h-240,'#bce5e31b',5)}
 }else if(st.level===2){for(let x=0;x<w.w;x+=190){line(x,0,x+700,w.h,'#8c7dd722',10)}for(let x=0;x<w.w;x+=530)glow(x+180,640,230,'#655bc827');
 }else if(st.level===3){for(let x=0;x<w.w;x+=170){box(x,0,85,w.h,'#ffb79c0c');line(x,0,x,w.h,'#fcc5a118',3)}for(let y=120;y<w.h;y+=240){box(0,y,w.w,18,'#ffd6be10')}
 }else {const g2=ctx.createRadialGradient(w.w/2,w.h/2,80,w.w/2,w.h/2,950);g2.addColorStop(0,'#87397380');g2.addColorStop(1,'#080f29');ctx.fillStyle=g2;ctx.fillRect(0,0,w.w,w.h);circ(1130,610,530,'#331c54','#df78ad3a',7);circ(1130,610,430,'#58305a44','#f4b0ff1f',4);for(let x=0;x<w.w;x+=100){const light=(Math.sin(st.elapsed*2+x*.03)+1)*.08;box(x,40,70,34,`rgba(255,207,155,${light+.09})`,15);box(x,w.h-69,70,28,'#e875a62c',14)}}
 line(23,23,w.w-23,23,'#ffffff24',5);line(23,w.h-23,w.w-23,w.h-23,'#00000055',10);
}
function backgroundStructure(w){if(st.level===0){building(875,72,640,330,'GILBERT SCHOOL');building(1590,1020,360,280,'ARTS WING');for(let i=0;i<5;i++){drawTree(250+i*240,230+(i%2)*70,.8);drawTree(340+i*360,1140-(i%2)*80,.75)}}else if(st.level===1){building(680,50,320,260,'PROP ARCHIVE');building(1270,970,290,310,'STORAGE');building(1630,70,330,190,'WARDROBE');for(let x=280;x<w.w-170;x+=310){box(x,115,160,22,'#a4c0cf33',6);box(x,1235,160,22,'#9bdaec22',6);line(x,130,x+125,130,'#ffffff23',2)}}else if(st.level===2){building(670,30,290,245,'POWER GRID');building(1260,1000,225,290,'ELECTRICAL');for(let x=330;x<w.w;x+=380){ctx.beginPath();ctx.moveTo(x,200);ctx.bezierCurveTo(x+110,410,x-110,740,x+130,1100);ctx.strokeStyle='#827be749';ctx.lineWidth=9;ctx.stroke()}}else if(st.level===3){building(785,60,260,150,'RIGGING');building(1160,1010,235,275,'COSTUMES');box(0,78,w.w,35,'#c75a7690');box(0,1258,w.w,50,'#b8416890');for(let x=0;x<w.w;x+=110)line(x,80,x+60,115,'#f2b4a63b',11)}else{for(let j=0;j<28;j++){const x=80+j*65;ellipse(x,100,24,20,j%3?'#140c32':'#29123e');ellipse(x,1090,24,20,j%3?'#140c32':'#29123e')}for(let x=180;x<w.w;x+=260){glow(x,45,110,'#e090ff23');glow(x,1140,125,'#c873d528')}}}
function building(x,y,w,h,label){ctx.save();ctx.shadowColor='#050712b0';ctx.shadowBlur=30;ctx.shadowOffsetY=18;box(x,y,w,h,'#1b2c3a',18);ctx.restore();box(x+12,y+12,w-24,h-24,st.level===0?'#5c8583':'#303951',11);for(let j=1;j<5;j++){const nx=x+(w/5)*j;line(nx,y+25,nx,y+h-25,'#f2ecda2b',4)}box(x+35,y+h*.29,w-70,h*.25,'#131f36ba',10);text(label,x+w/2,y+h*.41,`900 ${Math.min(33,w/12)}px system-ui`,'#fcdb8b');box(x+40,y+h-20,w-80,12,'#ffebb14c',6)}
function drawTree(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(1,10,69,18,'#001c2366');box(-13,-42,26,71,'#784b52',8);for(const [a,b,r,col] of [[-35,-66,59,'#29565b'],[38,-76,55,'#3f8574'],[-3,-108,62,'#3f9a78']]){circ(a,b,r,col)}for(let i=0;i<12;i++){let a=i*2.399,rad=35+(i%3)*13;circ(Math.cos(a)*rad,Math.sin(a)*rad-77,5,i%2?'#d9a567':'#eb825f')}ctx.restore()}
function drawDecor(w){for(const d of w.decor){if(st.level===0&&d.type==='tree'&&d.y<475){drawTree(d.x,d.y,.33)}else if(d.type==='leaf'){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.seed);ellipse(0,0,d.size*.55,d.size*.28,d.seed%2?'#e6af5a88':'#de766c88');line(-d.size*.6,0,d.size*.6,0,'#fbe0ae66',2);ctx.restore()}else if(d.type==='crate'){box(d.x,d.y,d.size*2,d.size*1.6,'#5d677b55',4);line(d.x+4,d.y+4,d.x+d.size*1.8,d.y+d.size*1.4,'#a1aebe44',3)}else if(d.type==='mark'){line(d.x,d.y,d.x+17,d.y,'#d2ebfa1a',2)}else if(d.type==='sparkle'){const a=Math.sin(st.elapsed*2+d.seed);glow(d.x,d.y,16,'#cab3ff26');circ(d.x,d.y,1.3+a*.6,'#ead7ff84')}}}
function shadow(x,y,r=40){ellipse(x,y+17,r,r*.26,'#00000077')}
function exitPortal(o){let active=goalReady(),t=st.elapsed;glow(o.x,o.y,active?140:85,active?'#5affc946':'#ffc68b24');ctx.save();ctx.translate(o.x,o.y);ctx.rotate(.02*Math.sin(t));for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,-10,38+i*12,65+i*7,0,0,TAU);ctx.strokeStyle=active?`rgba(102,255,218,${.8-i*.2})`:`rgba(200,197,192,${.35-i*.07})`;ctx.lineWidth=6-i;ctx.stroke()}box(-32,-46,64,85,active?'#194c53c9':'#394453db',8);box(-25,-38,50,69,active?'#42a79a':'#515c74',5);if(active){for(let j=0;j<5;j++){let y=((t*65+j*21)%77)-35;line(-23,y,23,y,'#d4fff584',2)}}text('EXIT',0,-96,'900 24px system-ui',active?'#97ffdb':'#d9c7bd');text(active?'OPEN':'LOCKED',0,63,'900 15px system-ui',active?'#7bffd2':'#cfb4ae');ctx.restore()}
function collectible(it){if(it.got)return;const t=st.elapsed+it.phase;const bob=Math.sin(t*3)*7;glow(it.x,it.y+bob,55,it.type==='key'?'#ffe57e47':'#95ffdc4e');shadow(it.x,it.y+20,23);ctx.save();ctx.translate(it.x,it.y+bob);ctx.rotate(Math.sin(t*2)*.1);if(it.type==='ticket'){box(-24,-20,48,40,'#ffe4a2',9);box(-18,-15,36,30,'#efb352',6);text('★',0,0,'900 28px system-ui','#63415f')}else if(it.type==='key'){circ(0,-10,18,'#ffcd65','#ffefbe',4);circ(0,-10,6,'#667572');box(-6,0,12,39,'#ffcb69',3);box(4,18,14,9,'#ffc96e',3);box(4,29,10,7,'#ffc96e',3)}else{box(-21,-29,43,56,'#d5a466',5);box(-23,-33,43,56,'#fff2d6',5);for(let i=0;i<3;i++)line(-14,-19+i*12,8,-19+i*12,'#b7936d',3);polygon([[3,23],[14,12],[14,23]],'#ffb466')}ctx.restore()}
function character(x,y,scale=1,role='gator',face=1,walk=0,hit=false){ctx.save();ctx.translate(x,y);ctx.scale(face*scale,scale);const bob=Math.sin(walk)*2;ctx.translate(0,bob);shadow(0,18,28);polygon([[-22,3],[-62,23],[-25,17]],role==='gator'?'#77cf99':'#c9875f','#172f37',3);ellipse(-13,19,11,17,'#213246');ellipse(12,19,11,17,'#213246');ellipse(-13,26,14,6,'#aab6c8');ellipse(13,26,14,6,'#aab6c8');ellipse(0,-2,30,30,role==='gator'?'#4b477c':'#755b78');box(-31,-14,63,35,role==='gator'?'#57528d':'#8d6175',10);box(-3,-14,7,33,'#e1f5e9',2);box(21,-7,13,15,'#eabf72',3);text(role==='gator'?'G':'★',-13,3,'1000 14px system-ui','#ffefba');ellipse(-31,0,11,17,role==='gator'?'#75c997':'#be9977');ellipse(30,0,11,17,role==='gator'?'#75c997':'#be9977');ellipse(0,-39,34,28,role==='gator'?'#75d2a2':'#e0a67d');ellipse(13,-34,35,16,role==='gator'?'#9befb7':'#efbd96');ellipse(-11,-53,9,12,'#f5ffe9');ellipse(13,-53,9,12,'#f5ffe9');circ(-10,-52,4,'#182d3b');circ(15,-52,4,'#182d3b');ellipse(32,-32,4,3,'#3a6360');if(role==='gator'){for(let i=0;i<4;i++)polygon([[-32+i*14,-64],[-26+i*14,-75],[-17+i*14,-65]],'#3c9f87')}else{polygon([[-30,-56],[-30,-83],[-14,-67]],'#d39a79');polygon([[15,-68],[30,-83],[29,-57]],'#d39a79')}if(hit){ctx.globalAlpha=.3;circ(0,-20,55,'#fff')}ctx.restore()}
function npcObject(o){character(o.x,o.y,.88,'fox',-1,st.elapsed*1.5);box(o.x-67,o.y-118,134,21,'#1c2841e0',8);text(o.name,o.x,o.y-107,'900 12px system-ui','#fbe3af');if(near(st.player,o,98))glow(o.x,o.y-80,45,'#ffe89628')}
function trunkObject(o){shadow(o.x,o.y+5,51);glow(o.x,o.y-11,76,o.open?'#7bffd540':'#f9d67d37');box(o.x-54,o.y-32,108,70,o.open?'#2b786f':'#855747',13);box(o.x-57,o.y-43,114,34,o.open?'#4eaa8c':'#ae8269',10);box(o.x-16,o.y-28,32,30,'#ffdb7e',5);text(o.open?'✓':'🔒',o.x,o.y-56,'31px system-ui','#ffffff');if(o.open){for(let j=0;j<5;j++)polygon([[o.x-50+j*25,o.y-40],[o.x-45+j*25,o.y-88],[o.x-32+j*25,o.y-41]],['#ffb36f','#f07b80','#ffd36c','#73dab1','#80bce9'][j]);text('TURKEY COSTUME',o.x,o.y+69,'900 13px system-ui','#b6ffe0')}
}
function consoleObject(o){const t=st.elapsed,clr=C[o.sel],rim=C[o.target];glow(o.x,o.y,91,o.locked?'#83ffe057':rim+'4d');shadow(o.x,o.y+35,55);ctx.save();ctx.translate(o.x,o.y);ctx.rotate(Math.sin(t*1.2)*.015);circ(0,0,60,'#12192f',rim,9);circ(0,0,47,'#25314c','#ffffff44',4);circ(0,0,34,clr,'#fff9',4);ctx.strokeStyle='#ffffff99';ctx.lineWidth=3;for(let j=0;j<4;j++){let a=j*TAU/4+t*.2;line(Math.cos(a)*41,Math.sin(a)*41,Math.cos(a)*51,Math.sin(a)*51,'#fff7',3)}text(o.locked?'✓':'↻',0,0,'900 37px system-ui','#14263a');ctx.restore();text('LIGHT '+(o.idx+1),o.x,o.y-91,'1000 16px system-ui','#fff2d6');if(o.locked)text('SYNCED',o.x,o.y+84,'900 14px system-ui','#7affe0')}
function towerObject(o){let active=o.lit;glow(o.x,o.y,active?180:70,active?'#ffee925c':'#a1b0d82d');shadow(o.x,o.y+22,37);box(o.x-29,o.y-40,58,91,active?'#ac8c63':'#444768',12);box(o.x-36,o.y-49,72,48,'#253553',13);circ(o.x,o.y-23,23,active?'#ffe7a0':'#59657f','#fff5ce55',4);if(active){ctx.save();ctx.globalAlpha=.15+Math.sin(st.elapsed*3)*.05;polygon([[o.x-12,o.y-30],[o.x+12,o.y-30],[o.x+110,o.y-240],[o.x-110,o.y-240]],'#fff4a9');ctx.restore()}text(active?'POWERED':'OFFLINE',o.x,o.y+79,'900 14px system-ui',active?'#ffecac':'#d4b3bc')}
function checkpointObject(o){const active=o.lit,pending=o.idx===st.world.checkpoint,t=st.elapsed;glow(o.x,o.y,pending?126:65,pending?'#ffd87766':'#7081d832');circ(o.x,o.y,56,active?'#1f5a5b':'#263754',pending?'#ffe49f':'#6181a1',8);circ(o.x,o.y,37,active?'#62d8b7':pending?'#f8bd70':'#37506c');text(active?'✓':String(o.idx+1),o.x,o.y,'1000 48px system-ui',active?'#163e4c':pending?'#35304a':'#95a6be');text(active?'CLEARED':pending?'TARGET':'LOCKED',o.x,o.y+88,'900 15px system-ui',active?'#7cf5cc':pending?'#ffe2aa':'#8491af');if(pending){for(let j=0;j<5;j++){let a=t*2+j*TAU/5;circ(o.x+Math.cos(a)*76,o.y+Math.sin(a)*76,4,'#ffdb98')}}}
function hazardObject(h){const t=st.elapsed;shadow(h.x,h.y+9,h.r);if(h.type==='cart'){ctx.save();ctx.translate(h.x,h.y);ctx.rotate(Math.sin(t*2+h.phase)*.14);box(-33,-23,67,50,'#b46964',9);box(-36,-30,72,19,'#e2b27e',5);box(-31,-26,62,16,'#efc88c',4);circ(-23,28,9,'#263343','#a9bfd0',3);circ(24,28,9,'#263343','#a9bfd0',3);text('⚠',0,-2,'900 32px system-ui','#ffe7ac');ctx.restore()}else if(h.type==='pumpkin'){ctx.save();ctx.translate(h.x,h.y);ctx.rotate(t*.8);for(let j=0;j<3;j++)ellipse((j-1)*12,0,22,29,j%2?'#ed9a4e':'#ffb361');box(-6,-36,12,16,'#5b8a5c',4);ctx.restore()}else if(h.type==='beam'){glow(h.x,h.y,85,'#f065bd51');ctx.save();ctx.globalAlpha=.35;polygon([[h.x,h.y-190],[h.x-53,h.y+25],[h.x+53,h.y+25]],'#fb72c8');ctx.restore();circ(h.x,h.y-4,26,'#e86bb3','#fff2c0',5);text('!',h.x,h.y-5,'1000 30px system-ui','#3e2952')}}
function projectile(f){glow(f.x,f.y,42,'#ff759a77');ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);polygon([[-17,-13],[18,-14],[23,13],[-13,20]],'#fda26c','#ffedb5',4);line(-12,-9,15,9,'#ac455a',4);ctx.restore()}
function bossObject(b){const t=st.elapsed;glow(b.x,b.y,200,b.alive?'#ff719649':'#73ffd858');shadow(b.x,b.y+76,106);ctx.save();ctx.translate(b.x,b.y+Math.sin(t*4)*5);const flash=b.hit>0;
 for(let side of [-1,1]){box(side*81-16,5,33,96,'#576b83',9);circ(side*81,96,23,'#222b45','#ffca8b',6);box(side*102-17,-37,37,67,'#d97680',12);circ(side*105,-9,23,'#fda684','#ffe4a9',5)}
 box(-108,-88,216,169,flash?'#fff3d1':'#a75481',32);box(-92,-70,184,120,'#25304f',20);box(-86,-62,173,100,'#3e5272',14);circ(-39,-17,28,flash?'#fff':'#ff657e','#ffdc9e',7);circ(43,-17,28,flash?'#fff':'#ff657e','#ffdc9e',7);circ(-39,-17,10,'#171c38');circ(43,-17,10,'#171c38');box(-39,41,81,22,'#f5b86c',8);for(let j=0;j<4;j++)box(-28+j*20,43,8,18,'#80526a',3);
 box(-96,-120,192,30,'#c67a7c',12);box(-75,-151,150,48,'#eeb67f',12);text('MAYHEM',0,-131,'1000 25px system-ui','#26334c');circ(-74,-102,17,'#ffdb7a');circ(76,-102,17,'#ffdb7a');ctx.restore();if(b.alive){const hp=b.hp/b.max;box(b.x-102,b.y-228,204,19,'#10182d',9);box(b.x-98,b.y-224,196*hp,11,hp>.35?'#f7a2a1':'#ff4f66',7);text('BOSS HP',b.x,b.y-244,'1000 16px system-ui','#ffe6ca')}else text('SYSTEM OFFLINE',b.x,b.y-240,'1000 23px system-ui','#90ffde')}
function labelAt(x,y,title,color='#f5e7b2'){box(x-69,y-31,138,29,'#13233dd9',7);text(title,x,y-16,'1000 13px system-ui',color)}
function objective(){
 const w=st.world;if(!w)return null;if(goalReady())return w.exit;
 if(w.items.some(o=>!o.got))return w.items.filter(o=>!o.got).reduce((a,b)=>Math.hypot(a.x-st.player.x,a.y-st.player.y)<Math.hypot(b.x-st.player.x,b.y-st.player.y)?a:b);
 if(w.kind==='badges')return w.objects.find(o=>o.type==='trunk');
 if(w.kind==='consoles')return w.objects.find(o=>o.type==='console'&&!o.locked);
 if(w.kind==='checkpoint')return w.objects.find(o=>o.type==='checkpoint'&&o.idx===w.checkpoint);
 if(w.kind==='towers'||w.kind==='boss')return w.objects.find(o=>o.type==='tower'&&!o.lit)||st.boss;
 return w.exit;
}

function objectiveArrow(){const o=objective();if(!o)return;const sx=o.x-st.cam.x,sy=o.y-st.cam.y;if(sx>92&&sx<W-85&&sy>140&&sy<H-100)return;const cx=W*.5,cy=H*.5,a=Math.atan2(sy-cy,sx-cx);let x=clamp(cx+Math.cos(a)*440,100,W-110),y=clamp(cy+Math.sin(a)*215,147,H-115);ctx.save();ctx.translate(x,y);ctx.rotate(a);polygon([[20,0],[-16,-14],[-9,0],[-16,14]],'#ffdd8e','#764965',3);ctx.restore();box(x-47,y+23,94,20,'#102139e0',9);text(`${Math.round(Math.hypot(o.x-st.player.x,o.y-st.player.y)/10)*10}m`,x,y+32,'900 13px system-ui','#ffe4ac')}
function drawFX(){for(const p of st.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.total,0,1);circ(p.x,p.y,p.size,p.color);ctx.restore()}for(const f of st.floaters){ctx.save();ctx.globalAlpha=clamp(f.life,0,1);text(f.text,f.x,f.y,'1000 22px system-ui',f.color,'#26344c');ctx.restore()}}
function renderGame(){const w=st.world,p=st.player;if(!w||!p)return;ctx.save();if(st.shake>1)ctx.translate(rand(-st.shake,st.shake),rand(-st.shake,st.shake));ctx.translate(-Math.round(st.cam.x),-Math.round(st.cam.y));ground(w);backgroundStructure(w);drawDecor(w);exitPortal(w.exit);if(st.level===4){ctx.save();ctx.globalAlpha=.15;for(const tw of w.objects.filter(x=>x.type==='tower')){line(tw.x,tw.y,st.boss?.x||1400,st.boss?.y||580,tw.lit?'#fbe599':'#a07bbb',14)}ctx.restore()}
 for(const h of w.hazards)hazardObject(h);for(const it of w.secrets)collectible(it);for(const it of w.items)collectible(it);
 for(const o of w.objects){if(o.type==='npc')npcObject(o);else if(o.type==='trunk')trunkObject(o);else if(o.type==='console')consoleObject(o);else if(o.type==='checkpoint')checkpointObject(o);else if(o.type==='tower')towerObject(o)}
 if(st.boss)bossObject(st.boss);for(const f of st.fireballs)projectile(f);
 for(const b of st.burst){let progress=b.life/b.max;ctx.save();ctx.globalAlpha=progress;line(b.x,b.y,b.tx,b.ty,'#96f8ef',9*progress+2);glow(lerp(b.x,b.tx,1-progress),lerp(b.y,b.ty,1-progress),35,'#d5fffd91');ctx.restore()}
 if(p.inv<=0||Math.floor(st.elapsed*12)%2===0)character(p.x,p.y,1.15,'gator',p.face,p.walk,p.inv>0);
 drawFX();ctx.restore();objectiveArrow();
 const vign=ctx.createRadialGradient(W*.5,H*.5,260,W*.5,H*.5,800);vign.addColorStop(0,'#0000');vign.addColorStop(1,'#030a1b8e');ctx.fillStyle=vign;ctx.fillRect(0,0,W,H);
 if(p.inv>0){ctx.fillStyle=`rgba(255,70,100,${.13*p.inv})`;ctx.fillRect(0,0,W,H)}
}
function renderAttract(time){const t=time/1000;let bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#142641');bg.addColorStop(.5,'#273456');bg.addColorStop(1,'#0d132e');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);glow(980,340,480,'#f06d9260');glow(1200,120,320,'#6bbfdd44');glow(680,690,380,'#64eab123');
 for(let i=0;i<15;i++){let x=640+i*58;line(x,-20,x-130,H+20,'#ffe7b013',14)}for(let i=0;i<11;i++){ctx.save();ctx.translate(680+i*73,116+Math.sin(t+i)*8);ctx.rotate(Math.sin(t+i)*.06);ellipse(0,0,28,54,i%2?'#904d76':'#ad596d');ctx.restore()}box(650,600,640,120,'#a95b7c88');box(650,632,640,90,'#713e7288');for(let i=0;i<16;i++)box(680+i*38,656,21,8,'#ffd9a57b',4);
 for(let i=0;i<st.attractLeaves.length;i++){let l=st.attractLeaves[i];l.y+=(0.6+l.spd)*.36;if(l.y>H+35){l.y=-30;l.x=rand(0,W)}ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.rot+t*.5);ellipse(0,0,l.s,l.s*.4,i%2?'#ffd2837a':'#ec917d85');ctx.restore()}
 ctx.save();ctx.translate(1120,410);ctx.rotate(Math.sin(t*1.3)*.04);drawAttractBot();ctx.restore();character(850,580,2.65,'gator',1,t*3);box(706,648,180,36,'#10213ddc',9);text('YOUR HERO',796,666,'1000 20px system-ui','#ffe4a6');ctx.fillStyle='rgba(4,9,23,.12)';ctx.fillRect(0,0,W,H)
}
function drawAttractBot(){glow(0,0,200,'#ffd4c13d');box(-110,-95,220,195,'#bd6e8b',38);box(-90,-74,180,140,'#27314f',24);circ(-43,-18,31,'#f17389','#ffdfb5',7);circ(47,-18,31,'#f17389','#ffdfb5',7);circ(-43,-18,11,'#302643');circ(47,-18,11,'#302643');box(-44,47,88,24,'#ffda96',7);for(let i=0;i<4;i++)box(-33+i*23,48,8,20,'#854d6e',3);box(-82,-141,164,58,'#f7c384',13);text('MAYHEM',0,-112,'1000 27px system-ui','#34405d');circ(-86,-90,17,'#ffe6ab');circ(89,-90,17,'#ffe6ab');box(-134,5,39,91,'#5e738b',12);box(96,5,39,91,'#5e738b',12)}
function frame(now){const dt=Math.min(.044,(now-(st.last||now))/1000||.016);st.last=now;st.now=now;try{if(st.screen==='playing'){tick(dt);if(st.screen==='playing')renderGame();else renderAttract(now)}else renderAttract(now)}catch(e){console.error('Game frame error:',e);if(st.screen==='playing')pause()}requestAnimationFrame(frame)}
/* ------------------------- UI / INPUT ----------------------------------- */
function pause(){if(st.screen!=='playing')return;showView('paused');keys.clear();stick.x=stick.y=0}
function resume(){liveView();st.last=performance.now()}
function openFinale(){const total=Object.entries(save.bests).filter(([k])=>k.endsWith('-'+st.mode)).reduce((sum,[,v])=>sum+(v.score||0),0);$('totalPoints').textContent=total.toLocaleString();showView('won');beep('complete')}
on($('startBtn'),'click',()=>{beep('click');showView('mode')});on($('mapBtn'),'click',map);on($('continueBtn'),'click',()=>briefLevel(Math.min(4,save.unlocked)));on($('launchBtn'),'click',launchLevel);on($('pauseBtn'),'click',pause);on($('resumeBtn'),'click',resume);on($('nextActBtn'),'click',()=>beginAct(true));on($('actMapBtn'),'click',map);on($('readMissionBtn'),'click',()=>{let msg=`Chapter ${st.level+1}. Act ${st.act+1}. ${ACTS[st.level][st.act].title}. ${ACTS[st.level][st.act].hint}. Move the stick to explore. Tap interact near glowing objects.`;try{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(msg);utterance.rate=.9;window.speechSynthesis.speak(utterance)}catch{popup('READ ALOUD','Speech is not available on this device.','🔊')}});on($('restartBtn'),'click',()=>beginAct(true));on($('quitBtn'),'click',map);on($('replayBtn'),'click',()=>{st.act=0;launchLevel()});on($('retryBtn'),'click',()=>beginAct(true));on($('deadMapBtn'),'click',map);on($('nextBtn'),'click',()=>st.level===4?openFinale():briefLevel(st.level+1));on($('playAgainBtn'),'click',()=>{st.act=0;briefLevel(0)});on($('winnerMapBtn'),'click',map);
document.querySelectorAll('[data-go]').forEach(b=>on(b,'click',()=>showView(b.dataset.go)));
document.querySelectorAll('[data-mode]').forEach(b=>on(b,'click',()=>{st.mode=b.dataset.mode;save.mode=st.mode;persist();beep('complete');briefLevel(Math.min(4,save.unlocked))}));
on($('soundBtn'),'click',()=>{muted=!muted;$('soundBtn').textContent=muted?'♪̸':'♫';$('soundBtn').title=muted?'Unmute':'Mute';if(!muted)beep('coin')});
on($('fullscreenBtn'),'click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('gameFrame').requestFullscreen)await $('gameFrame').requestFullscreen()}catch{popup('FULLSCREEN','Use Safari Share → Add to Home Screen for an immersive iPad game.','⛶')}});
on(document,'keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(key)&&st.screen==='playing')e.preventDefault();keys.add(key);if(e.repeat)return;if(key==='escape'||key==='p'){if(st.screen==='playing')pause();else if(st.screen==='paused')resume()}else if((key==='e'||key===' ')&&st.screen==='playing'){action()}else if(key==='shift'&&st.screen==='playing'){dash()}else if(key==='enter'&&st.screen==='menu')showView('mode')});
on(document,'keyup',e=>keys.delete(e.key.toLowerCase()));on(window,'blur',()=>{keys.clear();stick.x=stick.y=0;if(st.screen==='playing')pause()});on(document,'visibilitychange',()=>{if(document.hidden&&st.screen==='playing')pause()});
// Pointer Capture makes the joystick usable while a finger slides outside its circle.
const stickZone=$('stickZone'),knob=$('stickKnob');
function stickAt(e){const r=stickZone.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy),limit=Math.max(30,r.width*.31);stick.x=clamp(dx/limit,-1,1);stick.y=clamp(dy/limit,-1,1);if(m>limit){stick.x=dx/m;stick.y=dy/m}knob.style.transform=`translate(${stick.x*limit*.75}px,${stick.y*limit*.75}px)`}
on(stickZone,'pointerdown',e=>{if(st.screen!=='playing')return;e.preventDefault();stick.pointer=e.pointerId;try{stickZone.setPointerCapture(e.pointerId)}catch{}stickAt(e)});
on(stickZone,'pointermove',e=>{if(stick.pointer!==e.pointerId)return;e.preventDefault();stickAt(e)});
function stopStick(e){if(stick.pointer!==e.pointerId)return;stick.pointer=null;stick.x=stick.y=0;knob.style.transform='translate(0px,0px)'}
on(stickZone,'pointerup',stopStick);on(stickZone,'pointercancel',stopStick);on(stickZone,'lostpointercapture',()=>{stick.pointer=null;stick.x=stick.y=0;knob.style.transform='translate(0px,0px)'});
for(let [id,fn] of [['dashBtn',dash],['actionBtn',action]]){const el=$(id);on(el,'pointerdown',e=>{e.preventDefault();el.classList.add('pressed');fn()});on(el,'pointerup',()=>el.classList.remove('pressed'));on(el,'pointercancel',()=>el.classList.remove('pressed'));on(el,'pointerleave',()=>el.classList.remove('pressed'))}
// Gamepad support: connect an external Bluetooth controller to an iPad for true console controls.
let padLast={a:false,b:false,start:false};
function readGamepad(){try{let p=[...(navigator.getGamepads?.()||[])].find(x=>x&&x.connected);if(!p){return}if(st.screen==='playing'){const ax=p.axes?.[0]||0,ay=p.axes?.[1]||0;stick.x=Math.abs(ax)>.15?ax:0;stick.y=Math.abs(ay)>.15?ay:0;let a=!!p.buttons?.[0]?.pressed,b=!!p.buttons?.[1]?.pressed,start=!!p.buttons?.[9]?.pressed;if(a&&!padLast.a)action();if(b&&!padLast.b)dash();if(start&&!padLast.start)pause();padLast={a,b,start}}}catch{}}
function originalFrame(ts){readGamepad();frame(ts)}
// frame schedules itself; gamepads are polled at a bounded interval independently.
setInterval(readGamepad,50);
showView('menu');requestAnimationFrame(frame);
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
// Exposes readonly snapshots and local developer helpers for non-invasive classroom QA.
window.BackstageMayhem={getState:()=>({screen:st.screen,level:st.level,act:st.act,wave:st.wave,mode:st.mode,elapsed:st.elapsed,health:st.player?.hp,score:st.score,progress:st.world?progressStatus():null,player:st.player?{x:st.player.x,y:st.player.y}:null}),getSave:()=>({...save}),test:{settle:()=>updatePickups(),cooldownZero:()=>{if(st.player)st.player.blastCD=0},getWorld:()=>({kind:st.world?.kind,roundCount:st.world?.roundCount,items:st.world?.items.map(o=>({x:o.x,y:o.y,got:o.got}))||[],objects:st.world?.objects.map(o=>({type:o.type,x:o.x,y:o.y,idx:o.idx,sel:o.sel,target:o.target,lit:o.lit,locked:o.locked,open:o.open}))||[],exit:st.world?.exit,checkpoint:st.world?.checkpoint}),warp:(x,y)=>{if(st.screen==='playing'){st.player.x=x;st.player.y=y;st.cam.x=clamp(x-W*.43,0,st.world.w-W);st.cam.y=clamp(y-H*.5,0,st.world.h-H)}},action:()=>action(),dash:()=>dash()}};
})();
