const screens=[...document.querySelectorAll('.screen')];
const nav=document.getElementById('bottomNav');
const toast=document.getElementById('toast');
let previous='home';
function showScreen(name, fromNav=false){
  const current=document.querySelector('.screen.active')?.dataset.screen;
  if(current && !['analysis','scanresult','appointment','treatment','scanner'].includes(current)) previous=current;
  screens.forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
  const main=['home','health','wellbeing','colibri','journal','profile'];
  nav.style.display=main.includes(name)?'flex':'none';
  document.querySelector('.floating-add').style.display=main.includes(name)?'block':'none';
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  window.scrollTo({top:0,behavior:'instant'});
}
function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}

document.addEventListener('click',e=>{
  const navBtn=e.target.closest('[data-nav]'); if(navBtn){showScreen(navBtn.dataset.nav,true);return}
  const open=e.target.closest('[data-open]'); if(open){showScreen(open.dataset.open);return}
  const close=e.target.closest('[data-close]'); if(close){showScreen(previous||'home');return}
  const prompt=e.target.closest('[data-prompt]'); if(prompt){document.getElementById('chatInput').value=prompt.dataset.prompt;sendChat();return}
  const action=e.target.closest('[data-action]')?.dataset.action; if(!action)return;
  const messages={notifications:'Aucune nouvelle notification.', 'dismiss-focus':'Focus masqué pour aujourd’hui.', 'focus-more':'Colibri peut préparer le rendez-vous avec toi.',voice:'Micro activé.', 'today-all':'Agenda complet bientôt disponible.',meal:'Repas enregistré.',meditation:'Pause méditation préparée.',customize:'Personnalisation des actions rapides bientôt disponible.',symptom:'Écran d’ajout de symptôme : prochaine étape de construction.',note:'Nouvelle note créée dans le carnet.',document:'Ouverture de l’import de document.',evolution:'Détail de ton évolution bientôt disponible.',exams:'Tes examens seront regroupés ici.',documents:'Tes documents seront regroupés ici.',measurements:'Tes mesures seront regroupées ici.','women-health':'Le suivi de santé féminine sera ajouté dans la prochaine étape.',reminders:'Gestion des rappels ouverte.','start-pause':'Ta pause de 10 minutes commence maintenant.',gratitude:'Journal de gratitude ouvert.','new-chat':'Nouvelle conversation démarrée.','edit-profile':'Modification du profil ouverte.','personal-info':'Informations personnelles ouvertes.',goals:'Objectifs ouverts.',privacy:'Confidentialité ouverte.',backup:'Sauvegarde locale activée.',export:'Export des données préparé.','add-question':'Question ajoutée au rendez-vous.','finish-appointment':'Rendez-vous marqué comme terminé.','edit-treatment':'Modification du traitement ouverte.','edit-result':'Tu peux vérifier les éléments détectés.','add-all':'Traitement, analyse et document ajoutés.','send-question':'Question envoyée à Colibri.'};
  if(action==='chat-send'){sendChat();return}
  if(action==='send-question'){const q=document.getElementById('quickQuestion').value.trim();if(q){showScreen('colibri',true);document.getElementById('chatInput').value=q;sendChat()}else notify('Écris d’abord ta question.');return}
  if(action==='document'){document.getElementById('galleryInput').click();return}
  notify(messages[action]||'Fonction en préparation.');
});

function sendChat(){const input=document.getElementById('chatInput');const text=input.value.trim();if(!text)return;const area=document.getElementById('chatArea');const user=document.createElement('div');user.className='message user';user.innerHTML=`<p>${escapeHtml(text)}</p>`;area.appendChild(user);input.value='';setTimeout(()=>{const bot=document.createElement('div');bot.className='message bot';bot.innerHTML='<span>🐦</span><p>J’ai bien compris. Cette fonction sera connectée progressivement à tes données de santé.</p>';area.appendChild(bot);area.scrollTop=area.scrollHeight},550);area.scrollTop=area.scrollHeight}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

document.getElementById('shutter').addEventListener('click',()=>{document.getElementById('cameraInput').click()});
['cameraInput','galleryInput'].forEach(id=>document.getElementById(id).addEventListener('change',e=>{if(!e.target.files?.length)return;showScreen('analysis');setTimeout(()=>showScreen('scanresult'),2100)}));
if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
