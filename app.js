const screens=[...document.querySelectorAll('.screen')];
const nav=document.getElementById('bottomNav');
function showScreen(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));nav.style.display=id==='scanner'?'none':'flex';document.querySelectorAll('.bottom-nav button[data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target===id));window.scrollTo(0,0)}
document.querySelectorAll('[data-target]').forEach(el=>el.addEventListener('click',()=>showScreen(el.dataset.target)));
document.getElementById('openScanner').addEventListener('click',()=>showScreen('scanner'));
document.getElementById('navScanner').addEventListener('click',()=>showScreen('scanner'));
document.getElementById('closeScanner').addEventListener('click',()=>showScreen('home'));
document.getElementById('takePhoto').addEventListener('click',()=>{alert('Le scanner réel sera connecté dans la prochaine étape.');showScreen('home')});
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){if(!reg.active||!reg.active.scriptURL.includes('service-worker.js'))await reg.unregister()}await navigator.serviceWorker.register('./service-worker.js?v=4')}catch(e){console.warn(e)}})}
