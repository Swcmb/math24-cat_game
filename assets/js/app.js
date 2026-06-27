(function(){
  // 主题切换占位（可扩展为暗/亮两套变量）
  const themeBtn = document.getElementById('themeToggle');
  if(themeBtn){
    themeBtn.addEventListener('click', ()=>{
      document.body.classList.toggle('alt');
    });
  }

  // 后续模块在视图渲染后挂载
  window.addEventListener('view:rendered', (e)=>{
    const route = e.detail.route;
    if(route==='#24'){
      if(window.TwentyFourAdapter && typeof window.TwentyFourAdapter.init==='function'){
        window.TwentyFourAdapter.init();
      }
    }
  });
})();