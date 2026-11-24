/* Pokemath — regras puras da camada de dados (sem tela e sem rede): mesclar progressos e aplicar a configuração externa.
   Roda no navegador (window.PMR) e no Node (testes). */
(function(raiz){
  const clone=o=>JSON.parse(JSON.stringify(o));
  const num=(v,d=0)=>typeof v==="number"&&isFinite(v)?v:d;
  const ehObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
  const maxPor=(a,b)=>{const r={};for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))r[k]=Math.max(num(a&&a[k]),num(b&&b[k]));return r};

  /* Resultado de um nível (bronze/prata/ouro): nunca perde uma conquista. "novo" é o lado mais recente. */
  function mesclaNivel(velho,novo){
    if(!velho)return novo?clone(novo):undefined;if(!novo)return clone(velho);
    const r={...clone(velho),...clone(novo)};
    r.ok=!!(velho.ok||novo.ok);
    if("perfeito" in velho||"perfeito" in novo)r.perfeito=!!(velho.perfeito||novo.perfeito);
    if("falhou" in velho||"falhou" in novo)r.falhou=r.ok?false:!!(velho.falhou||novo.falhou);
    if("vezes" in velho||"vezes" in novo)r.vezes=Math.max(num(velho.vezes),num(novo.vezes));
    if(velho.melhor!=null||novo.melhor!=null)r.melhor=Math.max(num(velho.melhor),num(novo.melhor));
    return r;
  }
  function mesclaFases(velho,novo){
    const r={};
    for(const id of new Set([...Object.keys(velho||{}),...Object.keys(novo||{})])){
      const a=velho&&velho[id],b=novo&&novo[id];
      if(!a||!b){r[id]=clone(a||b);continue}
      const x={...clone(a),...clone(b)};
      if(a.niveis||b.niveis){x.niveis={};for(const n of new Set([...Object.keys(a.niveis||{}),...Object.keys(b.niveis||{})]))x.niveis[n]=mesclaNivel(a.niveis&&a.niveis[n],b.niveis&&b.niveis[n])}
      if(a.ok||b.ok)x.ok=true;if(a.viu||b.viu)x.viu=true;if(a.perfeita||b.perfeita)x.perfeita=true;
      if("vezes" in a||"vezes" in b)x.vezes=Math.max(num(a.vezes),num(b.vezes));
      r[id]=x;
    }
    return r;
  }
  function mesclaCaught(ca,cb){
    const r={};
    for(const id of new Set([...Object.keys(ca||{}),...Object.keys(cb||{})])){
      const a=ca&&ca[id],b=cb&&cb[id];
      if(!a||!b){r[id]=clone(a||b);continue}
      const melhor=(num(a.nivel,1)>num(b.nivel,1)||(num(a.nivel,1)===num(b.nivel,1)&&num(a.xp)>=num(b.xp)))?a:b;
      r[id]={...clone(a===melhor?b:a),...clone(melhor)};
      r[id].n=Math.max(num(a.n,1),num(b.n,1));r[id].amizade=Math.max(num(a.amizade),num(b.amizade));
    }
    return r;
  }
  /* contadores "do dia": no mesmo dia vale o maior; em dias diferentes vale o dia mais novo */
  function porDia(a,b,campos){
    if(!a)return b?clone(b):a;if(!b)return clone(a);
    if(a.dia===b.dia){const r=clone(a);for(const c of campos)r[c]=Math.max(num(a[c]),num(b[c]));return r}
    return clone(String(a.dia||"")>String(b.dia||"")?a:b);
  }
  function mesclaTentNivel(a,b){
    if(!a)return b?clone(b):a;if(!b)return clone(a);
    if(a.dia===b.dia)return{...clone(a),c:maxPor(a.c,b.c)};
    return clone(String(a.dia||"")>String(b.dia||"")?a:b);
  }
  function mesclaCap(a,b){
    const r=porDia(a,b,["n"]);if(!r||!a||!b)return r;
    r.tab={...(a.tab||{}),...(b.tab||{})};for(const k of Object.keys(r.tab))r.tab[k]=String(a.tab&&a.tab[k]||"")>String(b.tab&&b.tab[k]||"")?a.tab[k]:(b.tab&&b.tab[k]||a.tab[k]);
    return r;
  }
  function mesclaUso(a,b){
    const r={};for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))r[k]=porDia(a&&a[k],b&&b[k],["n"]);return r;
  }

  /* Junta o progresso deste aparelho com o da nuvem SEM perder conquistas.
     - O lado mais recente (_ts) manda nos valores "soltos" (moedas, inventário, companheiro, ajustes).
     - Nunca se perde: Pokémon, níveis/XP/amizade, fases e níveis concluídos, estatísticas, histórico, tutorial visto.
     - Contadores do dia (tentativas, metas, capturas) ficam com o MAIOR valor do mesmo dia (evita burlar o limite trocando de aparelho).
     - Ofensiva: vale a do lado com o último dia de estudo mais recente. */
  function mesclar(local,nuvem){
    if(!ehObj(nuvem))return clone(local);if(!ehObj(local))return clone(nuvem);
    const baseNuvem=num(nuvem._ts)>num(local._ts),base=baseNuvem?nuvem:local,outro=baseNuvem?local:nuvem;
    const r=clone(base);
    r.caught=mesclaCaught(local.caught,nuvem.caught);
    r.fases=mesclaFases(outro.fases,base.fases);
    r.stats=(()=>{const x={};for(const k of new Set([...Object.keys(local.stats||{}),...Object.keys(nuvem.stats||{})])){const a=(local.stats||{})[k]||{},b=(nuvem.stats||{})[k]||{};x[k]={...a,...b,ok:Math.max(num(a.ok),num(b.ok)),err:Math.max(num(a.err),num(b.err))}}return x})();
    r.hist=maxPor(local.hist,nuvem.hist);
    r.hist2=(()=>{const x={};for(const d of new Set([...Object.keys(local.hist2||{}),...Object.keys(nuvem.hist2||{})])){const a=(local.hist2||{})[d]||{},b=(nuvem.hist2||{})[d]||{};x[d]={ok:Math.max(num(a.ok),num(b.ok)),err:Math.max(num(a.err),num(b.err))}}return x})();
    r.tentNivel=mesclaTentNivel(local.tentNivel,nuvem.tentNivel);
    for(const c of ["feitas","coinsHoje"])r[c]=porDia(local[c],nuvem[c],["n"]);
    r.cap=mesclaCap(local.cap,nuvem.cap);
    r.uso=mesclaUso(local.uso,nuvem.uso);
    /* ofensiva: o lado com estudo mais recente leva junto os campos ligados a ela */
    const ult=s=>String(s.last||"");
    const lado=ult(local)>ult(nuvem)?local:ult(nuvem)>ult(local)?nuvem:base;
    for(const c of ["streak","last","inicio","legFor","pendLeg","perdeu"])if(c in lado)r[c]=clone(lado[c]);
    r.maxStreak=Math.max(num(local.maxStreak),num(nuvem.maxStreak),num(r.streak));
    if(local.tutorialVisto===true||nuvem.tutorialVisto===true)r.tutorialVisto=true;
    if(!r.comp||!r.caught[r.comp])r.comp=(outro.comp&&r.caught[outro.comp])?outro.comp:(Object.keys(r.caught)[0]?+Object.keys(r.caught)[0]:null);
    r._ts=Math.max(num(local._ts),num(nuvem._ts));
    return r;
  }

  /* ---------- configuração do controle externo (tabela "configuracoes") ---------- */
  const EXTRAS={meta:[1,100],max:[10,12],teto:[0,1000],tetoXP:[0,1000],moedaAcerto:[0,100],bonusMeta:[0,1000],bonusDiario:[0,1000],bonusRepet:[0,1000],capDia:[1,20],capSemana:[1,60],bonusFase:[0,1000]};
  function configDaLinha(l){
    if(!ehObj(l))return {};
    const c={};
    if(l.tempo_desafio!=null)c.tempo=num(l.tempo_desafio,60);
    if(l.questoes_por_fase!=null)c.questoesPorFase=num(l.questoes_por_fase,8);
    if(l.ano_escolar_liberado!=null)c.anoEscolar=num(l.ano_escolar_liberado,3);
    if(l.tentativas_dia!=null)c.tentativasFaseDia=num(l.tentativas_dia,3);
    if(ehObj(l.extras)){
      for(const [k,[mi,ma]] of Object.entries(EXTRAS)){const v=l.extras[k];if(typeof v==="number"&&isFinite(v))c[k]=Math.min(ma,Math.max(mi,Math.round(v)))}
      if(["facil","medio","dificil"].includes(l.extras.dificuldade))c.dificuldade=l.extras.dificuldade;
      if(c.max!==undefined&&c.max!==10&&c.max!==12)delete c.max;                 // o app só tem tabuadas até 10 ou até 12
    }
    return c;
  }
  /* aplica por cima do estado; devolve true se mudou alguma coisa */
  function aplicarConfig(estado,sobre){
    if(!ehObj(estado)||!ehObj(sobre))return false;
    estado.cfg=ehObj(estado.cfg)?estado.cfg:{};let mudou=false;
    for(const [k,v] of Object.entries(sobre))if(estado.cfg[k]!==v){estado.cfg[k]=v;mudou=true}
    return mudou;
  }
  /* comparação que ignora a ordem das chaves */
  const canon=v=>Array.isArray(v)?"["+v.map(canon).join(",")+"]":(v&&typeof v==="object")?"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canon(v[k])).join(",")+"}":JSON.stringify(v);
  const igual=(a,b)=>canon(a)===canon(b);
  const api={mesclar,configDaLinha,aplicarConfig,igual};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else raiz.PMR=api;
})(typeof window!=="undefined"?window:globalThis);
