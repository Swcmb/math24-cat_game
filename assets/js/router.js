(function(){
  const routes = {
    '#home':'view-home',
    '#24':'view-24'
  };

  function render(hash){
    const app = document.getElementById('app');
    const key = routes[hash] ? hash : '#home';
    const tplId = routes[key];
    const tpl = document.getElementById(tplId);
    if(!tpl){ app.innerHTML = '<section class="card"><h2>未找到页面</h2></section>'; return; }
    app.innerHTML = tpl.innerHTML;
    highlightNav(key);
    window.scrollTo({top:0,behavior:'instant'});
    // 通知视图渲染完成，供后续模块挂载
    const ev = new CustomEvent('view:rendered',{detail:{route:key}});
    window.dispatchEvent(ev);
  }

  function highlightNav(hash){
    document.querySelectorAll('.nav-links a').forEach(a=>{
      if(a.getAttribute('href')===hash){ a.classList.add('active'); }
      else { a.classList.remove('active'); }
    });
  }

  function onHashChange(){
    render(location.hash);
  }

  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('DOMContentLoaded', ()=>render(location.hash||'#home'));
})();