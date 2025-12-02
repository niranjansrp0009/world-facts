// CONFIG
const LOCAL_FACTS_FILE = 'facts.json'; // local fallback
let REMOTE_FACTS_URL = localStorage.getItem('remoteFactsUrl') || '';

// state
let facts = [];
let currentIndex = -1; // will be set after load
let favorites = JSON.parse(localStorage.getItem('favorites')||'[]');

// util
function showFact(i){
  if(!facts.length) return;
  currentIndex = (i % facts.length + facts.length) % facts.length; // safe wrap
  const f = facts[currentIndex];
  // show title with counter like "Title (12 / 1000)"
  const total = facts.length;
  const counterText = ` (${currentIndex + 1} / ${total})`;
  document.getElementById('factTitle').innerText = (f.title || 'Fact') + counterText;
  document.getElementById('factText').innerText = f.text || '';
  document.getElementById('favToggle').innerText = favorites.includes(f.id) ? '♥' : '♡';
  console.log('Showing fact', currentIndex + 1, 'of', total);
}

// load facts (try remote then local)
async function loadFacts() {
  try {
    if(REMOTE_FACTS_URL){
      const r = await fetch(REMOTE_FACTS_URL);
      if(r.ok){
        facts = await r.json();
        saveLocalFacts();
        return;
      }
    }
  } catch(e){
    console.warn('Remote load failed, falling back to local', e);
  }
  // fallback local
  try {
    const res = await fetch(LOCAL_FACTS_FILE);
    facts = await res.json();
  } catch(e){
    console.error('Loading local facts failed', e);
    facts = [{id:1,title:'No facts',text:'No facts available.'}];
  }
}

function saveLocalFacts(){ localStorage.setItem('localFacts', JSON.stringify(facts)); }

// NEXT -> sequential next (guarantees cycling through the entire list)
function nextFact(){
  if(!facts.length) return;
  // If currentIndex is -1 (never shown), start at 0, else increment
  if(currentIndex < 0) currentIndex = 0;
  else currentIndex = (currentIndex + 1) % facts.length;
  showFact(currentIndex);
}

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
  if(navigator.share){
    navigator.share({title:f.title, text:`${f.title}\n\n${f.text}`});
  } else {
    prompt('Copy fact to share', `${f.title}\n\n${f.text}`);
  }
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
      loadFacts().then(()=>{ 
        currentIndex = -1;
        nextFact();
      });
    }
  });
  // load data and show first fact
  loadFacts().then(()=>{ 
    // if facts loaded, start at random entry so first run is varied, then sequential
    if(facts.length) currentIndex = Math.floor(Math.random() * facts.length);
    else currentIndex = 0;
    showFact(currentIndex);
  });
});
