// CONFIG
const LOCAL_FACTS_FILE = 'facts.json'; // local fallback
let REMOTE_FACTS_URL = localStorage.getItem('remoteFactsUrl') || '';

// state
let facts = [];
let currentIndex = 0;
let favorites = JSON.parse(localStorage.getItem('favorites')||'[]');

// util
function randInt(max){ return Math.floor(Math.random()*max); }
function showFact(i){
  if(!facts.length) return;
  currentIndex = i;
  const f = facts[i];
  document.getElementById('factTitle').innerText = f.title || 'Fact';
  document.getElementById('factText').innerText = f.text || '';
  document.getElementById('favToggle').innerText = favorites.includes(f.id) ? '♥' : '♡';
}

// load facts (try remote then local)
async function loadFacts() {
  try {
    if(REMOTE_FACTS_URL){
      const r = await fetch(REMOTE_FACTS_URL);
      if(r.ok){ facts = await r.json(); saveLocalFacts(); return; }
    }
  } catch(e){ /* ignore */ }
  // fallback local
  try {
    const res = await fetch(LOCAL_FACTS_FILE);
    facts = await res.json();
  } catch(e){ facts = [{id:1,title:'No facts',text:'No facts available.'}]; }
}

function saveLocalFacts(){ localStorage.setItem('localFacts', JSON.stringify(facts)); }
function nextFact(){ if(!facts.length) return; showFact(randInt(facts.length)); }
function toggleFav(){
  if(!facts.length) return;
  const id = facts[currentIndex].id;
  if(favorites.includes(id)) favorites = favorites.filter(x=>x!==id);
  else favorites.push(id);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  showFact(currentIndex);
}
function shareFact(){
  if(!facts.length) return;
  const f = facts[currentIndex];
  if(navigator.share){ navigator.share({title:f.title,text:`${f.title}\n\n${f.text}`}); }
  else { prompt('Copy fact to share', `${f.title}\n\n${f.text}`); }
}

// settings UI
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('nextBtn').addEventListener('click', ()=>{ nextFact(); });
  document.getElementById('favToggle').addEventListener('click', ()=>{ toggleFav(); });
  document.getElementById('shareBtn').addEventListener('click', ()=>{ shareFact(); });
  document.getElementById('settingsBtn').addEventListener('click', ()=>{
    const url = prompt('Remote JSON URL (leave empty to use local):', REMOTE_FACTS_URL);
    if(url!==null){
      REMOTE_FACTS_URL = url.trim();
      localStorage.setItem('remoteFactsUrl', REMOTE_FACTS_URL);
      loadFacts().then(()=>{ nextFact(); });
    }
  });
  // load data
  loadFacts().then(()=>{ nextFact(); });
});
