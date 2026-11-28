/* Explicações animadas com o Pyri.
   - Cores fixas por casa: unidades azul, dezenas verde, centenas laranja, milhares roxo (em todas as fases).
   - Uma ação por vez; cada passo dura de 3 a 5 s e há 1 s de pausa entre os passos.
   - Os números sempre VIAJAM em curva até o lugar onde são usados (nunca aparecem prontos).
   - Com “reduzir movimento”: mesmo passo a passo, com troca de cor e destaque, sem o voo.
   - Botões: Repetir, Pausar, Anterior e Próximo. */
const FS={vista:"trilha",fase:null,nivel:"bronze",passo:0,ses:null,tok:0,vel:1,pausado:false,anims:[],auto:true,rot:null,repr:"dourado"};
const CW=56,RH=58;
const clsPos=k=>["cu","cd","cc","cm"][k]||"cm",bgPos=k=>["bgu","bgd","bgc","bgm"][k]||"bgm";
const nomePos=k=>["unidades","dezenas","centenas","milhares"][k]||"milhares";
const digitoDe=(n,k)=>{const s=String(n);return k<s.length?+s[s.length-1-k]:null};
const maisTxt=op=>op==="+"?"+":"−";
const LEGENDA=`<div class="pm-legenda"><span><i style="background:#1e6fe0"></i>unidades</span><span><i style="background:#1f9d4a"></i>dezenas</span><span><i style="background:#f28c1b"></i>centenas</span><span><i style="background:#8e44ad"></i>milhares</span></div>`;

/* ---- estilos: garante que as cores e a animação estejam aplicadas ---- */
const PM_CSS=`.pm-cena{position:relative;margin:0 auto}
.pm-cel{position:absolute;display:flex;align-items:center;justify-content:center;width:54px;height:56px;font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:2.1rem;line-height:1;will-change:transform;z-index:2;transition:opacity .5s}
.pm-d.cu{color:#1e6fe0}.pm-d.cd{color:#1f9d4a}.pm-d.cc{color:#f28c1b}.pm-d.cm{color:#8e44ad}.pm-d.cn{color:#16224a}
.pm-op{color:#16224a}
.pm-linha{position:absolute;height:5px;background:#16224a;border-radius:3px;transition:opacity .5s}
.pm-res{background:rgba(255,255,255,.75);border-radius:12px}
.pm-chip{width:38px;height:38px;border-radius:50%;font-size:1.2rem}
.pm-pac{width:46px;height:46px;border-radius:12px;font-size:1.3rem;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.bgu{background:#1e6fe0;color:#fff}.bgd{background:#1f9d4a;color:#fff}.bgc{background:#f28c1b;color:#fff}.bgm{background:#8e44ad;color:#fff}
.pm-dest{outline:4px solid #ffcb05;border-radius:12px;background:rgba(255,203,5,.35)}
.pm-erro{outline:4px solid #d62839;border-radius:12px;animation:pm-tremer .5s 2}
.pm-risc{opacity:.45;text-decoration:line-through}
.pm-mini{font-size:1.4rem;height:34px}
.pm-voo{z-index:6;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))}
.pm-pulso{outline:4px solid #ffcb05;border-radius:12px;background:rgba(255,203,5,.45)}
.pm-pop{animation:pm-pop .45s ease-out}
.pm-glow{animation:pm-glow 1s ease-in-out 2;background:rgba(255,203,5,.5);border-radius:12px}
.pm-pyri-anda{width:34px;height:34px;background:url(img/pokemon/pyri.webp) center/contain no-repeat;z-index:4}
.pm-ponto{width:26px;height:26px;border-radius:50%;background:#e64a8d;border:3px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.2)}
.pm-fruta{font-size:1.5rem;width:30px;height:30px}
.pm-caixa{position:absolute;border:3px dashed #5b6ab3;border-radius:12px}
.pm-prato{position:absolute;border-radius:50%;background:#fff;border:4px solid #5b6ab3}
.pm-casa{position:absolute;border:4px solid #5b6ab3;border-radius:14px;background:#fff;text-align:center;font-weight:800;font-size:.72rem;color:#16224a}
.pm-casa small{position:absolute;left:0;right:0;bottom:4px}
.pm-casa.cu{border-color:#1e6fe0}.pm-casa.cd{border-color:#1f9d4a}.pm-casa.cc{border-color:#f28c1b}.pm-casa.cm{border-color:#8e44ad}
.pm-legenda{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:.8rem;font-weight:800;margin-top:8px;color:#16224a}
.pm-legenda i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:4px;vertical-align:-1px}
@keyframes pm-pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}
@keyframes pm-glow{50%{transform:scale(1.2)}}
@keyframes pm-tremer{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.pm-ap{font-size:1rem;line-height:22px;font-weight:400}
.pm-pacote{border-radius:10px;font-size:.82rem;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.pm-pacote.bgn{background:#5b6ab3;color:#fff}
.pm-bandeja{position:absolute;border:3px solid #5b6ab3;border-radius:12px;background:rgba(255,255,255,.55)}
.pm-bandeja.cu{border-color:#1e6fe0}.pm-bandeja.cd{border-color:#1f9d4a}.pm-bandeja.cc{border-color:#f28c1b}.pm-bandeja.cm{border-color:#8e44ad}
.pm-bandeja small{position:absolute;right:6px;bottom:1px;font-size:.6rem;font-weight:800;color:#16224a;opacity:.75}
.pm-cel.pm-sumir{opacity:0;transform:scale(.4);transition:opacity .5s,transform .5s}
.pm-gira{animation:pm-gira .6s ease-in-out}
@keyframes pm-gira{to{transform:rotate(360deg) scale(1.25)}}
.pm-cubo{background:#1e6fe0;border:1px solid #8ec0ff;border-radius:2px;box-shadow:inset -2px -2px 0 rgba(0,0,0,.25)}
.pm-barra{border:1px solid #14702f;border-radius:3px;background:linear-gradient(90deg,#1f9d4a calc(100% - 1px),#a5e6b9 calc(100% - 1px)) 0 0/10% 100% repeat-x}
.pm-placa{border:2px solid #c46a00;border-radius:4px;background:linear-gradient(90deg,rgba(255,255,255,.55) 1px,transparent 1px) 0 0/10% 100%,linear-gradient(0deg,rgba(255,255,255,.55) 1px,transparent 1px) 0 0/100% 10%,#f28c1b}
.pm-milhar{border:2px solid #5e2a7e;border-radius:6px;background:#8e44ad;box-shadow:inset -4px -4px 0 rgba(0,0,0,.3)}
.pm-txt{font-size:.95rem;font-weight:800;color:#16224a;text-align:center}
.pm-dinSvg,.pm-svgbox,.pm-ic{background:none;border:0;box-shadow:none;padding:0;line-height:0}.pm-dinSvg svg,.pm-svgbox svg,.pm-ic svg{width:100%;height:100%;display:block}.pm-bola{border-radius:50%;border:2px solid #16224a;box-shadow:inset -3px -3px 0 rgba(0,0,0,.12)}.pm-linhaG{position:absolute;border-top:3px dashed #d62839;height:0;z-index:3}
.pm-moeda{border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe27a,#d9a21b);border:4px solid #a8730a;color:#5a3b00;font-size:1rem;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.pm-nota{border-radius:8px;border:3px solid #14702f;background:#9bd7a8;color:#0b3d1c;font-size:1.05rem;box-shadow:0 3px 0 rgba(0,0,0,.25)}`;
let estilosOk=false;
function garantirEstilos(){
  if(estilosOk)return true;
  const p=document.createElement("span");p.className="pm-cel";p.style.visibility="hidden";document.body.append(p);
  const ok=getComputedStyle(p).position==="absolute";p.remove();
  if(!ok&&!document.getElementById("pm-anim-css")){
    const s=document.createElement("style");s.id="pm-anim-css";s.textContent=PM_CSS;document.head.append(s);
    console.warn("Pokemath: o arquivo css/novo.css não foi aplicado; usando o estilo reserva das animações.");
  }
  estilosOk=true;return ok;
}

/* ---- tempo (respeita Pausar e cancela ao trocar de passo) ---- */
function esperar(ctx,ms){
  if(ctx.instant)return Promise.resolve();
  ctx.gasto+=ms;const tok=FS.tok;
  return new Promise((ok,er)=>{let resto=ms*FS.vel;
    const tick=()=>{if(FS.tok!==tok)return er("cancel");if(FS.pausado){setTimeout(tick,80);return}
      const dt=Math.min(resto,50);resto-=dt;if(resto<=0.0001)ok();else setTimeout(tick,dt)};
    setTimeout(tick,0)});
}

/* ---- elementos e voo em curva ---- */
function posEl(e,x,y){e._x=x;e._y=y;e.style.left=x+"px";e.style.top=y+"px"}
function criar(box,txt,cls,x,y,w,h){
  const e=document.createElement("span");e.className="pm-cel "+cls;e.textContent=txt;
  if(w)e.style.width=w+"px";if(h)e.style.height=h+"px";box.append(e);posEl(e,x,y);e._fx=x;e._fy=y;return e;
}
function iniciarVoo(el,dx,dy,dur,atraso){
  el.classList.add("pm-voo");
  const dist=Math.hypot(dx,dy)||1,nx=-dy/dist,ny=dx/dist;let arco=Math.min(90,dist*.45);if(ny>0)arco=-arco;   // a curva sobe
  const cx=dx/2+nx*arco,cy=dy/2+ny*arco,fr=[];
  for(let i=0;i<=16;i++){const t=i/16,x=2*(1-t)*t*cx+t*t*dx,y=2*(1-t)*t*cy+t*t*dy;
    fr.push({transform:`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(1+.3*Math.sin(Math.PI*t)).toFixed(3)})`})}
  if(typeof el.animate==="function"){
    const a=el.animate(fr,{duration:Math.max(1,dur*FS.vel),delay:(atraso||0)*FS.vel,easing:"ease-in-out",fill:"both"});
    FS.anims.push(a);if(FS.pausado)a.pause();return a;
  }
  el.style.transition=`transform ${dur*FS.vel}ms ease-in-out ${(atraso||0)*FS.vel}ms`;void el.offsetWidth;
  el.style.transform=`translate(${dx}px,${dy}px)`;return null;   // reserva (sem Web Animations): reta
}
/* lista = [[elemento,x,y],...]; todos voam ao mesmo tempo (ou escalonados) */
async function voarVarios(ctx,lista,dur,escalonar){
  dur=dur||1500;escalonar=escalonar||0;const total=dur+escalonar*(lista.length-1);
  if(ctx.instant){lista.forEach(([e,x,y])=>posEl(e,x,y));return}
  if(semMov()){                                   // sem voo: só troca de cor/destaque
    lista.forEach(([e])=>e.classList.add("pm-pulso"));await esperar(ctx,Math.min(total,900));
    lista.forEach(([e,x,y])=>posEl(e,x,y));await esperar(ctx,500);lista.forEach(([e])=>e.classList.remove("pm-pulso"));return;
  }
  const an=lista.map(([e,x,y],i)=>iniciarVoo(e,x-e._x,y-e._y,dur,i*escalonar));
  await esperar(ctx,total);
  an.forEach(a=>{if(a)try{a.cancel()}catch(_){}});
  lista.forEach(([e,x,y])=>{e.style.transition="";e.style.transform="";e.classList.remove("pm-voo");posEl(e,x,y)});
}
function pararAnimacoes(){FS.tok++;FS.pausado=false;FS.anims.forEach(a=>{try{a.cancel()}catch(_){}});FS.anims=[]}

/* ---- cena ---- */
function novaCena(ctx,W,H){
  ctx.stage.innerHTML=`<div class="pm-cena" style="width:${W}px;height:${H}px"></div><p class="cap" id="cap">&nbsp;</p>${LEGENDA}`;
  ctx.box=ctx.stage.querySelector(".pm-cena");ctx.cap=ctx.stage.querySelector("#cap");
  const disp=ctx.stage.clientWidth-16,maxH=Math.max(260,(window.innerHeight||800)-360);let k=1;
  if(disp>0&&disp<W)k=Math.min(k,disp/W);if(H>maxH)k=Math.min(k,maxH/H);      // cabe na largura e na altura da tela
  if(k<1){ctx.box.style.transform=`scale(${k})`;ctx.box.style.transformOrigin="top center";ctx.box.style.marginBottom=`${(k-1)*H}px`}
  return ctx.box;
}
const dizer=(ctx,t)=>{ctx.cap.textContent=t};
const glowRes=R=>R.box.querySelectorAll(".pm-res").forEach(e=>e.classList.add("pm-glow"));
const P=(fala,dur,acao,termos)=>({fala,dur,acao,termos});
const resSub=(R,txt,x,y,w)=>{R.box.querySelectorAll(".pm-res").forEach(e=>e.remove());return criar(R.box,txt,"pm-txt pm-res pm-pop",x,y,w,40)};
/* gira um ponteiro (graus) com a duração do passo; com "reduzir movimento" ou no replay instantâneo, só troca a posição */
async function girarMao(ctx,el,deg,ms){
  el.dataset.deg=deg;
  if(ctx.instant||semMov()){el.style.transition="none";el.style.transform=`rotate(${deg}deg)`;await esperar(ctx,Math.min(ms,900));return}
  el.style.transition=`transform ${ms*FS.vel}ms linear`;void el.offsetWidth;el.style.transform=`rotate(${deg}deg)`;await esperar(ctx,ms);
}


/* ---- apoio visual: maçãs, pacotes e bandejas (as imagens NUNCA substituem os números) ----
   Nada aparece do nada: as imagens nascem dos algarismos, se juntam, se partem, se repartem e se transformam.
   Quantidade acima de 30 objetos é mostrada em pacotes (agrupamento). */
