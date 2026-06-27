(function(){
  const LS_STATE_KEY = 'game:24:state';
  const LS_RESULTS_KEY = 'game:results';

  const state = {
    cards: null, // [int,int,int,int] 1..13
    attemptsLeft: 3,
    startedAt: null,
    solved: false,
    submissions: [] // {expr,value,ok,at}
  };

  const SYM_MAP = {'×':'*','x':'*','X':'*','÷':'/'};

  function now(){ return Date.now(); }
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function newCards(){ return [randInt(1,13),randInt(1,13),randInt(1,13),randInt(1,13)]; }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }

  function round6(x){
    return Math.round((x + Number.EPSILON) * 1e6) / 1e6;
  }

  function save(){
    localStorage.setItem(LS_STATE_KEY, JSON.stringify({
      cards: state.cards,
      attemptsLeft: state.attemptsLeft,
      startedAt: state.startedAt,
      solved: state.solved,
      submissions: state.submissions
    }));
  }

  function load(){
    try{
      const raw = localStorage.getItem(LS_STATE_KEY);
      if(!raw) throw 0;
      const s = JSON.parse(raw);
      state.cards = s.cards;
      state.attemptsLeft = s.attemptsLeft;
      state.startedAt = s.startedAt;
      state.solved = !!s.solved;
      state.submissions = Array.isArray(s.submissions)?s.submissions:[];
    }catch(_){
      resetRound(); // init
    }
  }

  function resetRound(){
    state.cards = newCards();
    state.attemptsLeft = 3;
    state.startedAt = now();
    state.solved = false;
    state.submissions = [];
    save();
  }

  function pushResult(entry){
    try{
      const raw = localStorage.getItem(LS_RESULTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(entry);
      localStorage.setItem(LS_RESULTS_KEY, JSON.stringify(arr));
    }catch(_){}
  }

  // UI helpers
  function render(){
    const elCards = document.getElementById('twentyfour-cards');
    const elAttempts = document.getElementById('twentyfour-attempts');
    const elHistory = document.getElementById('twentyfour-history');
    if(elCards){
      elCards.innerHTML = state.cards.map(n=>labelWithNum(n)).map(lbl=>(
        `<div class="cardface">${lbl}</div>`
      )).join('');
    }
    if(elAttempts){
      elAttempts.textContent = String(state.attemptsLeft);
    }
    if(elHistory){
      elHistory.innerHTML = state.submissions.slice(-5).map(s=>{
        const cls = s.ok?'ok':'fail';
        return `<div class="sub ${cls}">${escapeHtml(s.expr)} = ${s.value}</div>`;
      }).join('');
    }
    const elExpr = document.getElementById('twentyfour-expr');
    if(elExpr && state.solved){
      elExpr.setAttribute('disabled','disabled');
    }else if(elExpr){
      elExpr.removeAttribute('disabled');
    }
    const elSubmit = document.getElementById('twentyfour-submit');
    if(elSubmit) elSubmit.disabled = state.solved || state.attemptsLeft<=0;
    const elNew = document.getElementById('twentyfour-new');
    if(elNew) elNew.disabled = false;
  }

  function cardLabel(n){
    if(n===1) return 'A';
    if(n===11) return 'J';
    if(n===12) return 'Q';
    if(n===13) return 'K';
    return String(n);
  }
  function labelWithNum(n){
    const l = cardLabel(n);
    return l===String(n) ? String(n) : `${l}(${n})`;
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, m=>({ '&':'&','<':'<','>':'>','"':'"',"'":'&#39;' }[m]));
  }

  function attachHandlers(){
    const elExpr = document.getElementById('twentyfour-expr');
    const elSubmit = document.getElementById('twentyfour-submit');
    const elClear = document.getElementById('twentyfour-clear');
    const elBack = document.getElementById('twentyfour-back');
    const elNew = document.getElementById('twentyfour-new');

    if(elSubmit){
      elSubmit.onclick = ()=>{
        const exprRaw = (elExpr.value||'').trim();
        const expr = normalizeExpr(exprRaw);
        const check = validateAndEval(expr);
        state.submissions.push({
          expr: exprRaw,
          value: check.value,
          ok: check.ok,
          at: now()
        });
        if(check.ok){
          state.solved = true;
          // record success
          pushResult({
            type: '24',
            success: true,
            cards: clone(state.cards),
            expr: exprRaw,
            value: check.value,
            durationMs: (now() - (state.startedAt||now())),
            finishedAt: now()
          });
        }else{
          // consume attempt if not solved
          state.attemptsLeft = Math.max(0, state.attemptsLeft - 1);
          if(state.attemptsLeft===0){
            // final fail record
            pushResult({
              type: '24',
              success: false,
              cards: clone(state.cards),
              lastExpr: exprRaw,
              value: check.value,
              durationMs: (now() - (state.startedAt||now())),
              finishedAt: now()
            });
          }
        }
        save();
        render();
      };
    }
    if(elClear){
      elClear.onclick = ()=>{
        const el = document.getElementById('twentyfour-expr');
        if(el){ el.value=''; el.focus(); }
      };
    }
    if(elBack){
      elBack.onclick = ()=>{
        const el = document.getElementById('twentyfour-expr');
        if(el){ el.value = el.value.slice(0,-1); el.focus(); }
      };
    }
    if(elNew){
      elNew.onclick = ()=>{
        resetRound();
        render();
      };
    }

    // keypad
    document.querySelectorAll('[data-insert]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-insert');
        const el = document.getElementById('twentyfour-expr');
        if(!el) return;
        el.value += val;
        el.focus();
      });
    });
    // insert cards by value to force matching
    document.querySelectorAll('[data-insert-card]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const idx = parseInt(btn.getAttribute('data-insert-card'));
        const n = state.cards[idx];
        const el = document.getElementById('twentyfour-expr');
        if(!el) return;
        el.value += String(n);
        el.focus();
      });
    });
  }

  function normalizeExpr(expr){
    let s = expr.replace(/\s+/g,'');
    s = s.replace(/[×xX]/g,'*').replace(/÷/g,'/');
    return s;
  }

  function validateAndEval(expr){
    // allow only digits, dot, operators +-*/() and spaces already removed
    if(!/^[0-9.+\-*/()]*$/.test(expr)){
      return {ok:false, value:NaN};
    }
    // numbers use check: extract numbers as tokens
    const nums = (expr.match(/\d+(\.\d+)?/g)||[]).map(parseFloat);
    // must use exactly the 4 cards as integers (no decimals allowed for card tokens)
    // Accept numbers equal to cards exactly, count occurrences
    const multisetExpr = {};
    for(const n of nums){
      if(!Number.isFinite(n)) return {ok:false, value:NaN};
      if(!Number.isInteger(n)) {
        // decimals are allowed only as result of operations, not as direct number tokens
        return {ok:false, value:NaN};
      }
      multisetExpr[n] = (multisetExpr[n]||0)+1;
    }
    const multisetCards = {};
    for(const n of state.cards){
      multisetCards[n] = (multisetCards[n]||0)+1;
    }
    // must match exactly counts and must be exactly 4 numbers
    const totalNums = nums.length;
    if(totalNums!==4) return {ok:false, value:NaN};
    // compare multisets
    for(const k in multisetExpr){
      if(multisetExpr[k] !== (multisetCards[k]||0)) return {ok:false, value:NaN};
    }
    for(const k in multisetCards){
      if(multisetCards[k] !== (multisetExpr[k]||0)) return {ok:false, value:NaN};
    }

    // evaluate via shunting-yard
    try{
      const val = evalExpr(expr);
      const r = round6(val);
      const ok = (r===24);
      return {ok, value: r};
    }catch(_){
      return {ok:false, value:NaN};
    }
  }

  // Shunting-yard to RPN
  function evalExpr(s){
    const tokens = tokenize(s);
    const output = [];
    const ops = [];
    const prec = {'+':1,'-':1,'*':2,'/':2};
    const rightAssoc = {}; // none
    for(const t of tokens){
      if(t.type==='num'){
        output.push(t);
      }else if(t.type==='op'){
        while(ops.length){
          const o2 = ops[ops.length-1];
          if(o2.type==='op' && ((prec[o2.val]>prec[t.val]) || (prec[o2.val]===prec[t.val] && !rightAssoc[t.val]))){
            output.push(ops.pop());
          }else break;
        }
        ops.push(t);
      }else if(t.type==='lparen'){
        ops.push(t);
      }else if(t.type==='rparen'){
        let found=false;
        while(ops.length){
          const o=ops.pop();
          if(o.type==='lparen'){ found=true; break; }
          output.push(o);
        }
        if(!found) throw new Error('mismatched paren');
      }
    }
    while(ops.length){
      const o=ops.pop();
      if(o.type==='lparen'||o.type==='rparen') throw new Error('mismatched paren');
      output.push(o);
    }
    // eval RPN
    const st=[];
    for(const t of output){
      if(t.type==='num'){ st.push(t.val); }
      else if(t.type==='op'){
        if(st.length<2) throw new Error('bad expr');
        const b=st.pop(), a=st.pop();
        let v;
        switch(t.val){
          case '+': v=a+b; break;
          case '-': v=a-b; break;
          case '*': v=a*b; break;
          case '/': if(Math.abs(b)<1e-12) throw new Error('div0'); v=a/b; break;
          default: throw new Error('op');
        }
        st.push(v);
      }
    }
    if(st.length!==1) throw new Error('bad expr');
    return st[0];
  }

  function tokenize(s){
    const out=[];
    for(let i=0;i<s.length;){
      const c=s[i];
      if(c>='0' && c<='9'){
        let j=i+1;
        while(j<s.length && ((s[j]>='0'&&s[j]<='9')||s[j]==='.') ) j++;
        out.push({type:'num', val: parseFloat(s.slice(i,j))});
        i=j; continue;
      }
      if(c==='+'||c==='-'||c==='*'||c==='/'){
        out.push({type:'op', val:c});
        i++; continue;
      }
      if(c==='('){ out.push({type:'lparen'}); i++; continue; }
      if(c===')'){ out.push({type:'rparen'}); i++; continue; }
      throw new Error('bad char');
    }
    return out;
  }

  function mount(){
    load();
    buildUI(); // ensure buttons exist
    render();
    attachHandlers();
  }

  function buildUI(){
    // keypad area only if not already present
    const area = document.getElementById('twentyfour-keypad');
    if(!area) return;
    // cards buttons
    area.innerHTML = `
      <div class="row cards">
        ${state.cards.map((_,i)=>`<button class="btn ghost" data-insert-card="${i}">${labelWithNum(state.cards[i])}</button>`).join('')}
      </div>
      <div class="row ops">
        <button class="btn ghost" data-insert="+">+</button>
        <button class="btn ghost" data-insert="-">-</button>
        <button class="btn ghost" data-insert="*">×</button>
        <button class="btn ghost" data-insert="/">÷</button>
        <button class="btn ghost" data-insert="(">(</button>
        <button class="btn ghost" data-insert=")">)</button>
      </div>
    `;
  }

  // Expose adapter
  window.TwentyFourAdapter = {
    init(){ mount(); }
  };
})();