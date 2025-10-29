/* ========== DOM ========== */
const sliderBox = document.getElementById('speedSliderBox');
const slider = document.getElementById('sliderHours');
const labelHours = document.getElementById('labelHours');
const display = document.getElementById('display');

const tabClock = document.getElementById('tabClock');
const tabStopwatch = document.getElementById('tabStopwatch');
const tabAlarm = document.getElementById('tabAlarm');

const stopwatchArea = document.getElementById('stopwatchArea');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsDiv = document.getElementById('laps');

const alarmArea = document.getElementById('alarmArea');
const alarmTimeInput = document.getElementById('alarmTime');
const addAlarmBtn = document.getElementById('addAlarmBtn');
const alarmListDiv = document.getElementById('alarmList');

/* ========== state ========== */
let customHours = Number(localStorage.getItem('nclock_hours')) || 24;
slider.value = customHours;
labelHours.textContent = `${customHours} 時間`;

let mode = localStorage.getItem('nclock_mode') || 'clock';

let running = false;
let elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed')) || 0;
let lastPerf = null;
let laps = JSON.parse(localStorage.getItem('nclock_sw_laps') || '[]');

let alarms = JSON.parse(localStorage.getItem('nclock_alarms') || '[]');

/* ========== helpers ========== */
function saveSettings(){
  localStorage.setItem('nclock_hours', String(customHours));
  localStorage.setItem('nclock_mode', mode);
  localStorage.setItem('nclock_sw_elapsed', String(elapsedMs));
  localStorage.setItem('nclock_sw_laps', JSON.stringify(laps));
  localStorage.setItem('nclock_alarms', JSON.stringify(alarms));
}

function renderLaps(){
  if(laps.length===0){ lapsDiv.innerHTML='<div style="color:#666;padding:8px;">ラップなし</div>'; return; }
  lapsDiv.innerHTML = laps.map((t,i)=>`<div class="lap-item"><div>Lap ${laps.length-i}</div><div>${t}</div></div>`).join('');
}

function renderAlarms(){
  if(alarms.length===0){ alarmListDiv.innerHTML='<div style="color:#666;padding:8px;">アラームなし</div>'; return; }
  alarmListDiv.innerHTML = alarms.map((a,i)=>`
    <div class="alarm-item">
      <div>${a}</div>
      <button onclick="deleteAlarm(${i})">削除</button>
    </div>`).join('');
}

window.deleteAlarm = function(i){
  alarms.splice(i,1);
  renderAlarms();
  saveSettings();
}

/* ========== slider ========== */
slider.addEventListener('input', e=>{
  customHours = Number(e.target.value);
  labelHours.textContent = `${customHours} 時間`;
  saveSettings();
});

/* ========== tabs ========== */
function updateMode(){
  tabClock.classList.toggle('active', mode==='clock');
  tabStopwatch.classList.toggle('active', mode==='stopwatch');
  tabAlarm.classList.toggle('active', mode==='alarm');

  stopwatchArea.style.display = mode==='stopwatch'?'block':'none';
  alarmArea.style.display = mode==='alarm'?'block':'none';
  sliderBox.style.display = mode==='clock'?'block':'none';
}
tabClock.addEventListener('click',()=>{ mode='clock'; updateMode(); saveSettings(); });
tabStopwatch.addEventListener('click',()=>{ mode='stopwatch'; updateMode(); saveSettings(); });
tabAlarm.addEventListener('click',()=>{ mode='alarm'; updateMode(); saveSettings(); });

/* ========== stopwatch buttons ========== */
startBtn.addEventListener('click',()=>{
  if(!running){
    running=true;
    lastPerf=performance.now();
    startBtn.textContent='Stop';
    startBtn.classList.remove('btn-start'); startBtn.classList.add('btn-stop');
    lapBtn.disabled=false; resetBtn.disabled=true;
  } else {
    running=false;
    startBtn.textContent='Start';
    startBtn.classList.remove('btn-stop'); startBtn.classList.add('btn-start');
    lapBtn.disabled=true; resetBtn.disabled=false;
    saveSettings();
  }
});
lapBtn.addEventListener('click',()=>{
  const txt = display.textContent;
  laps.unshift(txt);
  if(laps.length>50) laps.pop();
  renderLaps();
  saveSettings();
});
resetBtn.addEventListener('click',()=>{
  elapsedMs=0; laps=[]; renderLaps(); resetBtn.disabled=true; saveSettings();
});

/* ========== alarm buttons ========== */
addAlarmBtn.addEventListener('click',()=>{
  const val = alarmTimeInput.value;
  if(!val) return;
  alarms.push(val);
  renderAlarms();
  saveSettings();
});

/* ========== tick ========== */
let lastFrameRef=performance.now();
function tick(now){
  // stopwatch
  if(running){
    const dt = now-lastPerf;
    elapsedMs += dt*(24/customHours);
    lastPerf=now;
  }

  if(mode==='clock'){
    const d=new Date();
    const speed = 24/customHours;
    const virtualSec = (d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds())*speed;
    const h=Math.floor(virtualSec/3600)%24;
    const m=Math.floor(virtualSec/60)%60;
    const s=Math.floor(virtualSec)%60;
    display.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  } else if(mode==='stopwatch'){
    const totalSec = Math.floor(elapsedMs/1000);
    const h=Math.floor(totalSec/3600);
    const m=Math.floor(totalSec/60)%60;
    const s=totalSec%60;
    display.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // check alarms
  if(mode==='clock'){
    const nowStr = `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
    alarms.forEach(a=>{
      if(a===nowStr){
        alert(`アラーム: ${a}`);
      }
    });
  }

  lastFrameRef=now;
  requestAnimationFrame(tick);
}

/* ========== init ========== */
renderLaps();
renderAlarms();
updateMode();
requestAnimationFrame(tick);
setInterval(saveSettings,2000);

/* ========== service worker ========== */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
