const STORAGE_KEY='nymia-sprint1-v1';
const defaultState={onboardingComplete:false,profile:{firstName:'',birthDate:'',goals:[]},notificationChoice:'not-asked',documents:[]};
let state=loadState();
let step=0;
const app=document.querySelector('#app');
const toastEl=document.querySelector('#toast');
function loadState(){try{return {...defaultState,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(message){toastEl.textContent=message;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),1800)}
function progress(){return `<div class="progress">${[0,1,2,3,4].map(i=>`<span class="${i<=step?'active':''}"></span>`).join('')}</div>`}
function onboarding(){
 const screens=[welcome,features,profile,goals,notifications];
 app.innerHTML=screens[step]();
 bindOnboarding();
}
function layout(content,buttons=''){return `<main class="onboarding">${progress()}<div class="brand">Nymia</div><section class="hero">${content}</section><div class="actions">${buttons}</div></main>`}
function welcome(){return layout(`<div class="hero-visual"><img src="colibri-round.png" alt="Colibri Nymia"></div><h1>Ta santé, enfin organisée simplement.</h1><p class="lead">Nymia t’aide à centraliser tes informations sans commencer avec de fausses données.</p>`,`<button class="primary" data-next>Commencer</button><button class="ghost" data-demo-reset>Recommencer à zéro</button>`)}
function features(){return layout(`<h1>Tout au même endroit</h1><p class="lead">Tu rempliras Nymia progressivement, selon tes besoins.</p><div class="feature-list"><div class="feature"><div class="feature-icon">🩺</div><div><b>Suivi santé</b><small>Rendez-vous, traitements et documents.</small></div></div><div class="feature"><div class="feature-icon">🌿</div><div><b>Bien-être</b><small>Sommeil, humeur et habitudes.</small></div></div><div class="feature"><div class="feature-icon">🔒</div><div><b>Données privées</b><small>Cette version conserve les informations sur cet appareil.</small></div></div></div>`,`<button class="primary" data-next>Continuer</button><button class="ghost" data-back>Retour</button>`)}
function profile(){return layout(`<h1>Faisons connaissance</h1><p class="lead">Ces informations servent uniquement à personnaliser ton espace.</p><div class="form-wrap"><label class="label" for="firstName">Prénom</label><input class="input" id="firstName" autocomplete="given-name" maxlength="40" placeholder="Ton prénom" value="${esc(state.profile.firstName)}"><label class="label" for="birthDate">Date de naissance <span style="font-weight:400;color:var(--muted)">(facultatif)</span></label><input class="input" id="birthDate" type="date" value="${esc(state.profile.birthDate)}"></div>`,`<button class="primary" data-save-profile>Continuer</button><button class="ghost" data-back>Retour</button>`)}
const goalOptions=[['health','🩺','Organiser ma santé'],['wellbeing','🌿','Suivre mon bien-être'],['documents','📄','Centraliser mes documents'],['reminders','🔔','Recevoir des rappels']];
function goals(){return layout(`<h1>Que veux-tu suivre ?</h1><p class="lead">Tu pourras modifier ce choix plus tard.</p><div class="choices">${goalOptions.map(([id,icon,label])=>`<button class="choice ${state.profile.goals.includes(id)?'selected':''}" data-goal="${id}"><span>${icon}</span><b>${label}</b></button>`).join('')}</div>`,`<button class="primary" data-save-goals>Continuer</button><button class="ghost" data-back>Retour</button>`)}
function notifications(){const status=state.notificationChoice==='granted'?'Notifications autorisées':state.notificationChoice==='denied'?'Notifications refusées':'Aucun choix effectué';return layout(`<h1>Rester informée</h1><p class="lead">Nymia pourra te rappeler tes éléments importants lorsque cette fonction sera activée.</p><div class="permission-card"><div class="row"><div class="bell">🔔</div><div><b>Notifications Nymia</b><p>Tu gardes toujours le contrôle.</p></div></div><div class="permission-status">${status}</div></div>`,`<button class="primary" data-enable-notifications>Autoriser les notifications</button><button class="secondary" data-finish>Plus tard</button><button class="ghost" data-back>Retour</button>`)}
function bindOnboarding(){
 document.querySelector('[data-next]')?.addEventListener('click',()=>{step++;onboarding()});
 document.querySelector('[data-back]')?.addEventListener('click',()=>{step=Math.max(0,step-1);onboarding()});
 document.querySelector('[data-demo-reset]')?.addEventListener('click',resetAll);
 document.querySelector('[data-save-profile]')?.addEventListener('click',()=>{const name=document.querySelector('#firstName').value.trim();if(!name){toast('Entre ton prénom pour continuer');document.querySelector('#firstName').focus();return}state.profile.firstName=name;state.profile.birthDate=document.querySelector('#birthDate').value;save();step++;onboarding()});
 document.querySelectorAll('[data-goal]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.goal;state.profile.goals=state.profile.goals.includes(id)?state.profile.goals.filter(x=>x!==id):[...state.profile.goals,id];save();onboarding()}));
 document.querySelector('[data-save-goals]')?.addEventListener('click',()=>{if(!state.profile.goals.length){toast('Sélectionne au moins un objectif');return}step++;onboarding()});
 document.querySelector('[data-enable-notifications]')?.addEventListener('click',requestNotifications);
 document.querySelector('[data-finish]')?.addEventListener('click',finishOnboarding);
}
async function requestNotifications(){
 if(!('Notification' in window)){state.notificationChoice='unsupported';save();toast('Notifications non disponibles dans ce navigateur');finishOnboarding();return}
 try{const result=await Notification.requestPermission();state.notificationChoice=result;save();if(result==='granted')toast('Notifications autorisées');else toast('Tu pourras les activer plus tard');setTimeout(finishOnboarding,450)}catch{state.notificationChoice='unsupported';save();finishOnboarding()}
}
function finishOnboarding(){state.onboardingComplete=true;save();renderShell('home')}
const screens={
 home:()=>`<section class="screen"><article class="welcome-card"><div><span class="eyebrow">BIENVENUE DANS NYMIA</span><h2>${state.profile.firstName?`Bonjour ${esc(state.profile.firstName)}`:'Bonjour'}</h2><p>Ton espace est prêt. Il est volontairement vide.</p></div><img src="colibri-round.png" alt="Colibri"></article><h3 class="section-title">Aujourd’hui</h3>${empty('🗓️','Rien de prévu','Tes futurs rendez-vous et rappels apparaîtront ici.')}<h3 class="section-title">Actions disponibles</h3><div class="quick"><button data-scan><span>📷</span><small>Scanner</small></button><button data-page="health"><span>🩺</span><small>Ma santé</small></button><button data-page="profile"><span>👤</span><small>Mon profil</small></button></div></section>`,
 health:()=>modulePage('Ma santé','Tes traitements, rendez-vous et documents seront ajoutés lors de l’étape suivante.','🩺'),
 wellbeing:()=>modulePage('Bien-être','Aucune donnée de bien-être n’est enregistrée.','🌿'),
 colibri:()=>modulePage('Colibri','L’assistant sera connecté à tes données dans une prochaine étape.','🐦'),
 profile:()=>`<section class="screen module-page"><h2>Profil</h2><p>Informations enregistrées pendant la première ouverture.</p><div class="settings"><button data-edit-name><span>Prénom</span><b>${esc(state.profile.firstName)}</b></button><button data-replay><span>Revoir l’accueil initial</span><span>›</span></button><button data-reset class="danger"><span>Effacer toutes les données</span><span>›</span></button></div></section>`
};
function empty(icon,title,text){return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`}
function modulePage(title,text,icon){return `<section class="screen module-page"><h2>${title}</h2><p>${text}</p>${empty(icon,'Aucune information','Cette rubrique est prête à recevoir tes propres données.')}</section>`}
function renderShell(page='home'){
 app.innerHTML=`<div class="shell"><header class="topbar"><div><h1>Nymia</h1><p>Ton espace personnel</p></div><button class="avatar" data-page="profile" aria-label="Ouvrir le profil">${esc((state.profile.firstName||'N').charAt(0).toUpperCase())}</button></header><main id="screen">${screens[page]()}</main><nav>${[['home','⌂','Accueil'],['health','♡','Santé'],['wellbeing','♧','Bien-être'],['colibri','🐦','Colibri'],['profile','○','Profil']].map(([id,icon,label])=>`<button data-page="${id}" class="${id===page?'active':''}">${icon}<small>${label}</small></button>`).join('')}</nav></div>`;
 bindShell();
}
function bindShell(){
 document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>renderShell(btn.dataset.page)));
 document.querySelector('[data-scan]')?.addEventListener('click',openScanner);
 document.querySelector('[data-replay]')?.addEventListener('click',()=>{step=0;onboarding()});
 document.querySelector('[data-reset]')?.addEventListener('click',()=>{if(confirm('Effacer toutes les données et revenir à la première ouverture ?'))resetAll()});
 document.querySelector('[data-edit-name]')?.addEventListener('click',()=>{const name=prompt('Ton prénom',state.profile.firstName);if(name===null)return;if(!name.trim()){toast('Le prénom ne peut pas être vide');return}state.profile.firstName=name.trim();save();renderShell('profile');toast('Prénom mis à jour')});
}
function openScanner(){
 const overlay=document.createElement('div');overlay.className='scan-overlay';overlay.innerHTML=`<div class="scan-head"><button class="close" data-close-scan>×</button><b>Ajouter un document</b><span></span></div><div class="scan-zone"><div><span>📄</span><h2>Choisis une source</h2><p>Le document sera seulement enregistré comme import dans cette première étape.</p></div></div><div class="scan-actions"><label class="camera">Appareil photo</label><label class="gallery">Galerie</label></div>`;document.body.appendChild(overlay);
 overlay.querySelector('[data-close-scan]').addEventListener('click',()=>overlay.remove());
 overlay.querySelector('.camera').addEventListener('click',()=>document.querySelector('#cameraInput').click());
 overlay.querySelector('.gallery').addEventListener('click',()=>document.querySelector('#galleryInput').click());
}
function fileChosen(file){if(!file)return;state.documents.push({name:file.name,date:new Date().toISOString()});save();document.querySelector('.scan-overlay')?.remove();toast('Document importé')}
document.querySelector('#cameraInput').addEventListener('change',e=>fileChosen(e.target.files?.[0]));
document.querySelector('#galleryInput').addEventListener('change',e=>fileChosen(e.target.files?.[0]));
function resetAll(){localStorage.removeItem(STORAGE_KEY);state=structuredClone(defaultState);step=0;onboarding();toast('Application réinitialisée')}
if(state.onboardingComplete)renderShell('home');else onboarding();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
