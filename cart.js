(() => {
  const catalog = window.STORE_CATALOG;
  const key = 'lared-cart-v1';
  let state = {items:{}, username:''};
  try { const saved=JSON.parse(localStorage.getItem(key)); if(saved && typeof saved==='object'){state.username=typeof saved.username==='string'?saved.username.slice(0,32):''; for(const [id,n] of Object.entries(saved.items||{})) if(catalog[id] && Number.isInteger(n) && n>0 && n<=99) state.items[id]=catalog[id].unit==='meses'?1:n;} } catch {}
  const el=(tag,text,cls)=>{const n=document.createElement(tag); if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const money=n=>'$'+new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+' USD';
  const status=el('div','','cart-toast');status.setAttribute('role','status');document.body.append(status);
  let timer;
  function announce(message,ms){status.textContent=message;clearTimeout(timer);timer=setTimeout(()=>status.textContent='',ms||4000);}
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{announce('No se pudo guardar: el carrito durará solo esta visita.');} count();}
  const trigger=el('button','Carrito','cart-trigger');trigger.type='button';document.querySelector('.nav').append(trigger);
  const dialog=el('dialog','','cart-dialog');dialog.setAttribute('aria-labelledby','cart-heading');
  const heading=el('h2','Tu carrito');heading.id='cart-heading';
  const close=el('button','Cerrar','cart-close');close.type='button';close.onclick=()=>dialog.close();
  const list=el('div','','cart-lines');const total=el('p','','cart-total');
  const label=el('label','Nombre exacto en Minecraft');const user=el('input');user.type='text';user.maxLength=32;user.autocomplete='off';user.spellcheck=false;user.value=state.username;label.append(user);
  const hint=el('p','Escribe tu nombre exacto del juego (en Bedrock con un punto al inicio, ej: .TuNombre). Si el nombre está mal, la compra le llega a otra cuenta.','cart-note');
  user.addEventListener('input',()=>{state.username=user.value.trim();save();});
  const notice=el('p','El pago lo procesa Tebex (vendedor oficial). La entrega es automática cuando estés conectado al servidor. Los rangos se cobran cada mes hasta que los canceles desde Tebex; el rango mayor ya incluye a los menores (no se suman). Productos digitales: sin reembolso salvo error de entrega.','cart-note');
  const checkout=el('button','Pagar con Tebex','small-button');checkout.type='button';
  const TEBEX={token:'143ub-bf976289cf3a0b5dbaeb4a98e8054dd8f0ae8ce5',api:'https://headless.tebex.io/api'};
  const api=async(path,body)=>{const r=await fetch(TEBEX.api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('tebex '+r.status);return (await r.json()).data;};
  checkout.onclick=async()=>{
    const name=state.username.trim();
    if(!Object.keys(state.items).length){announce('Tu carrito está vacío.');return;}
    if(!/^\.?[A-Za-z0-9_]{3,16}$/.test(name)){announce('Escribe tu nombre exacto de Minecraft (3 a 16 letras, números o _; en Bedrock empieza con punto).');user.focus();return;}
    checkout.disabled=true;checkout.textContent='Creando pago…';
    try{
      const here=location.origin+location.pathname.replace(/[^/]*$/,'')+'tienda.html';
      const basket=await api('/accounts/'+TEBEX.token+'/baskets',{complete_url:here+'?pago=ok',cancel_url:here+'?pago=cancelado',username:name});
      for(const [id,n] of Object.entries(state.items)){
        const qty=catalog[id].unit==='meses'?1:n;
        await api('/baskets/'+basket.ident+'/packages',{package_id:catalog[id].tebex,quantity:qty});
      }
      location.href=(basket.links&&basket.links.checkout)||('https://pay.tebex.io/'+basket.ident);
    }catch(e){console.error('Tebex',e);announce('No se pudo crear el pago. Inténtalo de nuevo o escríbenos en Discord.');checkout.disabled=false;checkout.textContent='Pagar con Tebex';}
  };
  const terms=el('a','Términos y reembolsos','cart-note');terms.href='terminos.html';
  dialog.append(close,heading,list,total,label,hint,notice,terms,checkout);document.body.append(dialog);
  function count(){trigger.textContent='Carrito ('+Object.values(state.items).reduce((a,b)=>a+b,0)+')';}
  function render(){list.replaceChildren();let sum=0;
    for(const [id,n] of Object.entries(state.items)){const p=catalog[id];sum+=p.cents*n;const row=el('article','','cart-line');const img=el('img');img.src=p.image;img.alt='';const details=el('div');details.append(el('h3',p.name),el('p',money(p.cents)+' / '+(p.unit==='meses'?'mes':p.unit==='unidades'?'unidad':'pack')));
      const qty=el('input');qty.type='number';qty.min=1;qty.max=99;qty.step=1;qty.value=n;if(p.unit==='meses'){qty.max=1;qty.disabled=true;}qty.setAttribute('aria-label','Cantidad de '+p.name);qty.onchange=()=>{if(!qty.checkValidity()||!Number.isInteger(qty.valueAsNumber)){qty.reportValidity();qty.value=state.items[id];return;}state.items[id]=qty.valueAsNumber;save();render();};
      const remove=el('button','Quitar');remove.type='button';remove.setAttribute('aria-label','Quitar '+p.name);remove.onclick=()=>{delete state.items[id];save();render();};details.append(qty,remove,el('strong',money(p.cents*n)));row.append(img,details);list.append(row);
    }
    if(!Object.keys(state.items).length) list.append(el('p','Tu carrito está vacío. Añade productos desde el catálogo.'));
    total.textContent='Total estimado: '+money(sum);
  }
  trigger.onclick=()=>{render();dialog.showModal();};
  document.querySelectorAll('[data-add]').forEach(button=>button.onclick=()=>{const id=button.dataset.add;const input=button.parentElement.querySelector('input');if(!input.checkValidity()||!Number.isInteger(input.valueAsNumber)){input.reportValidity();return;}if(catalog[id].unit==='meses'){state.items[id]=1;save();announce('Añadido: '+catalog[id].name+' (suscripción mensual: se renueva sola cada mes).');return;}const n=(state.items[id]||0)+input.valueAsNumber;if(n>99){announce('Máximo 99 por producto en el carrito.');return;}state.items[id]=n;save();announce('Añadido: '+catalog[id].name);});
  // Public sharing excludes local preview URLs and all cart/player information.
  const localPreview=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const shareBar=el('div','','share-bar');
  const share=el('button',localPreview?'Copiar texto para compartir':'Compartir tienda','share-button');share.type='button';
  share.onclick=async()=>{const text='LaRedSMP · Survival semi-anárquico. Explora rangos mensuales, RedCoins, llaves y spawners. Comunidad y novedades: https://discord.gg/AKA9tEqUUM';const url=localPreview?'':location.origin+location.pathname.replace(/[^/]*$/,'')+'tienda.html';try{if(!localPreview && navigator.share)await navigator.share({title:'LaRedSMP',text,url});else{await navigator.clipboard.writeText(text+(url?'\n'+url:''));announce('Texto copiado para compartir.');}}catch(error){if(error.name!=='AbortError')announce('No se pudo copiar. Puedes compartir nuestro enlace de Discord.');}};
  if(document.querySelector('.store-home')){shareBar.append(el('span','Invita a tu comunidad'),share);document.querySelector('.catalog').append(shareBar);}
  const coinAmounts={'redcoins-1':2500,'redcoins-2':6000,'redcoins-3':15000};
  const best=Object.keys(coinAmounts).reduce((a,b)=>coinAmounts[a]/catalog[a].cents>coinAmounts[b]/catalog[b].cents?a:b);
  document.querySelectorAll('[data-add]').forEach(button=>{const id=button.dataset.add;const card=button.closest('.product');card.id=id;
    if(coinAmounts[id]){const value=el('span',money(Math.round(catalog[id].cents*1000/coinAmounts[id]))+' / 1.000 monedas','unit-value');card.querySelector('.price').after(value);if(id===best){const badge=el('span','Más monedas por dólar','value-badge');card.querySelector('.visual').append(badge);}}
  });
  const groups=[...document.querySelectorAll('.spawner-group')];
  if(groups.length){const bar=el('div','','catalog-search');const label=el('label','Buscar spawner');const search=el('input');search.type='search';search.placeholder='Por ejemplo: creeper';label.append(search);const result=el('span');result.setAttribute('role','status');bar.append(label,result);document.querySelector('.catalog').prepend(bar);const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const filter=()=>{let count=0;groups.forEach(group=>{let visible=0;group.querySelectorAll('.product').forEach(card=>{card.hidden=!normalize(card.querySelector('h3').textContent).includes(normalize(search.value.trim()));if(!card.hidden){visible++;count++;}});group.hidden=visible===0;});result.textContent=count?count+' spawners':'No hay resultados. Prueba otro nombre.';};search.oninput=filter;filter();}
  // Regreso desde Tebex (complete_url / cancel_url)
  const pago=new URLSearchParams(location.search).get('pago');
  if(pago==='ok'){state.items={};save();announce('¡Pago recibido! Entra al servidor para recibir tu compra (debes estar conectado).',15000);}
  else if(pago==='cancelado'){announce('Pago cancelado. Tu carrito sigue guardado.',10000);}
  if(pago){try{history.replaceState(null,'',location.pathname);}catch{}}
  count();
})();