const AP=22,APC=6,APH=142;                      // tamanho da maçã, colunas por bandeja e altura do painel
function apBox(R,x,y,w,h,cls,rot){
  const b=document.createElement("i");b.className="pm-bandeja "+cls+" pm-pop";b.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  if(rot){const l=document.createElement("small");l.textContent=rot;b.append(l)}R.box.append(b);return b;
}
const apGrade=(x,y,i)=>({x:x+6+(i%APC)*(AP+2),y:y+6+Math.floor(i/APC)*(AP+2)});
const centro=e=>({x:e._x+14,y:e._y+12});
function apMaca(R,de,tx,ty){const e=criar(R.box,"🍎","pm-ap",de.x,de.y,AP,AP);e._tx=tx;e._ty=ty;e.dataset.de=Math.round(de.x)+","+Math.round(de.y);return e}
function apPacote(R,k,de,tx,ty,rot){
  const v=Math.pow(10,k),e=criar(R.box,"🍎"+(rot||v),"pm-pacote "+(k<0?"bgn":bgPos(k)),de.x,de.y,v>=100?58:48,34);e._tx=tx;e._ty=ty;e.dataset.de=Math.round(de.x)+","+Math.round(de.y);return e;
}
const apTo=e=>[e,e._tx,e._ty];
const apBrilho=(R)=>(R.ap.res||[]).forEach(e=>e.classList.add("pm-glow"));
async function sumir(ctx,els,ms){            // as figuras se apagam (somem na conta, não do nada)
  if(ctx.instant){els.forEach(e=>e.remove());return}
  if(semMov()){els.forEach(e=>e.classList.add("pm-pulso"));await esperar(ctx,400);els.forEach(e=>e.remove());return}
  els.forEach(e=>e.classList.add("pm-sumir"));await esperar(ctx,ms||500);els.forEach(e=>e.remove());
}
async function girar(ctx,el,ms){if(ctx.instant||semMov())return;el.classList.add("pm-gira");await esperar(ctx,ms||600);el.classList.remove("pm-gira")}   // sem giros em “reduzir movimento”
/* duas ações ao mesmo tempo (o tempo do passo conta só a mais longa) */
async function junto(ctx,...fns){
  const g0=ctx.gasto;let mx=0;
  await Promise.all(fns.map(async f=>{const c=Object.create(ctx);c.gasto=0;await f(c);mx=Math.max(mx,c.gasto)}));
  ctx.gasto=g0+mx;
}
/* ---- Lote C: caixinhas com desenhos SVG (tabelas, gráficos, urna…) ---- */
function svgBox(R,html,x,y,w,cls){
  const m=html.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),h=m?Math.round(w*(+m[2])/(+m[1])):w;
  const e=criar(R.box,"","pm-svgbox "+(cls||""),x,y,w,h);e.innerHTML=html;return e;
}
const semLegenda=ctx=>{const l=ctx.stage.querySelector(".pm-legenda");if(l)l.remove()};
const caixaG=(R,x,y,w,h)=>{const c=document.createElement("i");c.className="pm-caixa pm-pop";c.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:5`;R.box.append(c);return c};
const bolaG=(R,cor,x,y)=>{const e=criar(R.box,"","pm-bola",x,y,21,21);e.style.background=CORB[cor];return e};
/* colunas/barras crescendo do zero (sem Web Animations ou com “reduzir movimento”, só esperam) */
async function crescer(ctx,els,eixo,ms){
  if(ctx.instant)return;
  if(semMov()||!els.length||typeof els[0].animate!=="function"){await esperar(ctx,Math.min(ms,700));return}
  els.forEach((e,i)=>{const a=e.animate([{transform:eixo==="x"?"scaleX(0)":"scaleY(0)"},{transform:"scale(1)"}],{duration:Math.max(1,ms*FS.vel),delay:i*150*FS.vel,easing:"ease-out",fill:"backwards"});FS.anims.push(a);if(FS.pausado)a.pause()});
  await esperar(ctx,ms+150*(els.length-1));
}
/* Representações das casas. Material dourado: unidade = cubinho (azul), dezena = barra de 10 cubinhos (verde),
   centena = placa de 100 (laranja), milhar = cubo (roxo). “maçãs” é a forma anterior (maçãs e pacotes), mantida como alternativa. */
const bloco=(R,cls,de,tx,ty,w,h)=>{const e=criar(R.box,"",cls,de.x,de.y,w,h);e._tx=tx;e._ty=ty;e.dataset.de=Math.round(de.x)+","+Math.round(de.y);return e};
const REP={
  macas:{
    u:(R,de,tx,ty)=>apMaca(R,de,tx,ty),
    d:(R,k,de,tx,ty)=>apPacote(R,k,de,tx,ty),
    gu:(x,y,i)=>apGrade(x,y,i),gd:(x,y,i)=>({x:x+6+i*50,y:y+12}),gr:(i,ry)=>({x:14+i*50,y:ry+14}),
    async pegar(ctx,R,pk){await voarVarios(ctx,[[pk,96,R.ap.y0+12]],1000)},
    async fazDezena(ctx,R,todas,y){                              // 10 maçãs se juntam num pacote de dezena
      const cx=46,cy=y+14,pacote=apPacote(R,1,{x:cx,y:cy},cx,cy);pacote.style.opacity=0;
      await voarVarios(ctx,todas.map(e=>[e,cx+12,cy+6]),600);todas.forEach(e=>e.remove());
      pacote.style.opacity=1;pacote.classList.add("pm-pop");await girar(ctx,pacote,500);return pacote;
    },
    async partir(ctx,R,pk,um,y){                                 // o pacote gira e se parte em 10 maçãs
      const c={x:pk._x+12,y:pk._y+10};await girar(ctx,pk,600);
      const novas=Array.from({length:10},()=>apMaca(R,c,0,0));pk.remove();
      const todos=[...um,...novas];todos.forEach((e,i)=>{const g=apGrade(150,y,i);e._tx=g.x;e._ty=g.y});
      await voarVarios(ctx,todos.map(apTo),1000,50);return todos;
    }
  },
  dourado:{
    u:(R,de,tx,ty)=>bloco(R,"pm-cubo",de,tx,ty,13,13),
    d:(R,k,de,tx,ty)=>k===1?bloco(R,"pm-barra",de,tx,ty,122,14):k===2?bloco(R,"pm-placa",de,tx,ty,60,60):bloco(R,"pm-milhar",de,tx,ty,56,56),
    gu:(x,y,i)=>({x:x+6+(i%8)*15,y:y+6+Math.floor(i/8)*15}),gd:(x,y,i)=>({x:x+2,y:y+8+i*18}),gr:(i,ry)=>({x:14,y:ry+6+i*18}),
    async pegar(ctx,R,pk){pk.classList.add("pm-dest");await esperar(ctx,900);pk.classList.remove("pm-dest")},
    async fazDezena(ctx,R,todas,y){                              // 10 cubinhos se alinham e viram UMA barra de dezena
      const bx=14,by=y+22;await voarVarios(ctx,todas.map((e,j)=>[e,bx+2+j*12,by+1]),600);
      const barra=bloco(R,"pm-barra pm-pop",{x:bx,y:by},bx,by,122,14);todas.forEach(e=>e.remove());await girar(ctx,barra,500);return barra;
    },
    async partir(ctx,R,pk,um,y){                                 // a barra gira e se parte em 10 cubinhos
      await girar(ctx,pk,600);
      const novas=Array.from({length:10},(_,j)=>bloco(R,"pm-cubo",{x:pk._x+2+j*12,y:pk._y+1},0,0,13,13));pk.remove();
      const todos=[...um,...novas];todos.forEach((e,i)=>{const g=REP.dourado.gu(150,y,i);e._tx=g.x;e._ty=g.y});
      await voarVarios(ctx,todos.map(apTo),1000,50);return todos;
    }
  }
};
const seq=(ap,orig)=>async(ctx,R)=>{await ap(ctx,R);await orig(ctx,R)};        // primeiro a imagem se constrói, depois os números viajam
const par=(ap,orig)=>(ctx,R)=>junto(ctx,c=>ap(c,R),c=>orig(c,R));

/* conta armada: linhas = vai-um(0), a(1), b(2), traço(3), resultado(4); embaixo, o painel de apoio visual */
function armada(ctx,op,a,b){
  const res=op==="+"?a+b:a-b,sa=String(a),sb=String(b),sr=String(res),cols=Math.max(sa.length,sb.length,sr.length);
  const CWd=(cols+1)*CW,W=Math.max(CWd,300),OX=(W-CWd)/2,X=c=>OX+(c+1)*CW,Y=r=>r*RH,H=5*RH+APH,box=novaCena(ctx,W,H);
  const R={box,cols,X,Y,res,W,a:{},b:{},clones:{},rep:REP[FS.repr]||REP.dourado,ap:{y0:5*RH+8,r2:5*RH+8+66,np:0,res:[],q:{}}};
  const fila=(s,row,obj,dx)=>[...s].forEach((d,i)=>{const c=cols-s.length+i,k=cols-1-c,e=criar(box,d,"pm-d "+clsPos(k),X(c)+dx,-70);e._fx=X(c);e._fy=Y(row);e.dataset.k=k;obj[k]=e});
  fila(sa,1,R.a,-50);fila(sb,2,R.b,50);
  R.sinal=criar(box,maisTxt(op),"pm-op",X(-1),Y(2));R.sinal.style.opacity=0;
  R.linhaEl=document.createElement("i");R.linhaEl.className="pm-linha";R.linhaEl.style.cssText=`left:${OX}px;top:${3*RH+3}px;width:${CWd}px;opacity:0`;box.append(R.linhaEl);
  R.dest=k=>({x:X(cols-1-k),y:Y(4)});return R;
}
async function entradaOperandos(ctx,R,dur){
  R.sinal.style.opacity=1;R.linhaEl.style.opacity=1;
  await voarVarios(ctx,[...Object.values(R.a),...Object.values(R.b)].map(e=>[e,e._fx,e._fy]),dur||1800,150);
}

/* expressão “g × c = ?” usada por multiplicação e divisão */
function expressaoCena(ctx,box,n1,op,n2){
  const R={box};R.e1=criar(box,String(n1),"pm-d cn",40,-70);R.e1._fx=40;R.e1._fy=0;R.e2=criar(box,String(n2),"pm-d cn",140,-70);R.e2._fx=140;R.e2._fy=0;
  R.op=criar(box,op,"pm-op",92,0);R.ig=criar(box,"=","pm-op",196,0);R.op.style.opacity=0;R.ig.style.opacity=0;R.slot={x:246,y:0};return R;
}

const ROT={
  /* ---------- 345: casas e valores ---------- */
  posicional(n){
    const s=String(n),L=s.length,W=300,H=336,vals=[...s].map((d,i)=>d+"0".repeat(L-1-i)),kk=i=>L-1-i,cx=i=>(W-L*88)/2+i*88,PY=250;
    /* material dourado: placa (centena), barra (dezena) e cubinho (unidade) nascem do algarismo e vão para a casa dele */
    const apBlocos=i=>async(ctx,R)=>{
      const k=kk(i),d=+s[i],x=cx(i)-4,de=centro(R.dig[i]);R.blocosBox.push(apBox(R,x,PY,84,70,clsPos(k),nomePos(k)));
      const itens=Array.from({length:d},(_,j)=>k===2?bloco(R,"pm-placa",de,x+4+j*27,PY+10,25,25):k===1?bloco(R,"pm-barra",de,x+6,PY+8+j*12,72,9):k===0?bloco(R,"pm-cubo",de,x+4+j*15,PY+12,12,12):bloco(R,"pm-milhar",de,x+4+j*27,PY+10,25,25));
      await voarVarios(ctx,itens.map(apTo),900,120);R.blocos.push(...itens);
    };
    return{montar:ctx=>{const box=novaCena(ctx,W,H),R={box,dig:[],casas:[],termos:[],blocos:[],blocosBox:[]};
      [...s].forEach((d,i)=>{const e=criar(box,d,"pm-d "+clsPos(kk(i)),cx(i)+13,-70);e._fx=cx(i)+13;e._fy=50;R.dig.push(e)});return R},
     passos:[
      P("Cada algarismo mora em uma casa. As casas têm nomes e cada uma tem a sua cor!",4500,async(ctx,R)=>{
        R.casas=[...s].map((_,i)=>{const c=document.createElement("div");c.className="pm-casa pm-pop "+clsPos(kk(i));c.style.cssText=`left:${cx(i)}px;top:30px;width:80px;height:100px`;
          c.innerHTML=`<small>${nomePos(kk(i))}</small>`;R.box.append(c);return c});
        await esperar(ctx,700);await voarVarios(ctx,R.dig.map(e=>[e,e._fx,e._fy]),1600,250)},
        {unidades:"os números soltos, de 0 a 9",dezenas:"grupos de 10",centenas:"grupos de 100"}),
      ...[...s].map((d,i)=>P(`O ${d} está na casa das ${nomePos(kk(i))}: ${d} ${[ "cubinho","barra","placa","cubo"][kk(i)]}${+d>1?"s":""}. Ele vale ${vals[i]}.`,5000,seq(apBlocos(i),async(ctx,R)=>{
        const e=R.dig[i],tx=20+i*92;
        if(i>0){const m=criar(R.box,"+","pm-op pm-pop",tx-30,180);R.termos.push(m)}
        const cl=criar(R.box,d,"pm-d "+clsPos(kk(i)),e._x,e._y);e.classList.add("pm-dest");await esperar(ctx,700);
        await voarVarios(ctx,[[cl,tx,180]],1800);cl.textContent=vals[i];cl.style.width="84px";cl.classList.add("pm-res","pm-pop");R.termos.push(cl);
        e.classList.remove("pm-dest");dizer(ctx,`${d} ${nomePos(kk(i))} = ${vals[i]}`);await esperar(ctx,900)}))),
      P(`Então ${n} = ${vals.join(" + ")}! Quanto mais à esquerda, maior o valor.`,3500,async(ctx,R)=>{glowRes(R);R.blocos.forEach(e=>e.classList.add("pm-glow"));dizer(ctx,`${n} = ${vals.join(" + ")}`);await esperar(ctx,2000)})
    ]};
  },
  /* ---------- 23 + 12: sem vai-um, coluna por coluna (números + maçãs/pacotes) ---------- */
  soma(a,b){
    const res=a+b,cols=Math.max(String(a).length,String(b).length,String(res).length),passos=[];
    passos.push(P(`Vamos somar ${a} + ${b}. Cada algarismo tem a cor da sua casa.`,4000,async(ctx,R)=>{await entradaOperandos(ctx,R)},
      {unidades:"a casa da direita, dos números soltos",dezenas:"grupos de 10"}));
    for(let k=0;k<cols;k++){
      const da=digitoDe(a,k),db=digitoDe(b,k);if(da==null&&db==null)continue;const s=(da||0)+(db||0),nome=nomePos(k);
      /* imagens: as quantidades nascem dos algarismos e ficam em bandejas (maçãs nas unidades, pacotes de 10 nas dezenas) */
      const apVoa=async(ctx,R)=>{
        const A=R.a[k],B=R.b[k],y=R.ap.y0,q=R.ap.q[k]={};
        if(!R.ap.zona)R.ap.zona=apBox(R,6,R.ap.r2-4,288,70,"cn","resultado");
        q.tl=apBox(R,14,y,126,62,clsPos(k),nome);q.tr=apBox(R,160,y,126,62,clsPos(k),nome);
        const rp=R.rep,mk=(n,x,dg)=>Array.from({length:n},(_,i)=>{const de=centro(dg);if(k===0){const g=rp.gu(x,y,i);return rp.u(R,de,g.x,g.y)}const g=rp.gd(x,y,i);return rp.d(R,k,de,g.x,g.y)});
        q.eA=mk(da||0,14,A);q.eB=mk(db||0,160,B);
        await voarVarios(ctx,[...q.eA,...q.eB].map(apTo),1200,90);
      };
      /* imagens: as duas quantidades se juntam e viram uma nova quantidade, que segue para o resultado */
      const apJunta=async(ctx,R)=>{
        const q=R.ap.q[k],y=R.ap.y0,ry=R.ap.r2,rp=R.rep;
        await voarVarios(ctx,q.eB.map((e,i)=>{const n=q.eA.length+i,t=k===0?rp.gu(14,y,n):rp.gd(14,y,n);return[e,t.x,t.y]}),1000,110);
        q.tr.remove();const todos=[...q.eA,...q.eB];
        todos.forEach((e,i)=>{if(k===0){const g=rp.gu(160,ry,i);e._tx=g.x;e._ty=g.y+2}else{const g=rp.gr(R.ap.np+i,ry);e._tx=g.x;e._ty=g.y}});
        if(k>0)R.ap.np+=todos.length;q.tl.remove();
        await voarVarios(ctx,todos.map(apTo),1000,60);R.ap.res.push(...todos);
      };
      const voaNum=async(ctx,R)=>{
        const A=R.a[k],B=R.b[k],orig=[A,B].filter(Boolean);orig.forEach(e=>e.classList.add("pm-dest"));await esperar(ctx,800);
        const d=R.dest(k),cl=orig.map(e=>criar(R.box,e.textContent,"pm-d "+clsPos(k),e._x,e._y));
        await voarVarios(ctx,cl.map((c,i)=>[c,d.x+(i?12:-12),d.y]),1800);R.clones[k]=cl;orig.forEach(e=>e.classList.remove("pm-dest"));
      };
      const fundeNum=async(ctx,R)=>{
        R.clones[k].forEach(c=>c.remove());const d=R.dest(k);criar(R.box,String(s),"pm-d pm-res pm-pop "+clsPos(k),d.x,d.y);
        dizer(ctx,`${da==null?0:da} + ${db==null?0:db} = ${s}`);await esperar(ctx,1600);
      };
      passos.push(P(`Agora as ${nome}: o ${da==null?0:da} e o ${db==null?0:db} viram ${k===0?"maçãs":"pacotes de 10"} e viajam até o resultado.`,4500,seq(apVoa,voaNum)));
      passos.push(P(`${da==null?0:da} + ${db==null?0:db} = ${s}. As quantidades se juntam e o ${s} fica na coluna das ${nome}.`,4500,seq(apJunta,fundeNum)));
    }
    passos.push(P(`O resultado é ${res}! Confira: ${a} + ${b} tem que dar mais que ${a}.`,3500,async(ctx,R)=>{glowRes(R);apBrilho(R);dizer(ctx,`${a} + ${b} = ${res}`);await esperar(ctx,2000)}));
    return{montar:ctx=>armada(ctx,"+",a,b),passos,repr:true};
  },
  /* ---------- 15 + 8: elevação (“vai um”) com contas de dois algarismos (também funciona com 8 + 5) ---------- */
  vaiUm(a,b){
    const ua=a%10,ub=b%10,ta=Math.floor(a/10),tb=Math.floor(b/10),falta=10-ua,sobra=ub-falta,res=a+b,tr=ta+tb+1,temDez=ta>0||tb>0,ds=[ta,tb].filter(x=>x>0);
    const ap1=async(ctx,R)=>{                       // as unidades nascem dos algarismos e as do ${ub} se dividem
      const y=R.ap.y0,A=R.a[0],B=R.b[0],rp=R.rep;
      R.ap.zona=apBox(R,6,R.ap.r2-4,288,70,"cn","resultado");R.ap.tl=apBox(R,14,y,126,62,"cu","unidades");R.ap.tr=apBox(R,160,y,126,62,"cu","unidades");
      R.ap.eA=Array.from({length:ua},(_,i)=>{const g=rp.gu(14,y,i);return rp.u(R,centro(A),g.x,g.y)});
      R.ap.eB=Array.from({length:ub},(_,i)=>{const g=rp.gu(160,y,i);return rp.u(R,centro(B),g.x,g.y)});
      await voarVarios(ctx,[...R.ap.eA,...R.ap.eB].map(apTo),1000,40);
      const sep=R.ap.eB.slice(0,falta);sep.forEach(e=>{e._tx=e._x;e._ty=e._y+28});await voarVarios(ctx,sep.map(apTo),600);
    };
    const ap2=async(ctx,R)=>{                       // o ${ua} pega o que falta e as 10 unidades viram UMA dezena
      const y=R.ap.y0,mv=R.ap.eB.slice(0,falta),rp=R.rep;
      await voarVarios(ctx,mv.map((e,i)=>{const g=rp.gu(14,y,ua+i);return[e,g.x,g.y]}),900,100);
      R.ap.pacote=await rp.fazDezena(ctx,R,[...R.ap.eA,...mv],y);R.ap.tl.remove();
    };
    const ap3=async(ctx,R)=>{const t=R.rep.gr(R.ap.np,R.ap.r2);await voarVarios(ctx,[[R.ap.pacote,t.x,t.y]],1400);R.ap.res.push(R.ap.pacote);R.ap.np++};      // a dezena vai para a coluna das dezenas
    const ap4=async(ctx,R)=>{const rest=R.ap.eB.slice(falta);await voarVarios(ctx,rest.map((e,i)=>{const g=R.rep.gu(160,R.ap.r2,i);return[e,g.x,g.y+2]}),1000,120);R.ap.tr.remove();R.ap.res.push(...rest)};
    const ap5=async(ctx,R)=>{                       // dezenas: a dezena de cima chega e junta com a que veio
      if(!temDez){R.ap.pacote.classList.add("pm-pop");await esperar(ctx,500);return}
      const rp=R.rep,novos=[];[[ta,R.a[1]],[tb,R.b[1]]].forEach(([n,dg])=>{for(let i=0;i<n;i++){const g=rp.gr(R.ap.np+novos.length,R.ap.r2);novos.push(rp.d(R,1,centro(dg),g.x,g.y))}});
      await voarVarios(ctx,novos.map(apTo),1100,150);R.ap.np+=novos.length;R.ap.res.push(...novos);
    };
    const orig5=temDez?async(ctx,R)=>{
      const d=R.dest(1),orig=[R.a[1],R.b[1]].filter(Boolean);orig.forEach(e=>e.classList.add("pm-dest"));await esperar(ctx,800);
      const cl=orig.map(e=>criar(R.box,e.textContent,"pm-d cd",e._x,e._y));
      await voarVarios(ctx,[...cl.map((c,i)=>[c,d.x-14+i*10,d.y]),[R.pac,d.x+14,d.y]],1800);
      cl.forEach(c=>c.remove());R.pac.remove();orig.forEach(e=>e.classList.remove("pm-dest"));
      criar(R.box,String(tr),"pm-d pm-res pm-pop cd",d.x,d.y);dizer(ctx,`${[...ds,1].join(" + ")} = ${tr}`);await esperar(ctx,800);
    }:async(ctx,R)=>{const d=R.dest(1);await voarVarios(ctx,[[R.pac,d.x,d.y]],1800);R.pac.remove();criar(R.box,"1","pm-d pm-res pm-pop cd",d.x,d.y);await esperar(ctx,800)};
    return{montar:ctx=>armada(ctx,"+",a,b),repr:true,passos:[
      P(`Vamos somar ${a} + ${b}. Começamos pelas unidades: ${ua} + ${ub}.`,4000,async(ctx,R)=>{await entradaOperandos(ctx,R)},{unidades:"os números soltos"}),
      P(`O ${ub} vira ${ub} unidades e se divide em ${falta} e ${sobra}.`,5000,seq(ap1,async(ctx,R)=>{
        const B=R.b[0];B.style.opacity=.25;R.cF=criar(R.box,String(falta),"pm-chip bgu",B._fx,B._fy+8);R.cS=criar(R.box,String(sobra),"pm-chip bgu",B._fx,B._fy+8);
        await voarVarios(ctx,[[R.cF,B._fx-34,B._fy+8],[R.cS,B._fx+34,B._fy+8]],1500);dizer(ctx,`${ub} = ${falta} + ${sobra}`);await esperar(ctx,800)})),
      P(`O ${ua} pega o ${falta} e as 10 unidades se juntam numa dezena.`,4500,par(ap2,async(ctx,R)=>{
        const A=R.a[0];await voarVarios(ctx,[[R.cF,A._fx+30,A._fy+8]],1600);R.cF.remove();A.style.opacity=.25;
        R.pac=criar(R.box,"10","pm-pac bgd pm-pop",A._fx+4,A._fy+6);dizer(ctx,`${ua} + ${falta} = 10`);await esperar(ctx,1500)})),
      P("10 unidades formam 1 dezena! Esse pacote verde voa para a coluna das dezenas. É o “vai um”: eleve o 1.",4500,seq(ap3,async(ctx,R)=>{
        R.pac.textContent="1";R.pac.classList.add("pm-pop");await esperar(ctx,800);await voarVarios(ctx,[[R.pac,R.X(0)+4,R.Y(0)+6]],1800);dizer(ctx,"eleva 1 dezena")}),
        {"vai um":"o pacote de 10 que viaja para a casa ao lado (elevação)"}),
      P(`Sobraram ${sobra} unidades. O ${sobra} viaja até o resultado, na coluna das unidades.`,4500,seq(ap4,async(ctx,R)=>{
        const d=R.dest(0);await voarVarios(ctx,[[R.cS,d.x,d.y]],1800);R.cS.remove();criar(R.box,String(sobra),"pm-d pm-res pm-pop cu",d.x,d.y);await esperar(ctx,800)})),
      P(temDez?`Agora as dezenas: o ${ds.join(" e o ")} e o 1 que veio. ${[...ds,1].join(" + ")} = ${tr}.`:"A dezena que veio desce para o resultado: 1 dezena.",temDez?5000:4000,seq(ap5,orig5)),
      P(`${a} + ${b} = ${res}!`,3500,async(ctx,R)=>{glowRes(R);apBrilho(R);dizer(ctx,`${a} + ${b} = ${res}`);await esperar(ctx,2000)})
    ]};
  },
  /* ---------- 32 − 15: empréstimo (a dezena se parte em 10 unidades ANTES da conta) ---------- */
  subEmp(a,b){
    const t1=Math.floor(a/10),u1=a%10,t2=Math.floor(b/10),u2=b%10,res=a-b,dozes=10+u1,ru=dozes-u2,rd=t1-1-t2;
    const ap1=async(ctx,R)=>{                       // 32 (acima de 30: em pacotes) e 15 nascem dos algarismos
      const y=R.ap.y0,r2=R.ap.r2;R.ap.cm=apBox(R,6,y,288,62,"cn",String(a));R.ap.cs=apBox(R,6,r2,288,62,"cn","tirar "+b);
      const rp=R.rep;R.ap.pm=Array.from({length:t1},(_,i)=>{const g=rp.gd(8,y,i);return rp.d(R,1,centro(R.a[1]),g.x,g.y)});
      R.ap.um=Array.from({length:u1},(_,i)=>{const g=rp.gu(150,y,i);return rp.u(R,centro(R.a[0]),g.x,g.y)});
      R.ap.ps=Array.from({length:t2},(_,i)=>{const g=rp.gd(8,r2,i);return rp.d(R,1,centro(R.b[1]),g.x,g.y)});
      R.ap.us=Array.from({length:u2},(_,i)=>{const g=rp.gu(150,r2,i);return rp.u(R,centro(R.b[0]),g.x,g.y)});
      await voarVarios(ctx,[...R.ap.pm,...R.ap.um,...R.ap.ps,...R.ap.us].map(apTo),1200,70);
    };
    const ap2=async(ctx,R)=>{await R.rep.pegar(ctx,R,R.ap.pm[R.ap.pm.length-1])};          // uma dezena é separada para ser emprestada
    const ap3=async(ctx,R)=>{                       // a dezena gira e se parte em 10 unidades: agora são 12 unidades
      R.ap.um=await R.rep.partir(ctx,R,R.ap.pm.pop(),R.ap.um,R.ap.y0);
    };
    const ap4=async(ctx,R)=>{                       // 12 − 5: 5 maçãs vão encontrar as 5 que devem sair, e as duas se apagam
      const sai=R.ap.um.slice(-u2);await voarVarios(ctx,sai.map((e,i)=>[e,R.ap.us[i]._x,R.ap.us[i]._y]),1000,50);
      await sumir(ctx,[...sai,...R.ap.us],500);R.ap.um=R.ap.um.slice(0,R.ap.um.length-u2);R.ap.us=[];
    };
    const ap5=async(ctx,R)=>{                       // dezenas: um pacote encontra o pacote que deve sair, e os dois se apagam
      const pk=R.ap.pm.splice(R.ap.pm.length-t2,t2);await voarVarios(ctx,pk.map((e,i)=>[e,R.ap.ps[i]._x,R.ap.ps[i]._y]),1000);
      await sumir(ctx,[...pk,...R.ap.ps],500);R.ap.ps=[];
    };
    return{montar:ctx=>armada(ctx,"-",a,b),passos:[
      P(`Vamos calcular ${a} − ${b}. Começamos pelas unidades: ${u1} menos ${u2}.`,4000,async(ctx,R)=>{await entradaOperandos(ctx,R)}),
      P(`${u1} − ${u2}: não dá! ${u1} é menor que ${u2}.`,4000,seq(ap1,async(ctx,R)=>{
        [R.a[0],R.b[0]].forEach(e=>e.classList.add("pm-erro"));dizer(ctx,`${u1} − ${u2} ?`);await esperar(ctx,1600)})),
      P(`Vamos pegar uma dezena emprestada do ${t1}.`,4500,seq(ap2,async(ctx,R)=>{
        [R.a[0],R.b[0]].forEach(e=>e.classList.remove("pm-erro"));const T=R.a[1];
        R.pac=criar(R.box,"1","pm-pac bgd pm-pop",T._fx+4,T._fy+4);T.classList.add("pm-risc");
        R.novo=criar(R.box,String(t1-1),"pm-d cd pm-mini pm-pop",T._fx,R.Y(0)+6);await esperar(ctx,800);
        await voarVarios(ctx,[[R.pac,R.a[0]._fx+4,R.Y(0)+4]],1800);dizer(ctx,`${t1} dezenas viram ${t1-1} e 1 dezena emprestada`)}),{"emprestar":"pegar uma dezena da casa ao lado"}),
      P(`Essa dezena se parte em 10 unidades. Agora temos ${dozes} unidades!`,5000,seq(ap3,async(ctx,R)=>{
        R.pac.className="pm-cel pm-pac bgu pm-pop";R.pac.textContent="10";await esperar(ctx,1200);R.pac.remove();R.a[0].style.opacity=.3;
        R.doze=criar(R.box,String(dozes),"pm-d cu pm-pop",R.a[0]._fx,R.Y(0)+4);dizer(ctx,`10 + ${u1} = ${dozes}`);await esperar(ctx,1200)})),
      P(`Agora ${dozes} − ${u2} = ${ru}. Os números viajam até o resultado.`,4500,seq(ap4,async(ctx,R)=>{
        const d=R.dest(0),cb=criar(R.box,String(u2),"pm-d cu",R.b[0]._x,R.b[0]._y);R.b[0].classList.add("pm-dest");
        await voarVarios(ctx,[[R.doze,d.x-12,d.y],[cb,d.x+12,d.y]],1800);R.doze.remove();cb.remove();R.b[0].classList.remove("pm-dest");
        criar(R.box,String(ru),"pm-d pm-res pm-pop cu",d.x,d.y);dizer(ctx,`${dozes} − ${u2} = ${ru}`);await esperar(ctx,1000)})),
      P(`Agora as dezenas: sobrou ${t1-1} e vamos tirar ${t2}. ${t1-1} − ${t2} = ${rd}.`,4500,seq(ap5,async(ctx,R)=>{
        const d=R.dest(1),cb=criar(R.box,String(t2),"pm-d cd",R.b[1]._x,R.b[1]._y);R.b[1].classList.add("pm-dest");
        await voarVarios(ctx,[[R.novo,d.x-12,d.y],[cb,d.x+12,d.y]],1800);R.novo.remove();cb.remove();R.b[1].classList.remove("pm-dest");
        criar(R.box,String(rd),"pm-d pm-res pm-pop cd",d.x,d.y);dizer(ctx,`${t1-1} − ${t2} = ${rd}`);await esperar(ctx,1000)})),
      P(`O resultado é ${res}! Para conferir: ${res} + ${b} = ${a}.`,3500,async(ctx,R)=>{R.ap.res=[...R.ap.pm,...R.ap.um];glowRes(R);apBrilho(R);dizer(ctx,`${a} − ${b} = ${res}`);await esperar(ctx,2000)})
    ],repr:true};
  },
  /* ---------- 3 × 4: grupos de bolinhas ---------- */
  mult(g,c){
    const res=g*c,W=300,H=80+g*46,dx=j=>26+j*34,dy=r=>86+r*46,lista=Array.from({length:g},(_,i)=>(i+1)*c);
    const passos=[P(`Vamos calcular ${g} × ${c}. Isso quer dizer ${g} grupos de ${c} maçãs.`,4000,async(ctx,R)=>{
      R.op.style.opacity=1;R.ig.style.opacity=1;await voarVarios(ctx,[[R.e1,40,0],[R.e2,140,0]],1600);
      R.caixas=Array.from({length:g},(_,i)=>{const b=document.createElement("i");b.className="pm-caixa pm-pop";b.style.cssText=`left:${dx(0)-10}px;top:${dy(i)-8}px;width:${c*34+16}px;height:42px`;R.box.append(b);return b});
      await esperar(ctx,900)},{parcelas:"as partes iguais que a gente soma"})];
    const pac=res>30;                                   // acima de 30 objetos: cada grupo vira um pacote
    for(let i=0;i<g;i++)passos.push(P(i===0?`Primeiro grupo: ${c} maçãs.`:`Grupo ${i+1}: mais ${c} maçãs.`,4000,async(ctx,R)=>{
      const pts=pac?[criar(R.box,"🍎"+c,"pm-pacote bgn",W-64,24,58,34)]:Array.from({length:c},()=>criar(R.box,"🍎","pm-fruta",W-44,24));R.pontos=(R.pontos||[]).concat(pts);
      await voarVarios(ctx,pts.map((p,j)=>[p,pac?dx(0)+2:dx(j)+2,dy(i)+(pac?2:4)]),pac?1400:1200,pac?0:260)}));
    passos.push(P(`Contando de ${c} em ${c}: ${lista.join(", ")}.`,Math.min(5000,Math.max(3500,900*g+500)),async(ctx,R)=>{
      R.rot=[];for(let i=0;i<g;i++){const l=criar(R.box,String(lista[i]),"pm-d cn pm-pop",dx(c)+8,dy(i)-6,60,44);R.rot.push(l);dizer(ctx,lista.slice(0,i+1).join(", "));await esperar(ctx,900)}}));
    passos.push(P(`${g} × ${c} = ${res}!`,4000,async(ctx,R)=>{
      const u=R.rot[g-1],cl=criar(R.box,String(res),"pm-d cn",u._x,u._y,60,44);await voarVarios(ctx,[[cl,R.slot.x,R.slot.y]],1800);cl.remove();
      criar(R.box,String(res),"pm-d cn pm-res pm-pop",R.slot.x,R.slot.y,60,56);glowRes(R);dizer(ctx,`${g} × ${c} = ${res}`);await esperar(ctx,1000)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H);return Object.assign(expressaoCena(ctx,box,g,"×",c),{W,pontos:[]})},passos};
  },
  /* ---------- Lote A: comparar dois números da esquerda para a direita (mesmo tamanho) ---------- */
  comparar(a,b){
    const sa=String(a),sb=String(b),L=sa.length,W=300,H=250,cx=i=>(W-L*CW)/2+i*CW,kk=i=>L-1-i,passos=[];
    let dif=0;while(dif<L-1&&sa[dif]===sb[dif])dif++;
    const sinal=a>b?">":a<b?"<":"=",maior=Math.max(a,b);
    passos.push(P(`Vamos comparar ${a} e ${b}. Cada algarismo está na sua casa, com a sua cor.`,4000,async(ctx,R)=>{
      await voarVarios(ctx,[...R.da.map((e,i)=>[e,cx(i),40]),...R.db.map((e,i)=>[e,cx(i),130])],1500,150)},{comparar:"descobrir qual número é maior ou menor"}));
    for(let i=0;i<=dif;i++){const x=sa[i],y=sb[i],igual=x===y,s=igual?"=":(+x>+y?">":"<");
      passos.push(P(igual?`Casa das ${nomePos(kk(i))}: ${x} e ${y} são iguais. Então olhamos a próxima casa.`:`Casa das ${nomePos(kk(i))}: ${x} ${+x>+y?"é maior":"é menor"} que ${y}. Já descobrimos!`,4000,async(ctx,R)=>{
        R.da[i].classList.add("pm-glow");R.db[i].classList.add("pm-glow");
        const m=criar(R.box,s,"pm-op pm-pop",cx(i)+8,-60);await voarVarios(ctx,[[m,cx(i)+8,84]],1200);R.sims.push(m);dizer(ctx,`${x} ${s} ${y}`);await esperar(ctx,800)}))}
    passos.push(P(`Então ${a} ${sinal} ${b}. O maior número é ${maior}!`,4000,async(ctx,R)=>{
      const u=a>=b?R.da[0]:R.db[0],cl=criar(R.box,String(maior),"pm-d cn",u._x,u._y);await voarVarios(ctx,[[cl,(W-200)/2,190]],1600);cl.remove();
      criar(R.box,`${a} ${sinal} ${b}`,"pm-d cn pm-res pm-pop",(W-200)/2,190,200,56);glowRes(R);dizer(ctx,`${a} ${sinal} ${b}`);await esperar(ctx,1000)}));
    /* sinais e ordem: maior que, menor que, igual, crescente, decrescente */
    const c3=a===b?a+1:Math.max(Math.round((a+b)/2),Math.min(a,b)+1),tri=[a,b,c3].sort((x,y)=>x-y),cresc=tri.join(" < "),decr=[...tri].reverse().join(" > ");
    passos.push(P("A boca do sinal abre para o maior. > é maior que, < é menor que, = é igual.",4500,async(ctx,R)=>{
      R.box.innerHTML="";const it=[[">","maior que"],["<","menor que"],["=","igual"]].map(([sg,nm],i)=>{
        const o=criar(R.box,sg,"pm-op pm-pop",20+i*92,-60,60,52),t=criar(R.box,nm,"pm-txt",8+i*92,-60,84,30);return[[o,20+i*92,40],[t,8+i*92,100]]}).flat();
      await voarVarios(ctx,it,1500,200);resSub(R,"maior que (>) · menor que (<) · igual (=)",10,170,280);glowRes(R);dizer(ctx,"> maior que · < menor que · = igual");await esperar(ctx,900)},{"maior que":"o sinal > aponta para o menor","menor que":"o sinal < aponta para o menor","igual":"o sinal = quando os dois são o mesmo número"}));
    passos.push(P(`Ordem crescente é do menor para o maior. Por exemplo: ${cresc}.`,4500,async(ctx,R)=>{
      R.box.innerHTML="";const ch=tri.map((v,i)=>criar(R.box,String(v),"pm-d cn",14+i*92,-70,76,44));
      await voarVarios(ctx,ch.map((e,i)=>[e,14+i*92,60]),1500,250);resSub(R,cresc,20,140,260);glowRes(R);dizer(ctx,"crescente: do menor para o maior");await esperar(ctx,900)},{crescente:"do menor para o maior"}));
    passos.push(P(`Ordem decrescente é do maior para o menor. Por exemplo: ${decr}.`,4500,async(ctx,R)=>{
      R.box.innerHTML="";const ch=[...tri].reverse().map((v,i)=>criar(R.box,String(v),"pm-d cn",14+i*92,-70,76,44));
      await voarVarios(ctx,ch.map((e,i)=>[e,14+i*92,60]),1500,250);resSub(R,decr,20,140,260);glowRes(R);dizer(ctx,"decrescente: do maior para o menor");await esperar(ctx,900)},{decrescente:"do maior para o menor"}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H),R={box,da:[],db:[],sims:[]};
      [...sa].forEach((d,i)=>R.da.push(criar(box,d,"pm-d "+clsPos(kk(i)),cx(i),-70)));
      [...sb].forEach((d,i)=>R.db.push(criar(box,d,"pm-d "+clsPos(kk(i)),cx(i),-70)));return R},passos};
  },
  /* ---------- Lote A: pares e ímpares com duplas de maçãs ---------- */
  parImpar(n){
    const W=300,H=250,sp=26,np=Math.floor(n/2),sobra=n%2,bw=2*sp+12,bx=j=>8+j*(bw+6),passos=[],tipo=sobra?"ímpar":"par";
    passos.push(P(`Vamos descobrir se ${n} é par ou ímpar. Temos ${n} maçãs. Vamos formar duplas!`,4500,async(ctx,R)=>{
      await voarVarios(ctx,R.mac.map((e,i)=>[e,6+i*sp,50]),900,110)},{par:"dá para formar duplas sem sobrar",ímpar:"sempre sobra um sem dupla"}));
    for(let j=0;j<np;j++)passos.push(P(`Dupla ${j+1}: duas maçãs juntas.`,3500,async(ctx,R)=>{
      const c=document.createElement("i");c.className="pm-caixa pm-pop";c.style.cssText=`left:${bx(j)}px;top:140px;width:${bw}px;height:42px`;R.box.append(c);
      await voarVarios(ctx,[[R.mac[2*j],bx(j)+6,150],[R.mac[2*j+1],bx(j)+6+sp,150]],1000);dizer(ctx,`${2*(j+1)} maçãs em ${j+1} ${j===0?"dupla":"duplas"}`)}));
    passos.push(P(sobra?"Sobrou 1 maçã sem dupla!":"Não sobrou nenhuma maçã. Todas têm dupla!",3500,async(ctx,R)=>{
      if(sobra){const e=R.mac[n-1];e.classList.add("pm-glow");await voarVarios(ctx,[[e,bx(np)+6,150]],1000);dizer(ctx,"sobrou 1")}else{R.mac.forEach(e=>e.classList.add("pm-glow"));await esperar(ctx,900);dizer(ctx,"não sobrou nenhuma")}}));
    passos.push(P("Dica: olhe o último algarismo! Terminou em 0, 2, 4, 6 ou 8? É par. Em 1, 3, 5, 7 ou 9? É ímpar.",5000,async(ctx,R)=>{
      R.box.innerHTML="";R.dg={};
      const it=[0,2,4,6,8].map((d,i)=>{const e=criar(R.box,String(d),"pm-d cu",10+i*56,-70,50,44);R.dg[d]=e;return[e,10+i*56,30]}).concat([1,3,5,7,9].map((d,i)=>{const e=criar(R.box,String(d),"pm-d cc",10+i*56,-70,50,44);R.dg[d]=e;return[e,10+i*56,110]}));
      await voarVarios(ctx,it,1400,150);dizer(ctx,"Em cima: pares · Embaixo: ímpares")}));
    passos.push(P(`${n} termina em ${n%10}. Então ${n} é ${tipo}!`,4000,async(ctx,R)=>{
      R.dg[n%10].classList.add("pm-glow");const cl=criar(R.box,String(n),"pm-d cn",(W-60)/2,-60,60,50);await voarVarios(ctx,[[cl,(W-200)/2,185]],1500);cl.remove();
      criar(R.box,`${n} é ${tipo}`,"pm-d cn pm-res pm-pop",(W-200)/2,185,200,56);glowRes(R);dizer(ctx,`${n} é ${tipo}`);await esperar(ctx,1000)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H),R={box,mac:[],dg:{}};
      for(let i=0;i<n;i++)R.mac.push(criar(box,"🍎","pm-fruta",6+i*sp,-60));return R},passos};
  },
  /* ---------- Lote A: sequência crescente (ini, ini+k, ...) ---------- */
  sequencia(ini,k){
    const W=300,H=220,t=[0,1,2,3,4].map(i=>ini+i*k),cx=i=>8+i*58,passos=[];
    passos.push(P(`Uma sequência é uma fila de números que segue uma regra. Esta começa com ${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}...`,4500,async(ctx,R)=>{
      await voarVarios(ctx,R.t.map((e,i)=>[e,cx(i),90]),1200,250)},{sequência:"números em fila, com uma regra"}));
    for(let i=0;i<3;i++)passos.push(P(i===0?`De ${t[0]} para ${t[1]} o número aumentou ${k}. Vamos anotar +${k}.`:`De ${t[i]} para ${t[i+1]}: de novo +${k}!`,4000,async(ctx,R)=>{
      R.t[i].classList.add("pm-glow");R.t[i+1].classList.add("pm-glow");
      const o=criar(R.box,"+"+k,"pm-op pm-pop",cx(i)+30,-60);await voarVarios(ctx,[[o,cx(i)+30,30]],1200);R.ops.push(o);dizer(ctx,`${t[i]} + ${k} = ${t[i+1]}`);await esperar(ctx,800)}));
    passos.push(P(`A regra é somar ${k}. Depois de ${t[3]} vem ${t[3]} + ${k} = ${t[4]}!`,4500,async(ctx,R)=>{
      const o=criar(R.box,"+"+k,"pm-op pm-pop",cx(3)+30,-60);await voarVarios(ctx,[[o,cx(3)+30,30]],1200);
      const cl=criar(R.box,String(t[4]),"pm-d cn",o._x,o._y,54,48);await voarVarios(ctx,[[cl,cx(4),90]],1800);cl.remove();
      criar(R.box,String(t[4]),"pm-d cn pm-res pm-pop",cx(4),90,54,48);glowRes(R);dizer(ctx,`${t[3]} + ${k} = ${t[4]}`);await esperar(ctx,900)}));
    const dif=t[1]-t[0];
    passos.push(P(`Números aumentando: somamos. Quanto? O segundo menos o primeiro: ${t[1]} − ${t[0]} = ${dif}.`,4500,async(ctx,R)=>{
      R.box.innerHTML="";const a=criar(R.box,String(t[0]),"pm-d cn",40,-70,70,48),b=criar(R.box,String(t[1]),"pm-d cn",190,-70,70,48);
      await voarVarios(ctx,[[a,40,50],[b,190,50]],1300,250);resSub(R,`${t[1]} − ${t[0]} = ${dif}`,40,130,220);glowRes(R);dizer(ctx,"aumentando → segundo − primeiro");await esperar(ctx,900)},{aumentando:"os números crescem, então somamos"}));
    passos.push(P(`Números diminuindo: subtraímos. Quanto? O primeiro menos o segundo: ${t[4]} − ${t[3]} = ${dif}.`,4500,async(ctx,R)=>{
      R.box.innerHTML="";const a=criar(R.box,String(t[4]),"pm-d cn",40,-70,70,48),b=criar(R.box,String(t[3]),"pm-d cn",190,-70,70,48);
      await voarVarios(ctx,[[a,40,50],[b,190,50]],1300,250);resSub(R,`${t[4]} − ${t[3]} = ${dif}`,40,130,220);glowRes(R);dizer(ctx,"diminuindo → primeiro − segundo");await esperar(ctx,900)},{diminuindo:"os números diminuem, então subtraímos"}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H);return{box,ops:[],t:t.slice(0,4).map((v,i)=>criar(box,String(v),"pm-d cn",cx(i),-70,54,48))}},passos};
  },
  /* ---------- Figuras geométricas (explicação completa): quadrado, retângulo, triângulo, quadrilátero, corte na diagonal, pentágono ao decágono ---------- */
  figuras(){
    const W=300,H=264,cx=150,cy=112,passos=[],NS="http://www.w3.org/2000/svg";
    const nomeF=id=>FIGURAS.find(f=>f.id===id).nome,ladosF=id=>FIGURAS.find(f=>f.id===id).lados;
    /* desenho da figura com um traço (<line>) por lado: ladoN (escuro) vira ladoV (vermelho) quando o lado é contado */
    const desenhar=(R,id,x,y,r,cor)=>{
      const V=vertsFig(id,x,y,r),n=V.length,fill=cor||"#fff3c4";
      const g=document.createElementNS(NS,"svg");g.setAttribute("class","pm-svg");g.setAttribute("width",W);g.setAttribute("height",H);g.style.cssText="position:absolute;left:0;top:0";
      g.innerHTML=`<polygon points="${V.map(p=>p.join(",")).join(" ")}" fill="${fill}" stroke="none"/>`+V.map((p,i)=>{const q=V[(i+1)%n];return `<line class="ladoN" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#16224a" stroke-width="5" stroke-linecap="round"/>`}).join("");
      R.box.prepend(g);return{V,n,g};
    };
    const fora=(x,y,k)=>{const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1;return[x+dx/d*k,y+dy/d*k]};
    const contarVertices=async(ctx,R,fg)=>{
      const dots=fg.V.map(()=>criar(R.box,"","pm-ponto",cx,-60,26,26));await voarVarios(ctx,dots.map((e,i)=>[e,fg.V[i][0]-13,fg.V[i][1]-13]),900,250);
      const vn=fg.V.map((_,i)=>criar(R.box,String(i+1),"pm-d cd pm-mini",cx,-60,32,34));
      await voarVarios(ctx,vn.map((e,i)=>{const[x,y]=fora(fg.V[i][0],fg.V[i][1],26);return[e,x-16,y-17]}),700,300);
    };
    const contarLados=async(ctx,R,fg)=>{
      const lin=fg.g.querySelectorAll("line");
      for(let i=0;i<fg.n;i++){
        lin[i].setAttribute("class","ladoV");lin[i].setAttribute("stroke","#d62839");lin[i].setAttribute("stroke-width","8");
        const a=fg.V[i],b=fg.V[(i+1)%fg.n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],[x,y]=fora(m[0],m[1],24),ch=criar(R.box,String(i+1),"pm-d cu pm-mini",cx,-60,32,34);
        await voarVarios(ctx,[[ch,x-16,y-17]],420);
      }
    };
    passos.push(P("Este é o quadrado. O cantinho se chama vértice e o traço entre dois cantinhos se chama lado.",4500,async(ctx,R)=>{
      R.fg=desenhar(R,"quadrado",cx,cy,82);
      const v=criar(R.box,"vértice","pm-pacote bgd",8,-60,86,34),l=criar(R.box,"lado","pm-pacote bgc",214,-60,70,34);
      await voarVarios(ctx,[[v,6,R.fg.V[0][1]-60],[l,226,cy-14]],1200,300);dizer(ctx,"vértice = cantinho · lado = traço");await esperar(ctx,900)},{"vértice":"o cantinho de uma figura","lado":"cada traço entre dois vértices"}));
    passos.push(P("Vamos contar os vértices do quadrado: 1, 2, 3, 4. São 4 vértices!",4500,async(ctx,R)=>{
      await contarVertices(ctx,R,R.fg);resSub(R,"4 vértices",60,222,180);glowRes(R);dizer(ctx,"4 vértices");await esperar(ctx,800)}));
    passos.push(P("Agora os lados: a cada lado contado, ele fica vermelho. 1, 2, 3, 4! O quadrado tem 4 lados.",5000,async(ctx,R)=>{
      R.box.querySelectorAll(".pm-pacote").forEach(e=>e.remove());await contarLados(ctx,R,R.fg);resSub(R,"4 lados",60,222,180);glowRes(R);dizer(ctx,"4 lados vermelhos");await esperar(ctx,800)}));
    passos.push(P("O retângulo também tem 4 vértices e 4 lados. Os lados vão ficando vermelhos enquanto contamos.",5000,async(ctx,R)=>{
      R.box.innerHTML="";R.fg=desenhar(R,"retangulo",cx,cy,82);await contarLados(ctx,R,R.fg);resSub(R,"4 lados",60,222,180);glowRes(R);dizer(ctx,"retângulo: 4 lados");await esperar(ctx,700)}));
    passos.push(P("O triângulo tem 3 vértices e 3 lados. Vamos contar os lados: 1, 2, 3, todos ficam vermelhos!",5000,async(ctx,R)=>{
      R.box.innerHTML="";R.fg=desenhar(R,"triangulo",cx,cy,82);await contarLados(ctx,R,R.fg);resSub(R,"3 lados",60,222,180);glowRes(R);dizer(ctx,"triângulo: 3 lados");await esperar(ctx,700)}));
    passos.push(P("Figuras de 4 lados são quadriláteros: quadri quer dizer 4 e látero quer dizer lado. Quadrado e retângulo são quadriláteros!",5000,async(ctx,R)=>{
      R.box.innerHTML="";const ids=["quadrado","retangulo","quadrilatero"],xs=[52,150,248];
      ids.forEach((id,i)=>{const f=desenhar(R,id,xs[i],96,38,["#fff3c4","#d6f0d9","#dfe7ff"][i]);f.g.setAttribute("data-fig",id)});
      const ch=ids.map((_,i)=>criar(R.box,"quadrilátero","pm-pacote bgn",xs[i]-44,-60,88,34));
      await voarVarios(ctx,ch.map((e,i)=>[e,xs[i]-44,160]),1000,350);resSub(R,"quadrilátero = 4 lados",50,208,200);glowRes(R);dizer(ctx,"quadri = 4 · látero = lado");await esperar(ctx,800)},{"quadrilátero":"figura de 4 lados"}));
    passos.push(P("Cortando um quadrilátero na diagonal, de um vértice ao vértice oposto, nascem 2 triângulos!",5000,async(ctx,R)=>{
      R.box.innerHTML="";const V=vertsFig("quadrado",cx,cy,70);
      const g=document.createElementNS(NS,"svg");g.setAttribute("class","pm-svg");g.setAttribute("width",W);g.setAttribute("height",H);g.style.cssText="position:absolute;left:0;top:0";
      const tA=[V[0],V[1],V[2]],tB=[V[0],V[2],V[3]],pt=t=>t.map(p=>p.join(",")).join(" ");
      g.innerHTML=`<polygon class="triA" points="${pt(tA)}" fill="#fff3c4" stroke="#16224a" stroke-width="5" stroke-linejoin="round"/><polygon class="triB" points="${pt(tB)}" fill="#d6f0d9" stroke="#16224a" stroke-width="5" stroke-linejoin="round"/><line class="diag" x1="${V[0][0]}" y1="${V[0][1]}" x2="${V[2][0]}" y2="${V[2][1]}" stroke="#d62839" stroke-width="5" stroke-dasharray="9 7"/>`;
      R.box.prepend(g);await esperar(ctx,1500);
      g.querySelector(".triA").setAttribute("transform","translate(20,-14)");g.querySelector(".triB").setAttribute("transform","translate(-20,14)");g.querySelector(".diag").remove();
      resSub(R,"2 triângulos",60,222,180);glowRes(R);dizer(ctx,"quadrilátero → 2 triângulos");await esperar(ctx,1200)},{diagonal:"liga dois vértices que não são vizinhos"}));
    const poli=(ids,labelsNome,nums,fala)=>P(fala,5000,async(ctx,R)=>{
      R.box.innerHTML="";const xs=[52,150,248];
      ids.forEach((id,i)=>desenhar(R,id,xs[i],84,40,["#fff3c4","#d6f0d9","#dfe7ff"][i]));
      const ch=ids.map((_,i)=>criar(R.box,`${nums[i]}`,"pm-d cn",xs[i]-18,-60,36,38)),nm=ids.map((id,i)=>criar(R.box,nomeF(id),"pm-txt",xs[i]-46,-60,92,30));
      await voarVarios(ctx,[...ch.map((e,i)=>[e,xs[i]-18,140]),...nm.map((e,i)=>[e,xs[i]-46,184])],1200,250);
      resSub(R,nums.join(" · ")+" lados",40,226,220);glowRes(R);dizer(ctx,ids.map((id,i)=>`${nums[i]} lados`).join(" · "));await esperar(ctx,700)});
    passos.push(poli(["pentagono","hexagono","heptagono"],0,[5,6,7],"Penta quer dizer 5: pentágono. Hexa é 6: hexágono. Hepta é 7: heptágono. O nome conta os lados!"));
    passos.push(poli(["octogono","eneagono","decagono"],0,[8,9,10],"Octo quer dizer 8: octógono. Eneá é 9: eneágono. Deca é 10: decágono. De 3 a 10 lados!"));
    passos.push(P("Para lembrar: tri 3, quadri 4, penta 5, hexa 6, hepta 7, octo 8, eneá 9 e deca 10. O começo do nome conta os lados!",5000,async(ctx,R)=>{
      R.box.innerHTML="";const L=[["tri",3],["quadri",4],["penta",5],["hexa",6],["hepta",7],["octo",8],["eneá",9],["deca",10]],
        ch=L.map(()=>criar(R.box,"","pm-pacote bgn",110,-60,120,34));ch.forEach((e,i)=>{e.textContent=`${L[i][0]} = ${L[i][1]}`});
      await voarVarios(ctx,ch.map((e,i)=>[e,i<4?20:160,10+(i%4)*46]),900,260);
      resSub(R,"de 3 a 10 lados",50,206,200);glowRes(R);dizer(ctx,"o nome conta os lados");await esperar(ctx,700)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H);return{box}},passos};
  },
  /* ---------- Comprimento: quadro de ordem, frase da Katia, ×10 para a direita, ÷10 para a esquerda, Pyri andando pelas casas ---------- */
  comprimento(n){
    const W=300,H=250,N=n*100,passos=[],U=["km","hm","dam","m","dm","cm","mm"],FR=["Katia","Herdou","DA","Mãe","Dois","Cachorrinhos","Muito Mansinhos"],CW=40,X0=4,CY=40;
    const xc=i=>X0+i*(CW+2),cor=i=>["bgn","bgd","bgc","bgn","bgd","bgc","bgn"][i];
    /* o quadro de ordem: uma casa por unidade; a unidade do Pyri e o destino ficam em destaque */
    const quadro=(R,fy)=>{R.cas=U.map((u,i)=>{const e=criar(R.box,u,"pm-pacote pm-quadro "+cor(i),xc(i),CY,CW,34);e.dataset.u=u;return e});return R.cas};
    const andar=async(ctx,R,de,para,mult)=>{
      const i0=U.indexOf(de),i1=U.indexOf(para),dir=i1>i0?1:-1,py=criar(R.box,"","pm-pyri-anda",xc(i0),CY+40,42,42);py.dataset.casa=de;R.py=py;
      R.cas[i0].classList.add("pm-glow");
      for(let i=i0;i!==i1;i+=dir){
        const lab=criar(R.box,mult?"×10":"÷10","pm-txt pm-mult pm-pop",xc(Math.min(i,i+dir))+CW/2-4,CY+88,CW+8,28);
        await voarVarios(ctx,[[py,xc(i+dir),CY+40]],800);py.dataset.casa=U[i+dir];
      }
      R.cas[i1].classList.add("pm-glow");
    };
    passos.push(P("Este é o quadro de ordem: km, hm, dam, m, dm, cm e mm. Cada casa é uma unidade de comprimento.",4500,async(ctx,R)=>{
      const c=quadro(R);c.forEach(e=>{posEl(e,e._x,-60)});await voarVarios(ctx,c.map((e,i)=>[e,xc(i),CY]),900,180);dizer(ctx,"km · hm · dam · m · dm · cm · mm");await esperar(ctx,700)},{"quadro de ordem":"as casas das unidades, do maior para o menor"}));
    passos.push(P("Para lembrar a ordem, use a frase da Katia: Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos.",5000,async(ctx,R)=>{
      R.box.innerHTML="";quadro(R);const f=FR.map((w,i)=>criar(R.box,w,"pm-txt",xc(i)+CW/2-38,-60,76,26));f.forEach(e=>{e.style.fontSize=".66rem"});
      await voarVarios(ctx,f.map((e,i)=>[e,xc(i)+CW/2-38,CY+44+(i%2)*30]),1000,260);resSub(R,"K H DA M D C M",50,160,200);glowRes(R);dizer(ctx,"Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos");await esperar(ctx,700)}));
    passos.push(P("Indo para a direita, de uma casa para a vizinha, multiplica por 10. Cada passo para a frente é × 10.",4500,async(ctx,R)=>{
      R.box.innerHTML="";quadro(R);const ar=U.slice(1).map((_,i)=>criar(R.box,"×10","pm-txt",xc(i)+CW/2-2,-60,CW+4,26));ar.forEach(e=>{e.style.fontSize=".7rem"});
      await voarVarios(ctx,ar.map((e,i)=>[e,xc(i)+CW/2-2,CY+44]),900,200);resSub(R,"direita: × 10",70,130,160);glowRes(R);dizer(ctx,"para a direita: multiplica por 10");await esperar(ctx,700)}));
    passos.push(P("Voltando para a esquerda, de uma casa para a vizinha, divide por 10. Cada passo para trás é ÷ 10.",4500,async(ctx,R)=>{
      R.box.innerHTML="";quadro(R);const ar=U.slice(1).map((_,i)=>criar(R.box,"÷10","pm-txt",xc(i)+CW/2-2,-60,CW+4,26));ar.forEach(e=>{e.style.fontSize=".7rem"});
      await voarVarios(ctx,ar.map((e,i)=>[e,xc(i)+CW/2-2,CY+44]),900,200);resSub(R,"esquerda: ÷ 10",70,130,160);glowRes(R);dizer(ctx,"para a esquerda: divide por 10");await esperar(ctx,700)}));
    passos.push(P(`${n} ${plu(n,"metro","metros")} para cm: o Pyri anda 2 casas para a direita (m, dm, cm). × 10 × 10 = × 100: ${n} × 100 = ${N} cm.`,5000,async(ctx,R)=>{
      R.box.innerHTML="";quadro(R);await andar(ctx,R,"m","cm",true);resSub(R,`${n} m = ${N} cm`,60,150,180);glowRes(R);dizer(ctx,`${n} m = ${N} cm`);await esperar(ctx,500)},{"Pyri":"o nosso guia nas casas"}));
    passos.push(P(`E ${N} cm para m: o Pyri volta 2 casas para a esquerda (cm, dm, m). ÷ 10 ÷ 10 = ÷ 100: ${N} ÷ 100 = ${n} m.`,5000,async(ctx,R)=>{
      R.box.innerHTML="";quadro(R);await andar(ctx,R,"cm","m",false);resSub(R,`${N} cm = ${n} m`,60,150,180);glowRes(R);dizer(ctx,`${N} cm = ${n} m`);await esperar(ctx,500)}));
    passos.push(P("De km para m são 3 casas para a direita: × 10 × 10 × 10 = × 1000. Por isso 1 km = 1000 m.",5000,async(ctx,R)=>{
      R.box.innerHTML="";quadro(R);await andar(ctx,R,"km","m",true);resSub(R,"1 km = 1000 m",60,150,180);glowRes(R);dizer(ctx,"1 km = 1000 m");await esperar(ctx,400)}));
    return{montar:ctx=>({box:novaCena(ctx,W,H)}),passos};
  },
  /* ---------- Lote B: tempo (relógio, 60 min, meia hora, dia, semana e ano) ---------- */
  tempo(h){
    const W=300,H=332,cx=150,cy=118,passos=[],pos=(k,r)=>{const a=k*30*Math.PI/180;return[cx+r*Math.sin(a),cy-r*Math.cos(a)]};
    const mao=(R,L,larg,cor,qual,deg)=>{const e=document.createElement("i");   /* sem pm-pop: a animação de entrada anulava o giro do ponteiro */
      e.dataset.mao=qual;e.dataset.deg=deg||0;e.style.cssText=`position:absolute;left:${cx-larg/2}px;top:${cy-L}px;width:${larg}px;height:${L}px;background:${cor};border-radius:${larg}px;transform-origin:50% 100%;z-index:3`;e.style.transform=`rotate(${deg||0}deg)`;R.box.append(e);return e};
    passos.push(P("O relógio tem 12 números. O ponteiro pequeno mostra a hora e o ponteiro grande mostra os minutos.",4500,async(ctx,R)=>{
      R.box.insertAdjacentHTML("afterbegin",`<svg class="pm-svg" style="position:absolute;left:${cx-100}px;top:${cy-100}px" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="98" fill="#fff" stroke="#16224a" stroke-width="5"/>${Array.from({length:60},(_,i)=>{const a=i*6*Math.PI/180,r1=i%5?90:84;return `<line x1="${(100+r1*Math.sin(a)).toFixed(1)}" y1="${(100-r1*Math.cos(a)).toFixed(1)}" x2="${(100+96*Math.sin(a)).toFixed(1)}" y2="${(100-96*Math.cos(a)).toFixed(1)}" stroke="#16224a" stroke-width="${i%5?1:2.5}"/>`}).join("")}</svg>`);
      R.nums=Array.from({length:12},(_,i)=>criar(R.box,String(i+1),"pm-d cn pm-mini",cx,-60,30,34));
      await voarVarios(ctx,R.nums.map((e,i)=>{const[x,y]=pos(i+1,70);return[e,x-15,y-17]}),900,150);
      R.ph=mao(R,48,7,"#16224a","pequeno",120);R.pmin=mao(R,76,5,"#d62839","grande",0);
      const l1=criar(R.box,"ponteiro pequeno = horas","pm-txt pm-legenda-rel",4,300,146,26),l2=criar(R.box,"ponteiro grande = minutos","pm-txt pm-legenda-rel",150,300,146,26);
      l1.style.cssText+=";font-size:.62rem;border-color:#16224a";l2.style.cssText+=";font-size:.62rem;border-color:#d62839;color:#d62839";await esperar(ctx,900)},{ponteiro:"mostra as horas ou os minutos"}));
    passos.push(P("Cada número do relógio vale 5 minutos: o 1 vale 5, o 2 vale 10, o 3 vale 15... até o 12, que vale 60.",5000,async(ctx,R)=>{
      R.cinco=Array.from({length:12},(_,i)=>criar(R.box,String((i+1)*5),"pm-pacote bgn",cx,-60,34,24));
      await voarVarios(ctx,R.cinco.map((e,i)=>{const[x,y]=pos(i+1,113);return[e,x-17,y-12]}),600,250);dizer(ctx,"cada número vale 5 minutos");await esperar(ctx,700)}));
    passos.push(P("O ponteiro grande dá uma volta inteira, do 12 até o 12. Uma volta completa são 60 minutos, ou seja, 1 hora!",5000,async(ctx,R)=>{
      R.ph.style.transition="none";
      await junto(ctx,c=>girarMao(c,R.pmin,360,3000),c=>girarMao(c,R.ph,150,3000));
      R.pmin.style.transition="none";R.pmin.style.transform="rotate(0deg)";R.pmin.dataset.deg=0;R.ph.style.transition="none";R.ph.style.transform="rotate(120deg)";R.ph.dataset.deg=120;
      resSub(R,"1 h = 60 min",70,254,160);glowRes(R);dizer(ctx,"1 hora = 60 minutos");await esperar(ctx,900)}));
    passos.push(P(`${h} ${plu(h,"hora","horas")} são ${h} ${plu(h,"volta","voltas")}. Cada volta tem 60 minutos: ${h} × 60 = ${h*60} minutos.`,5000,async(ctx,R)=>{
      const a=criar(R.box,String(h),"pm-d cn pm-mini",20,-60,40,34),x=criar(R.box,"×","pm-op pm-mini",20,-60,30,34),b=criar(R.box,"60","pm-d cc pm-mini",20,-60,44,34);
      await voarVarios(ctx,[[a,20,254],[x,60,254],[b,90,254]],1200,300);[a,x,b].forEach(e=>e.remove());
      resSub(R,`${h} × 60 = ${h*60} min`,40,254,220);glowRes(R);dizer(ctx,`${h} h = ${h*60} min`);await esperar(ctx,900)}));
    passos.push(P("Meia volta, do 12 até o 6, são 30 minutos. É meia hora!",4000,async(ctx,R)=>{
      await girarMao(ctx,R.pmin,180,2400);
      resSub(R,"meia hora = 30 min",60,254,180);glowRes(R);dizer(ctx,"meia hora = 30 minutos");await esperar(ctx,900)}));
    passos.push(P("Quando o ponteiro grande para em outro número, a hora fica quebrada. No 11 são 55 minutos: o relógio marca 3:55.",5000,async(ctx,R)=>{
      await junto(ctx,c=>girarMao(c,R.ph,117.5,2200),c=>girarMao(c,R.pmin,330,2200));
      resSub(R,"3:55",90,254,120);glowRes(R);dizer(ctx,"11 × 5 = 55 minutos: 3:55");await esperar(ctx,900)}));
    passos.push(P("Um dia tem 24 horas, uma semana tem 7 dias e um ano tem 12 meses.",5000,async(ctx,R)=>{
      R.box.innerHTML="";
      const L=[["1 dia","24","24 h"],["1 semana","7","7 dias"],["1 ano","12","12 meses"]],chips=L.map(p=>criar(R.box,p[1],"pm-d cc pm-mini",150,-60,60,36));
      L.forEach((p,i)=>criar(R.box,p[0]+" =","pm-txt",20,30+i*70,110,36));
      await voarVarios(ctx,chips.map((e,i)=>[e,150,30+i*70]),1000,500);
      chips.forEach((e,i)=>{e.remove();criar(R.box,L[i][2],"pm-txt pm-res pm-pop",140,30+i*70,130,36)});
      glowRes(R);dizer(ctx,"1 dia = 24 h · 1 semana = 7 dias · 1 ano = 12 meses");await esperar(ctx,900)}));
    return{montar:ctx=>({box:novaCena(ctx,W,H)}),passos};
  },
  /* ---------- Lote B: dinheiro (R$ 1 = 100 centavos, somar valores, troco) ---------- */
  dinheiro(pago,custo){
    /* moedas e cédulas desenhadas (svgDinheiro, em js/motor/trilha.js) dentro de caixinhas que voam */
    const nd=(R,k,v,x,y,w,h)=>{const e=criar(R.box,"","pm-dinSvg",x,y,w,h);e.innerHTML=svgDinheiro([{k,v}]);return e};
    const W=300,H=250,t=pago-custo,a=custo>5?5:custo-1,b=custo-a,passos=[];
    const cofre=(R)=>{const c=document.createElement("i");c.className="pm-caixa pm-pop";c.style.cssText="left:20px;top:110px;width:260px;height:80px";R.box.append(c)};
    passos.push(P("No Brasil usamos reais e centavos. Uma moeda de 1 real vale 100 centavos.",4500,async(ctx,R)=>{
      const m=nd(R,"moeda",100,10,-60,72,72),ig=criar(R.box,"=","pm-op pm-mini",10,-60,30,40),c=criar(R.box,"100 centavos","pm-pacote bgn",10,-60,130,44);
      await voarVarios(ctx,[[m,20,30],[ig,105,46],[c,145,44]],1300,300);
      resSub(R,"R$ 1 = 100 centavos",40,140,220);glowRes(R);dizer(ctx,"R$ 1 = 100 centavos");await esperar(ctx,800)},{centavo:"uma das 100 partes de 1 real",troco:"o dinheiro que sobra e volta para você"}));
    passos.push(P("Duas moedas de 50 centavos juntas valem 1 real: 50 + 50 = 100 centavos.",4000,async(ctx,R)=>{
      R.box.innerHTML="";cofre(R);const m=[0,1].map(()=>nd(R,"moeda",50,10,-60,60,60));
      await voarVarios(ctx,[[m[0],100,20],[m[1],170,20]],1000,300);await voarVarios(ctx,[[m[0],90,125],[m[1],150,125]],900,200);
      resSub(R,"50 + 50 = 100 centavos",30,200,240);glowRes(R);dizer(ctx,"50 + 50 = 100");await esperar(ctx,800)}));
    passos.push(P("Quatro moedas de 25 centavos também formam 1 real: 25 + 25 + 25 + 25 = 100.",4000,async(ctx,R)=>{
      R.box.innerHTML="";cofre(R);const m=[0,1,2,3].map(()=>nd(R,"moeda",25,10,-60,52,52));
      await voarVarios(ctx,m.map((e,i)=>[e,40+i*58,20]),900,250);await voarVarios(ctx,m.map((e,i)=>[e,50+i*58,128]),800,150);
      resSub(R,"25 + 25 + 25 + 25 = 100 centavos",10,200,280);glowRes(R);dizer(ctx,"25 + 25 + 25 + 25 = 100");await esperar(ctx,700)}));
    passos.push(P("Em dinheiro, a vírgula separa os reais dos centavos: R$ 2,30 são 2 reais e 30 centavos.",4500,async(ctx,R)=>{
      R.box.innerHTML="";const v=criar(R.box,"R$ 2,30","pm-pacote bgn",10,-60,150,52),r=criar(R.box,"2 reais","pm-pacote bgn",10,-60,110,44),c=criar(R.box,"30 centavos","pm-pacote bgn",10,-60,130,44);
      await voarVarios(ctx,[[v,75,14]],1000);
      criar(R.box,"antes da vírgula","pm-txt pm-pop",10,74,120,30);criar(R.box,"depois da vírgula","pm-txt pm-pop",150,74,140,30);
      await voarVarios(ctx,[[r,20,110],[c,150,110]],1100,300);
      resSub(R,"R$ 2,30 = 2 reais e 30 centavos",10,170,280);glowRes(R);dizer(ctx,"R$ 2,30 = 2 reais + 30 centavos");await esperar(ctx,800)},{vírgula:"separa os reais (antes) dos centavos (depois)"}));
    passos.push(P("Para somar valores, alinhe a vírgula: reais com reais e centavos com centavos. R$ 1,50 + R$ 2,30 = R$ 3,80.",4800,async(ctx,R)=>{
      R.box.innerHTML="";cofre(R);const a=criar(R.box,"R$ 1,50","pm-pacote bgn",10,-60,110,44),b=criar(R.box,"R$ 2,30","pm-pacote bgn",10,-60,110,44),m=criar(R.box,"+","pm-op pm-mini",10,-60,30,40);
      await voarVarios(ctx,[[a,20,20],[m,134,24],[b,170,20]],1100,300);
      criar(R.box,"1 + 2 = 3 reais · 50 + 30 = 80 centavos","pm-txt pm-pop",10,126,280,40);await esperar(ctx,1000);
      resSub(R,"R$ 1,50 + R$ 2,30 = R$ 3,80",20,190,260);glowRes(R);dizer(ctx,"1,50 + 2,30 = 3,80");await esperar(ctx,700)}));
    passos.push(P(`Para juntar valores, some: uma nota de R$ ${a} e uma de R$ ${b} valem ${a} + ${b} = ${custo} reais.`,4500,async(ctx,R)=>{
      R.box.innerHTML="";cofre(R);const n1=nd(R,"nota",a,10,-60,112,56),n2=nd(R,"nota",b,10,-60,112,56);
      await voarVarios(ctx,[[n1,24,20],[n2,164,20]],1000,300);await voarVarios(ctx,[[n1,30,122],[n2,158,122]],900,200);
      resSub(R,`R$ ${a} + R$ ${b} = R$ ${custo}`,30,200,240);glowRes(R);dizer(ctx,`${a} + ${b} = ${custo}`);await esperar(ctx,800)}));
    passos.push(P(`Você pagou R$ ${pago} por algo de R$ ${custo}. Conte de ${custo} até ${pago}: faltam ${t}. O troco é R$ ${t}!`,5000,async(ctx,R)=>{
      R.box.innerHTML="";const nota=nd(R,"nota",pago,10,-60,112,56),pr=criar(R.box,`custa ${custo}`,"pm-pacote bgn",10,-60,110,40),tr=criar(R.box,String(t),"pm-d cd pm-mini",10,-60,44,40);
      await voarVarios(ctx,[[nota,20,20],[pr,150,26]],1000,300);await voarVarios(ctx,[[tr,226,78]],1200);tr.classList.add("pm-glow");
      criar(R.box,`R$ ${custo} + R$ ${t} = R$ ${pago}`,"pm-txt pm-res pm-pop",20,128,260,40);
      criar(R.box,`troco = R$ ${t}`,"pm-txt pm-res pm-pop",60,184,180,44);glowRes(R);dizer(ctx,`troco = R$ ${t}`);await esperar(ctx,900)}));
    passos.push(P("Com centavos é igual: pagou R$ 10,00 por R$ 7,50? Conte de 7,50 até 10,00: 50 centavos + 2 reais. O troco é R$ 2,50.",5000,async(ctx,R)=>{
      R.box.innerHTML="";const pr=criar(R.box,"custa R$ 7,50","pm-pacote bgn",10,-60,130,40),pg=criar(R.box,"pagou R$ 10,00","pm-pacote bgn",10,-60,130,40);
      await voarVarios(ctx,[[pr,10,20],[pg,160,20]],1000,300);
      criar(R.box,"7,50 → 8,00 = 50 centavos","pm-txt pm-pop",10,84,280,34);await esperar(ctx,900);criar(R.box,"8,00 → 10,00 = 2 reais","pm-txt pm-pop",10,124,280,34);await esperar(ctx,900);
      criar(R.box,"R$ 10,00 − R$ 7,50 = R$ 2,50","pm-txt pm-res pm-pop",10,170,280,40);glowRes(R);dizer(ctx,"troco = R$ 2,50");await esperar(ctx,700)}));
    return{montar:ctx=>({box:novaCena(ctx,W,H)}),passos};
  },
  /* ---------- Lote C: tabelas e gráficos ---------- */
  tabelas(){
    const W=300,H=300,k=300/320,passos=[];
    const T1={tipo:"tabela",titulo:"Pokémon capturados",cols:["Pokémon","Quantidade"],linhas:[["Pikachu",4],["Eevee",6],["Squirtle",3]]};
    const T2={tipo:"tabela",titulo:"Capturas em cada dia",cols:["Pokémon","Segunda","Terça","Quarta"],linhas:[["Pikachu",3,5,2],["Eevee",4,1,6]]};
    const C={tipo:"colunas",titulo:"Pokémon capturados",passo:2,max:10,itens:[{nome:"Pikachu",cor:"#f7d02c",n:8},{nome:"Eevee",cor:"#b0845a",n:5},{nome:"Squirtle",cor:"#5aa0f0",n:6}]};
    const limpaRes=R=>R.box.querySelectorAll(".pm-res").forEach(e=>e.remove());
    passos.push(P("Uma tabela guarda informações em linhas e colunas. Esta mostra quantos Pokémon foram capturados.",4500,async(ctx,R)=>{
      const t=svgBox(R,svgTabela(T1),0,-190,300);await voarVarios(ctx,[[t,0,12]],1500);
      resSub(R,"tabela = linhas e colunas",40,176,220);glowRes(R);dizer(ctx,"linhas ↔ e colunas ↕");await esperar(ctx,900)},
      {tabela:"organiza informações em linhas e colunas",linha:"fica deitada ↔",coluna:"fica em pé ↕"}));
    passos.push(P("Para ler um valor, ache o nome na linha e olhe o número ao lado: Eevee tem 6.",4000,async(ctx,R)=>{
      const g=geoTabela(T1);caixaG(R,4,12+g.y(1)*k,292,g.rH*k);
      await esperar(ctx,900);resSub(R,"Eevee = 6",70,176,160);glowRes(R);dizer(ctx,"Eevee = 6");await esperar(ctx,900)}));
    passos.push(P("Na tabela de dupla entrada, o número fica onde a linha e a coluna se encontram: Pikachu na terça.",4500,async(ctx,R)=>{
      R.box.innerHTML="";const g=geoTabela(T2);svgBox(R,svgTabela(T2),0,12,300,"pm-pop");
      await junto(ctx,async c=>{caixaG(R,4,12+g.y(0)*k,292,g.rH*k);await esperar(c,1000)},async c=>{caixaG(R,g.xs[2]*k,12+g.tH*k,g.ws[2]*k,(g.hH+2*g.rH)*k);await esperar(c,1000)});
      resSub(R,"Pikachu na terça = 5",40,150,220);glowRes(R);dizer(ctx,"linha + coluna = 5");await esperar(ctx,800)},{"dupla entrada":"tabela com linhas e colunas que se cruzam"}));
    passos.push(P("No pictograma, cada ícone vale um tanto. Aqui cada ícone vale 2: 3 ícones valem 3 × 2 = 6.",4500,async(ctx,R)=>{
      R.box.innerHTML="";criar(R.box,"Pikachu","pm-txt pm-pop",6,30,90,40);
      const ic=[0,1,2].map(()=>{const e=criar(R.box,"","pm-ic",100,-70,40,40);e.innerHTML=svgIconeSolo("Pikachu");e.setAttribute("data-icone","1");return e});
      await voarVarios(ctx,ic.map((e,i)=>[e,100+i*48,30]),1200,300);
      criar(R.box,"cada ícone vale 2","pm-txt pm-pop",50,90,200,40);
      resSub(R,"3 × 2 = 6",70,150,160);glowRes(R);dizer(ctx,"3 × 2 = 6");await esperar(ctx,800)},{pictograma:"gráfico feito de ícones; cada um vale um número"}));
    passos.push(P("No gráfico de colunas, quanto mais alta a coluna, maior a quantidade.",4000,async(ctx,R)=>{
      R.box.innerHTML="";const b=svgBox(R,svgColunas(C),0,0,300);
      await crescer(ctx,[...b.querySelectorAll("[data-barra]")],"y",1800);
      resSub(R,"coluna mais alta = mais Pokémon",20,208,260);glowRes(R);dizer(ctx,"coluna alta = quantidade maior");await esperar(ctx,700)}));
    passos.push(P("Para ler uma coluna, siga a altura dela até a régua: a coluna do Pikachu chega ao 8.",4500,async(ctx,R)=>{
      const g=geoColunas(C),l=document.createElement("i");l.className="pm-linhaG";l.style.cssText=`left:${g.left*k}px;top:${g.y(8)*k}px;width:${(g.x(0)+g.bw-g.left)*k}px`;R.box.append(l);
      await esperar(ctx,1200);resSub(R,"Pikachu = 8",70,208,160);glowRes(R);dizer(ctx,"Pikachu = 8");await esperar(ctx,900)}));
    passos.push(P("Para comparar, subtraia: 8 − 5 = 3. Para o total, some tudo: 8 + 5 + 6 = 19.",5000,async(ctx,R)=>{
      limpaRes(R);criar(R.box,"8 − 5 = 3 a mais","pm-txt pm-res pm-pop",40,206,220,40);await esperar(ctx,1400);
      criar(R.box,"8 + 5 + 6 = 19","pm-txt pm-res pm-pop",40,250,220,40);glowRes(R);dizer(ctx,"comparar: subtrair · total: somar");await esperar(ctx,1200)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H);semLegenda(ctx);return{box}},passos};
  },
  /* ---------- Lote C: acaso e probabilidade ---------- */
  acaso(){
    const W=300,H=310,passos=[],pos=geoUrna(8).map(p=>({x:40+p.x-10.5,y:50+p.y-10.5}));
    const limpaQ=R=>R.box.querySelectorAll(".pm-quest").forEach(e=>e.remove());
    const urna=R=>svgBox(R,svgUrna([]),40,50,220,"pm-pop");
    const encher=async(ctx,R,cor,idx,dur)=>{const bs=idx.map(()=>bolaG(R,cor,130,-40));await voarVarios(ctx,bs.map((e,i)=>[e,pos[idx[i]].x,pos[idx[i]].y]),dur||1300,250);return bs};
    passos.push(P("Vamos encher a urna com 5 bolinhas azuis. Se tirarmos uma, só pode sair azul: isso é certo!",4500,async(ctx,R)=>{
      urna(R);await encher(ctx,R,"azul",[0,1,2,3,4],1200);
      resSub(R,"certo: só tem azul",40,234,220);glowRes(R);dizer(ctx,"só azul = certo");await esperar(ctx,500)},{certo:"vai acontecer com certeza"}));
    passos.push(P("E tirar uma bolinha vermelha? Não há nenhuma vermelha na urna: isso é impossível!",4000,async(ctx,R)=>{
      const q=criar(R.box,"🔴 ✖","pm-txt pm-mini pm-pop pm-quest",220,8,70,40);await esperar(ctx,1200);
      resSub(R,"impossível: nenhuma vermelha",20,234,260);glowRes(R);dizer(ctx,"sem vermelha = impossível");await esperar(ctx,900)},{"impossível":"não tem como acontecer"}));
    passos.push(P("Pomos 2 bolinhas vermelhas. Agora sair azul é possível: pode sair azul ou vermelha.",4500,async(ctx,R)=>{
      limpaQ(R);await encher(ctx,R,"vermelha",[5,6],1200);
      resSub(R,"possível: pode sair azul ou vermelha",10,234,280);glowRes(R);dizer(ctx,"azul ou vermelha = possível");await esperar(ctx,700)},{"possível":"pode acontecer ou não"}));
    passos.push(P("Mais uma azul: 6 azuis e 2 vermelhas. Quanto mais bolinhas da cor, mais chance de sair.",5000,async(ctx,R)=>{
      await encher(ctx,R,"azul",[7],1000);R.box.querySelectorAll(".pm-res").forEach(e=>e.remove());
      criar(R.box,"azul = 6: mais provável","pm-txt pm-res pm-pop",20,230,260,36);await esperar(ctx,1400);
      criar(R.box,"vermelha = 2: menos provável","pm-txt pm-res pm-pop",20,268,260,36);glowRes(R);dizer(ctx,"mais bolinhas = mais chance");await esperar(ctx,700)},{provável:"que tem mais chance de acontecer"}));
    passos.push(P("Olhe as 6 faces do dado: pode sair 1, 2, 3, 4, 5 ou 6. São 6 resultados possíveis.",4500,async(ctx,R)=>{
      R.box.innerHTML="";const dd=svgBox(R,svgDadoTodos(),30,4,240);
      const fs=[...dd.querySelectorAll("[data-face]")];fs.forEach(f=>f.style.opacity="0");
      for(const f of fs){f.style.opacity="1";f.style.transition="opacity .25s";await esperar(ctx,260)}
      const ch=[1,2,3,4,5,6].map(n=>criar(R.box,String(n),"pm-d cn pm-mini",20+(n-1)*44,-60,40,40));
      await voarVarios(ctx,ch.map((e,i)=>[e,20+i*44,170]),1000,200);
      resSub(R,"6 resultados possíveis",30,222,240);glowRes(R);dizer(ctx,"dado: 6 resultados");await esperar(ctx,500)},{"resultados possíveis":"tudo o que pode sair"}));
    passos.push(P("Uma moeda tem cara e coroa. São 2 resultados possíveis.",4000,async(ctx,R)=>{
      R.box.innerHTML="";svgBox(R,svgMoedaSorte(),20,10,260,"pm-pop");
      const ch=["cara","coroa"].map(n=>criar(R.box,n,"pm-pacote bgn",20,-60,90,40));
      await voarVarios(ctx,ch.map((e,i)=>[e,45+i*120,150]),1200,300);
      resSub(R,"2 resultados possíveis",30,210,240);glowRes(R);dizer(ctx,"moeda: 2 resultados");await esperar(ctx,500)}));
    passos.push(P("Na roleta, cada parte é uma chance. A cor azul ocupa 2 partes: tem 2 chances de sair.",4500,async(ctx,R)=>{
      R.box.innerHTML="";const r=svgBox(R,svgRoleta(["azul","vermelha","azul","verde"]),50,0,200,"pm-pop");
      await esperar(ctx,900);[0,2].forEach(i=>{const e=r.querySelector(`[data-setor="${i}"]`);if(e){e.setAttribute("stroke","#16224a");e.setAttribute("stroke-width","6")}});
      resSub(R,"azul: 2 chances",50,210,200);glowRes(R);dizer(ctx,"azul = 2 chances");await esperar(ctx,900)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H);semLegenda(ctx);return{box}},passos};
  },
  /* ---------- 12 ÷ 3: frutas nos pratos ---------- */
  divide(t,p){
    const c=t/p,W=300,H=250,sp=Math.min(26,Math.floor(288/t)),px=k=>(W-p*88)/2+k*88,passos=[];
    passos.push(P(`Temos ${t} frutas para repartir em ${p} pratos.`,4500,async(ctx,R)=>{
      R.op.style.opacity=1;R.ig.style.opacity=1;await voarVarios(ctx,[[R.e1,40,0],[R.e2,140,0]],1500);
      R.pratos=Array.from({length:p},(_,k)=>{const d=document.createElement("i");d.className="pm-prato pm-pop";d.style.cssText=`left:${px(k)}px;top:130px;width:80px;height:80px`;R.box.append(d);return d});
      await voarVarios(ctx,R.frutas.map((e,i)=>[e,6+i*sp,70]),900,110)},{dividir:"repartir em partes iguais"}));
    for(let r=0;r<c;r++)passos.push(P(r===0?"Vamos repartir uma por vez, igualmente: uma fruta em cada prato.":r===c-1?"Última rodada! Agora todas as frutas foram repartidas.":"Mais uma rodada: outra fruta em cada prato.",4000,async(ctx,R)=>{
      await voarVarios(ctx,Array.from({length:p},(_,k)=>[R.frutas[r*p+k],px(k)+8+(r%3)*24,142+Math.floor(r/3)*24]),1000,450);dizer(ctx,`${(r+1)*p} de ${t} frutas repartidas`)}));
    passos.push(P(`Cada prato ficou com ${c} frutas.`,3500,async(ctx,R)=>{
      R.cont=[];for(let k=0;k<p;k++){R.cont.push(criar(R.box,String(c),"pm-d cn pm-pop",px(k)+12,98,56,40));await esperar(ctx,700)}dizer(ctx,`${c} em cada prato`)}));
    passos.push(P(`${t} ÷ ${p} = ${c}!`,4000,async(ctx,R)=>{
      const u=R.cont[0],cl=criar(R.box,String(c),"pm-d cn",u._x,u._y,56,40);await voarVarios(ctx,[[cl,R.slot.x,R.slot.y]],1800);cl.remove();
      criar(R.box,String(c),"pm-d cn pm-res pm-pop",R.slot.x,R.slot.y,60,56);glowRes(R);dizer(ctx,`${t} ÷ ${p} = ${c}`);await esperar(ctx,1000)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H),R=Object.assign(expressaoCena(ctx,box,t,"÷",p),{W});
      R.frutas=Array.from({length:t},(_,i)=>criar(box,"🍎","pm-fruta",6+i*sp,-60));return R},passos};
  }
};

