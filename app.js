const screens=[...document.querySelectorAll('.screen')];
const nav=document.getElementById('bottomNav');
const toast=document.getElementById('toast');
let toastTimer;

function showToast(message){
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),2200);
}

function showScreen(id){
  const target=document.getElementById(id);
  if(!target) return;
  screens.forEach(s=>s.classList.toggle('active',s.id===id));
  const hideNav=['scanner','scan-analysis','scan-result','document-detail','appointment-detail','treatment-detail','lab-detail'].includes(id);
  nav.style.display=hideNav?'none':'flex';
  document.querySelectorAll('.bottom-nav button[data-target]').forEach(b=>b.classList.toggle('active',b.dataset.target===id));
  window.scrollTo({top:0,behavior:'instant'});
}

document.addEventListener('click',e=>{
  const target=e.target.closest('[data-target]');
  if(target){
    e.preventDefault();
    e.stopPropagation();
    showScreen(target.dataset.target);
  }
});

document.querySelectorAll('[data-doc]').forEach(el=>{
  el.addEventListener('click',e=>{
    e.preventDefault();
    const [title,meta]=el.dataset.doc.split('|');
    document.getElementById('docTitle').textContent=title;
    document.getElementById('docMeta').textContent=meta||'';
    showScreen('document-detail');
  });
});

document.getElementById('openScanner').addEventListener('click',()=>showScreen('scanner'));
document.getElementById('navScanner').addEventListener('click',()=>showScreen('scanner'));
document.getElementById('closeScanner').addEventListener('click',()=>showScreen('home'));

const cameraInput=document.getElementById('cameraInput');
const galleryInput=document.getElementById('galleryInput');
const preview=document.getElementById('scanPreview');
const placeholder=document.getElementById('cameraPlaceholder');

document.getElementById('takePhoto').addEventListener('click',()=>cameraInput.click());
document.getElementById('galleryPhoto').addEventListener('click',()=>galleryInput.click());
document.getElementById('flashInfo').addEventListener('click',()=>showToast('Le flash est géré automatiquement par l’appareil photo.'));

function handleImage(file){
  if(!file) return;
  const url=URL.createObjectURL(file);
  preview.src=url;
  preview.style.display='block';
  placeholder.style.display='none';
  setTimeout(()=>{
    showScreen('scan-analysis');
    setTimeout(()=>showScreen('scan-result'),1900);
  },350);
}
cameraInput.addEventListener('change',()=>handleImage(cameraInput.files[0]));
galleryInput.addEventListener('change',()=>handleImage(galleryInput.files[0]));

document.getElementById('confirmScan').addEventListener('click',()=>{
  showToast('Document classé et éléments ajoutés.');
  setTimeout(()=>showScreen('documents'),700);
});

document.getElementById('addDocument').addEventListener('click',()=>showScreen('scanner'));

const documentSearch=document.getElementById('documentSearch');
const documentRows=[...document.querySelectorAll('#documentList .document-row')];
documentSearch.addEventListener('input',()=>{
  const q=documentSearch.value.toLowerCase();
  documentRows.forEach(row=>row.hidden=!row.dataset.name.toLowerCase().includes(q));
});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const filter=btn.dataset.filter;
  documentRows.forEach(row=>row.hidden=filter!=='all'&&!row.dataset.name.includes(filter));
}));

document.getElementById('shareDocument').addEventListener('click',async()=>{
  if(navigator.share){
    try{await navigator.share({title:document.getElementById('docTitle').textContent,text:'Document Nymia'});}
    catch{}
  }else showToast('Partage disponible depuis Safari.');
});
document.getElementById('archiveDocument').addEventListener('click',()=>showToast('Document archivé.'));
document.getElementById('deleteDocument').addEventListener('click',()=>{
  if(confirm('Supprimer ce document ?')){showToast('Document supprimé.');setTimeout(()=>showScreen('documents'),600);}
});

const chatMessages=document.getElementById('chatMessages');
function addMessage(text,type){
  const div=document.createElement('div');
  div.className=`message ${type}`;
  div.textContent=text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop=chatMessages.scrollHeight;
}
document.getElementById('chatForm').addEventListener('submit',e=>{
  e.preventDefault();
  const input=document.getElementById('chatInput');
  const text=input.value.trim();
  if(!text)return;
  addMessage(text,'user');
  input.value='';
  setTimeout(()=>addMessage('Je l’ai noté. Dans cette version de test, je peux vous guider vers les fonctions de Nymia.','bot'),450);
});
document.querySelectorAll('[data-colibri-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const action=btn.dataset.colibriAction;
  const map={scanner:'scanner',symptoms:'symptoms',treatments:'treatments',appointments:'appointments'};
  showScreen(map[action]);
}));

document.getElementById('takeTreatment').addEventListener('click',()=>showToast('Traitement marqué comme pris.'));
document.getElementById('markTaken').addEventListener('click',e=>{e.currentTarget.textContent='Pris ✓';e.currentTarget.disabled=true;showToast('Prise enregistrée.');});
document.getElementById('editTreatment').addEventListener('click',()=>showToast('Modification du traitement ouverte.'));
document.getElementById('addTreatment').addEventListener('click',()=>showToast('Formulaire d’ajout de traitement.'));
document.getElementById('markLabDone').addEventListener('click',()=>showToast('Prise de sang marquée comme réalisée.'));

document.getElementById('addSymptom').addEventListener('click',()=>{
  const name=prompt('Quel symptôme souhaitez-vous ajouter ?');
  if(!name)return;
  document.getElementById('symptomEntries').innerHTML=`<h2>${name}</h2><p>Ajouté aujourd’hui · Intensité à compléter</p>`;
  showToast('Symptôme ajouté.');
});
document.getElementById('addHistory').addEventListener('click',()=>{const x=prompt('Information à ajouter :');if(x)showToast('Information ajoutée au dossier.');});
document.getElementById('addAppointment').addEventListener('click',()=>showToast('Formulaire de rendez-vous ouvert.'));
document.getElementById('addQuestion').addEventListener('click',()=>{
  const q=prompt('Votre question :');
  if(!q)return;
  const label=document.createElement('label');
  label.innerHTML=`<input type="checkbox"> ${q.replace(/[<>]/g,'')}`;
  document.getElementById('questionsList').appendChild(label);
});
['weightMetric','pressureMetric','glucoseMetric','temperatureMetric'].forEach(id=>{
  document.getElementById(id).addEventListener('click',()=>{
    const value=prompt('Entrez la nouvelle valeur :');
    if(value){document.querySelector(`#${id} span`).textContent=value;showToast('Valeur enregistrée.');}
  });
});

document.getElementById('editProfile').addEventListener('click',()=>showToast('Profil prêt à être modifié.'));
document.getElementById('privacyButton').addEventListener('click',()=>showToast('Vos données restent enregistrées sur cet appareil dans cette version.'));
document.getElementById('backupButton').addEventListener('click',()=>showToast('La sauvegarde cloud sera activée dans une prochaine version.'));
document.getElementById('settingsButton').addEventListener('click',()=>showToast('Réglages ouverts.'));

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const reg of regs) await reg.unregister();
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
      await navigator.serviceWorker.register('./service-worker.js?v=5');
    }catch(e){console.warn(e);}
  });
}
