(() => {
  const status=document.getElementById('world-status');
  const detail=document.getElementById('world-detail');
  const copy=document.getElementById('copy-ip');
  copy.onclick=async()=>{try{await navigator.clipboard.writeText('laredsmp.xyz');document.getElementById('copy-result').textContent='IP copiada';}catch{document.getElementById('copy-result').textContent='Copia manualmente: laredsmp.xyz';}};
  let busy=false;
  async function refresh(){
    if(busy||document.hidden)return;busy=true;
    status.textContent='Consultando…';status.dataset.state='unknown';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch('https://api.mcsrvstat.us/3/laredsmp.xyz',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error('Status service unavailable');
      const data=await response.json();if(typeof data.online!=='boolean')throw new Error('Invalid status');
      status.dataset.state=data.online?'online':'offline';status.textContent=data.online?'En línea':'Fuera de línea';
      const count=data.players?.online;
      detail.textContent=(data.online&&Number.isInteger(count)&&count>=0?count+' jugadores conectados · ':'')+'Estado consultado · puede demorar hasta 5 min';
    }catch{status.dataset.state='unknown';status.textContent='Sin verificar';detail.textContent='No se pudo consultar el servidor. Intentaremos de nuevo.';}
    finally{clearTimeout(timeout);busy=false;}
  }
  refresh();setInterval(refresh,300000);
})();