/* ---- tela da explicação e controles ---- */
function htmlExplica(){
  const f=FS.fase;
  return `<div class="faseTop"><button class="lin" onclick="voltarTrilha()">← Trilha</button><b>${f.icone} ${f.titulo}</b></div>
  <div class="dots" id="exp-dots"></div>
  <div class="pyriBox"><div class="pyriAv foto" aria-label="Pyri"><img src="${IMG(PYRI_ID)}" alt="Pyri"></div><div class="balao" id="exp-fala"></div></div>
  <div class="termos" id="exp-termos"></div>
  <div class="pm-repr" id="exp-repr" style="display:none"><span>Imagens:</span><button data-r="dourado" onclick="trocarRepr('dourado')">🧊 Material dourado</button><button data-r="macas" onclick="trocarRepr('macas')">🍎 Maçãs</button></div>
  <div class="palcoExp" id="exp-stage"></div>
  <div class="pm-passo" id="exp-passo"></div>
  <div class="pm-ctrl">
    <button class="pm-bt" id="exp-rep" onclick="repetirPasso()">↻ Repetir</button>
    <button class="pm-bt" id="exp-pausa" onclick="pausar()">⏸ Pausar</button>
    <button class="pm-bt" id="exp-ant" onclick="passoMenos()">◀ Anterior</button>
    <button class="pm-bt pm-bt-prox" id="exp-prox" onclick="passoMais()">Próximo ▶</button>
  </div>
  <button class="lin pm-pular" onclick="irExercicios()">${typeof sessaoRetomavel==="function"&&sessaoRetomavel()?"Voltar aos exercícios":"Já sei! Ir para os exercícios"}</button>`;
}
function roteiroDaFase(f){const [nome,...args]=f.roteiro;return ROT[nome](...args)}
async function mostrarPasso(){
  const f=FS.fase;if(!f||!$("#exp-stage"))return;garantirEstilos();
  FS.anims.forEach(a=>{try{a.cancel()}catch(_){}});FS.anims=[];FS.tok++;const tok=FS.tok;
  const rot=FS.rot||(FS.rot=roteiroDaFase(f)),i=FS.passo,n=rot.passos.length,p=rot.passos[i];
  $("#exp-fala").textContent=p.fala;
  $("#exp-termos").innerHTML=Object.entries(p.termos||{}).map(([k,v])=>`<span>📘 <b>${k}</b>: ${v}</span>`).join("");
  $("#exp-dots").innerHTML=rot.passos.map((_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("");
  $("#exp-passo").textContent=`Passo ${i+1} de ${n}`;
  $("#exp-ant").disabled=i===0;$("#exp-prox").textContent=i===n-1?"Praticar 🚀":"Próximo ▶";$("#exp-prox").classList.remove("pm-destaque");
  $("#exp-pausa").textContent=FS.pausado?"▶ Continuar":"⏸ Pausar";
  const sel=$("#exp-repr");if(sel){sel.style.display=rot.repr?"flex":"none";sel.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.r===FS.repr))}
  const ctx={stage:$("#exp-stage"),instant:true,gasto:0};
  try{
    const R=rot.montar(ctx);
    for(let k=0;k<i;k++)await rot.passos[k].acao(ctx,R);          // estado até o passo anterior, sem esperar
    ctx.instant=false;ctx.gasto=0;
    await p.acao(ctx,R);
    if(ctx.gasto<p.dur)await esperar(ctx,p.dur-ctx.gasto);        // cada passo dura de 3 a 5 s
    if(FS.log)FS.log.push({i,gasto:ctx.gasto});                    // gancho de verificação (usado nos testes)
    if(i<n-1)await esperar(ctx,1000);                             // 1 s de pausa entre os passos
    if(tok!==FS.tok)return;
    if(i<n-1&&FS.auto){FS.passo=i+1;mostrarPasso()}else if($("#exp-prox"))$("#exp-prox").classList.add("pm-destaque");
  }catch(e){if(e!=="cancel")console.error(e)}
}
const passoMais=()=>{const n=roteiroDaFase(FS.fase).passos.length;if(FS.passo<n-1){FS.passo++;mostrarPasso()}else irExercicios()};
const passoMenos=()=>{if(FS.passo>0){FS.passo--;mostrarPasso()}};
const repetirPasso=()=>{FS.pausado=false;mostrarPasso()};
const trocarRepr=r=>{FS.repr=r;mostrarPasso()};
function pausar(){
  FS.pausado=!FS.pausado;FS.anims.forEach(a=>{try{FS.pausado?a.pause():a.play()}catch(_){}});
  const b=$("#exp-pausa");if(b)b.textContent=FS.pausado?"▶ Continuar":"⏸ Pausar";
}
