/* Explicações animadas com o Pyri.
   - Cores fixas por casa: unidades azul, dezenas verde, centenas laranja, milhares roxo (em todas as fases).
   - Uma ação por vez; cada passo dura de 3 a 5 s e há 1 s de pausa entre os passos.
   - Os números sempre VIAJAM em curva até o lugar onde são usados (nunca aparecem prontos).
   - Com “reduzir movimento”: mesmo passo a passo, com troca de cor e destaque, sem o voo.
   - Botões: Repetir, Pausar, Anterior e Próximo. */
const FS={vista:"trilha",fase:null,nivel:"bronze",passo:0,ses:null,tok:0,vel:1,pausado:false,anims:[],auto:true,rot:null};
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
@keyframes pm-tremer{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`;
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
  const disp=ctx.stage.clientWidth-16;if(disp>0&&disp<W){const k=disp/W;ctx.box.style.transform=`scale(${k})`;ctx.box.style.transformOrigin="top center";ctx.box.style.marginBottom=`${(k-1)*H}px`}
  return ctx.box;
}
const dizer=(ctx,t)=>{ctx.cap.textContent=t};
const glowRes=R=>R.box.querySelectorAll(".pm-res").forEach(e=>e.classList.add("pm-glow"));
const P=(fala,dur,acao,termos)=>({fala,dur,acao,termos});

/* conta armada: linhas = vai-um(0), a(1), b(2), traço(3), resultado(4); colunas da esquerda para a direita */
function armada(ctx,op,a,b){
  const res=op==="+"?a+b:a-b,sa=String(a),sb=String(b),sr=String(res),cols=Math.max(sa.length,sb.length,sr.length);
  const X=c=>(c+1)*CW,Y=r=>r*RH,W=(cols+1)*CW,H=5*RH,box=novaCena(ctx,W,H),R={box,cols,X,Y,res,a:{},b:{},clones:{}};
  const fila=(s,row,obj,dx)=>[...s].forEach((d,i)=>{const c=cols-s.length+i,k=cols-1-c,e=criar(box,d,"pm-d "+clsPos(k),X(c)+dx,-70);e._fx=X(c);e._fy=Y(row);e.dataset.k=k;obj[k]=e});
  fila(sa,1,R.a,-50);fila(sb,2,R.b,50);
  R.sinal=criar(box,maisTxt(op),"pm-op",X(-1),Y(2));R.sinal.style.opacity=0;
  R.linhaEl=document.createElement("i");R.linhaEl.className="pm-linha";R.linhaEl.style.cssText=`left:0;top:${3*RH+3}px;width:${W}px;opacity:0`;box.append(R.linhaEl);
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
    const s=String(n),L=s.length,W=300,H=250,vals=[...s].map((d,i)=>d+"0".repeat(L-1-i)),kk=i=>L-1-i,cx=i=>(W-L*88)/2+i*88;
    return{montar:ctx=>{const box=novaCena(ctx,W,H),R={box,dig:[],casas:[],termos:[]};
      [...s].forEach((d,i)=>{const e=criar(box,d,"pm-d "+clsPos(kk(i)),cx(i)+13,-70);e._fx=cx(i)+13;e._fy=50;R.dig.push(e)});return R},
     passos:[
      P("Cada algarismo mora em uma casa. As casas têm nomes e cada uma tem a sua cor!",4500,async(ctx,R)=>{
        R.casas=[...s].map((_,i)=>{const c=document.createElement("div");c.className="pm-casa pm-pop "+clsPos(kk(i));c.style.cssText=`left:${cx(i)}px;top:30px;width:80px;height:100px`;
          c.innerHTML=`<small>${nomePos(kk(i))}</small>`;R.box.append(c);return c});
        await esperar(ctx,700);await voarVarios(ctx,R.dig.map(e=>[e,e._fx,e._fy]),1600,250)},
        {unidades:"os números soltos, de 0 a 9",dezenas:"grupos de 10",centenas:"grupos de 100"}),
      ...[...s].map((d,i)=>P(`O ${d} está na casa das ${nomePos(kk(i))}. Ele vale ${vals[i]}.`,4000,async(ctx,R)=>{
        const e=R.dig[i],tx=20+i*92;
        if(i>0){const m=criar(R.box,"+","pm-op pm-pop",tx-30,180);R.termos.push(m)}
        const cl=criar(R.box,d,"pm-d "+clsPos(kk(i)),e._x,e._y);e.classList.add("pm-dest");await esperar(ctx,700);
        await voarVarios(ctx,[[cl,tx,180]],1800);cl.textContent=vals[i];cl.style.width="84px";cl.classList.add("pm-res","pm-pop");R.termos.push(cl);
        e.classList.remove("pm-dest");dizer(ctx,`${d} ${nomePos(kk(i))} = ${vals[i]}`);await esperar(ctx,900)})),
      P(`Então ${n} = ${vals.join(" + ")}! Quanto mais à esquerda, maior o valor.`,3500,async(ctx,R)=>{glowRes(R);dizer(ctx,`${n} = ${vals.join(" + ")}`);await esperar(ctx,2000)})
    ]};
  },
  /* ---------- 23 + 12: sem vai-um, coluna por coluna ---------- */
  soma(a,b){
    const res=a+b,cols=Math.max(String(a).length,String(b).length,String(res).length),passos=[];
    passos.push(P(`Vamos somar ${a} + ${b}. Cada algarismo tem a cor da sua casa.`,4000,async(ctx,R)=>{await entradaOperandos(ctx,R)},
      {unidades:"a casa da direita, dos números soltos",dezenas:"grupos de 10"}));
    for(let k=0;k<cols;k++){
      const da=digitoDe(a,k),db=digitoDe(b,k);if(da==null&&db==null)continue;const s=(da||0)+(db||0),nome=nomePos(k);
      passos.push(P(`Agora as ${nome}: o ${da==null?0:da} e o ${db==null?0:db} viajam até o resultado.`,4000,async(ctx,R)=>{
        const A=R.a[k],B=R.b[k],orig=[A,B].filter(Boolean);orig.forEach(e=>e.classList.add("pm-dest"));await esperar(ctx,800);
        const d=R.dest(k),cl=orig.map(e=>criar(R.box,e.textContent,"pm-d "+clsPos(k),e._x,e._y));
        await voarVarios(ctx,cl.map((c,i)=>[c,d.x+(i?12:-12),d.y]),1800);R.clones[k]=cl;orig.forEach(e=>e.classList.remove("pm-dest"))}));
      passos.push(P(`${da==null?0:da} + ${db==null?0:db} = ${s}. O ${s} fica na coluna das ${nome}.`,3500,async(ctx,R)=>{
        R.clones[k].forEach(c=>c.remove());const d=R.dest(k);criar(R.box,String(s),"pm-d pm-res pm-pop "+clsPos(k),d.x,d.y);
        dizer(ctx,`${da==null?0:da} + ${db==null?0:db} = ${s}`);await esperar(ctx,1600)}));
    }
    passos.push(P(`O resultado é ${res}! Confira: ${a} + ${b} tem que dar mais que ${a}.`,3500,async(ctx,R)=>{glowRes(R);dizer(ctx,`${a} + ${b} = ${res}`);await esperar(ctx,2000)}));
    return{montar:ctx=>armada(ctx,"+",a,b),passos};
  },
  /* ---------- 8 + 5: completar 10 e “vai um” ---------- */
  vaiUm(a,b){
    const falta=10-a,sobra=b-falta,res=a+b;
    return{montar:ctx=>armada(ctx,"+",a,b),passos:[
      P(`Vamos somar ${a} + ${b}. Os dois são unidades, por isso são azuis.`,4000,async(ctx,R)=>{await entradaOperandos(ctx,R)},{unidades:"os números soltos"}),
      P(`O ${b} se divide em ${falta} e ${sobra}.`,3500,async(ctx,R)=>{
        const B=R.b[0];B.style.opacity=.25;R.cF=criar(R.box,String(falta),"pm-chip bgu",B._fx,B._fy+8);R.cS=criar(R.box,String(sobra),"pm-chip bgu",B._fx,B._fy+8);
        await voarVarios(ctx,[[R.cF,B._fx-34,B._fy+8],[R.cS,B._fx+34,B._fy+8]],1500);dizer(ctx,`${b} = ${falta} + ${sobra}`);await esperar(ctx,800)}),
      P(`O ${a} pega o ${falta} para formar 10.`,4000,async(ctx,R)=>{
        const A=R.a[0];await voarVarios(ctx,[[R.cF,A._fx+30,A._fy+8]],1600);R.cF.remove();A.style.opacity=.25;
        R.pac=criar(R.box,"10","pm-pac bgd pm-pop",A._fx+4,A._fy+6);dizer(ctx,`${a} + ${falta} = 10`);await esperar(ctx,1500)}),
      P(`10 unidades formam 1 dezena! Esse pacote verde voa para a coluna das dezenas. É o “vai um”.`,4500,async(ctx,R)=>{
        R.pac.textContent="1";R.pac.classList.add("pm-pop");await esperar(ctx,800);await voarVarios(ctx,[[R.pac,R.X(0)+4,R.Y(0)+6]],1800);dizer(ctx,"vai 1 dezena")},
        {"vai um":"o pacote de 10 que viaja para a casa ao lado"}),
      P(`Sobraram ${sobra} unidades. O ${sobra} viaja até o resultado, na coluna das unidades.`,4000,async(ctx,R)=>{
        const d=R.dest(0);await voarVarios(ctx,[[R.cS,d.x,d.y]],1800);R.cS.remove();criar(R.box,String(sobra),"pm-d pm-res pm-pop cu",d.x,d.y);await esperar(ctx,800)}),
      P("A dezena que veio desce para o resultado: 1 dezena.",4000,async(ctx,R)=>{
        const d=R.dest(1);await voarVarios(ctx,[[R.pac,d.x,d.y]],1800);R.pac.remove();criar(R.box,"1","pm-d pm-res pm-pop cd",d.x,d.y);await esperar(ctx,800)}),
      P(`${a} + ${b} = ${res}!`,3500,async(ctx,R)=>{glowRes(R);dizer(ctx,`${a} + ${b} = ${res}`);await esperar(ctx,2000)})
    ]};
  },
  /* ---------- 32 − 15: empréstimo ---------- */
  subEmp(a,b){
    const t1=Math.floor(a/10),u1=a%10,t2=Math.floor(b/10),u2=b%10,res=a-b,dozes=10+u1,ru=dozes-u2,rd=t1-1-t2;
    return{montar:ctx=>armada(ctx,"-",a,b),passos:[
      P(`Vamos calcular ${a} − ${b}. Começamos pelas unidades: ${u1} menos ${u2}.`,4000,async(ctx,R)=>{await entradaOperandos(ctx,R)}),
      P(`${u1} − ${u2}: não dá! ${u1} é menor que ${u2}.`,3500,async(ctx,R)=>{
        [R.a[0],R.b[0]].forEach(e=>e.classList.add("pm-erro"));dizer(ctx,`${u1} − ${u2} ?`);await esperar(ctx,1600)}),
      P(`Vamos pegar uma dezena emprestada do ${t1}.`,4500,async(ctx,R)=>{
        [R.a[0],R.b[0]].forEach(e=>e.classList.remove("pm-erro"));const T=R.a[1];
        R.pac=criar(R.box,"1","pm-pac bgd pm-pop",T._fx+4,T._fy+4);T.classList.add("pm-risc");
        R.novo=criar(R.box,String(t1-1),"pm-d cd pm-mini pm-pop",T._fx,R.Y(0)+6);await esperar(ctx,800);
        await voarVarios(ctx,[[R.pac,R.a[0]._fx+4,R.Y(0)+4]],1800);dizer(ctx,`${t1} dezenas viram ${t1-1} e 1 dezena emprestada`)},{"emprestar":"pegar uma dezena da casa ao lado"}),
      P(`Essa dezena se parte em 10 unidades. Agora temos ${dozes} unidades!`,4000,async(ctx,R)=>{
        R.pac.className="pm-cel pm-pac bgu pm-pop";R.pac.textContent="10";await esperar(ctx,1200);R.pac.remove();R.a[0].style.opacity=.3;
        R.doze=criar(R.box,String(dozes),"pm-d cu pm-pop",R.a[0]._fx,R.Y(0)+4);dizer(ctx,`10 + ${u1} = ${dozes}`);await esperar(ctx,1200)}),
      P(`Agora ${dozes} − ${u2} = ${ru}. Os números viajam até o resultado.`,4500,async(ctx,R)=>{
        const d=R.dest(0),cb=criar(R.box,String(u2),"pm-d cu",R.b[0]._x,R.b[0]._y);R.b[0].classList.add("pm-dest");
        await voarVarios(ctx,[[R.doze,d.x-12,d.y],[cb,d.x+12,d.y]],1800);R.doze.remove();cb.remove();R.b[0].classList.remove("pm-dest");
        criar(R.box,String(ru),"pm-d pm-res pm-pop cu",d.x,d.y);dizer(ctx,`${dozes} − ${u2} = ${ru}`);await esperar(ctx,1000)}),
      P(`Agora as dezenas: sobrou ${t1-1} e vamos tirar ${t2}. ${t1-1} − ${t2} = ${rd}.`,4500,async(ctx,R)=>{
        const d=R.dest(1),cb=criar(R.box,String(t2),"pm-d cd",R.b[1]._x,R.b[1]._y);R.b[1].classList.add("pm-dest");
        await voarVarios(ctx,[[R.novo,d.x-12,d.y],[cb,d.x+12,d.y]],1800);R.novo.remove();cb.remove();R.b[1].classList.remove("pm-dest");
        criar(R.box,String(rd),"pm-d pm-res pm-pop cd",d.x,d.y);dizer(ctx,`${t1-1} − ${t2} = ${rd}`);await esperar(ctx,1000)}),
      P(`O resultado é ${res}! Para conferir: ${res} + ${b} = ${a}.`,3500,async(ctx,R)=>{glowRes(R);dizer(ctx,`${a} − ${b} = ${res}`);await esperar(ctx,2000)})
    ]};
  },
  /* ---------- 3 × 4: grupos de bolinhas ---------- */
  mult(g,c){
    const res=g*c,W=300,H=80+g*46,dx=j=>26+j*34,dy=r=>86+r*46,lista=Array.from({length:g},(_,i)=>(i+1)*c);
    const passos=[P(`Vamos calcular ${g} × ${c}. Isso quer dizer ${g} grupos de ${c} bolinhas.`,4000,async(ctx,R)=>{
      R.op.style.opacity=1;R.ig.style.opacity=1;await voarVarios(ctx,[[R.e1,40,0],[R.e2,140,0]],1600);
      R.caixas=Array.from({length:g},(_,i)=>{const b=document.createElement("i");b.className="pm-caixa pm-pop";b.style.cssText=`left:${dx(0)-10}px;top:${dy(i)-8}px;width:${c*34+16}px;height:42px`;R.box.append(b);return b});
      await esperar(ctx,900)},{parcelas:"as partes iguais que a gente soma"})];
    for(let i=0;i<g;i++)passos.push(P(i===0?`Primeiro grupo: ${c} bolinhas.`:`Grupo ${i+1}: mais ${c} bolinhas.`,4000,async(ctx,R)=>{
      const pts=Array.from({length:c},()=>criar(R.box,"","pm-ponto",W-44,24));R.pontos=(R.pontos||[]).concat(pts);
      await voarVarios(ctx,pts.map((p,j)=>[p,dx(j)+2,dy(i)+4]),1200,260)}));
    passos.push(P(`Contando de ${c} em ${c}: ${lista.join(", ")}.`,Math.min(5000,Math.max(3500,900*g+500)),async(ctx,R)=>{
      R.rot=[];for(let i=0;i<g;i++){const l=criar(R.box,String(lista[i]),"pm-d cn pm-pop",dx(c)+8,dy(i)-6,60,44);R.rot.push(l);dizer(ctx,lista.slice(0,i+1).join(", "));await esperar(ctx,900)}}));
    passos.push(P(`${g} × ${c} = ${res}!`,4000,async(ctx,R)=>{
      const u=R.rot[g-1],cl=criar(R.box,String(res),"pm-d cn",u._x,u._y,60,44);await voarVarios(ctx,[[cl,R.slot.x,R.slot.y]],1800);cl.remove();
      criar(R.box,String(res),"pm-d cn pm-res pm-pop",R.slot.x,R.slot.y,60,56);glowRes(R);dizer(ctx,`${g} × ${c} = ${res}`);await esperar(ctx,1000)}));
    return{montar:ctx=>{const box=novaCena(ctx,W,H);return Object.assign(expressaoCena(ctx,box,g,"×",c),{W,pontos:[]})},passos};
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
  <div class="pyriBox"><div class="pyriAv" aria-label="Pyri">🔥</div><div class="balao" id="exp-fala"></div></div>
  <div class="termos" id="exp-termos"></div>
  <div class="palcoExp" id="exp-stage"></div>
  <div class="pm-passo" id="exp-passo"></div>
  <div class="pm-ctrl">
    <button class="pm-bt" id="exp-rep" onclick="repetirPasso()">↻ Repetir</button>
    <button class="pm-bt" id="exp-pausa" onclick="pausar()">⏸ Pausar</button>
    <button class="pm-bt" id="exp-ant" onclick="passoMenos()">◀ Anterior</button>
    <button class="pm-bt pm-bt-prox" id="exp-prox" onclick="passoMais()">Próximo ▶</button>
  </div>
  <button class="lin pm-pular" onclick="irExercicios()">Já sei! Ir para os exercícios</button>`;
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
  const ctx={stage:$("#exp-stage"),instant:true,gasto:0};
  try{
    const R=rot.montar(ctx);
    for(let k=0;k<i;k++)await rot.passos[k].acao(ctx,R);          // estado até o passo anterior, sem esperar
    ctx.instant=false;ctx.gasto=0;
    await p.acao(ctx,R);
    if(ctx.gasto<p.dur)await esperar(ctx,p.dur-ctx.gasto);        // cada passo dura de 3 a 5 s
    if(i<n-1)await esperar(ctx,1000);                             // 1 s de pausa entre os passos
    if(tok!==FS.tok)return;
    if(i<n-1&&FS.auto){FS.passo=i+1;mostrarPasso()}else if($("#exp-prox"))$("#exp-prox").classList.add("pm-destaque");
  }catch(e){if(e!=="cancel")console.error(e)}
}
const passoMais=()=>{const n=roteiroDaFase(FS.fase).passos.length;if(FS.passo<n-1){FS.passo++;mostrarPasso()}else irExercicios()};
const passoMenos=()=>{if(FS.passo>0){FS.passo--;mostrarPasso()}};
const repetirPasso=()=>{FS.pausado=false;mostrarPasso()};
function pausar(){
  FS.pausado=!FS.pausado;FS.anims.forEach(a=>{try{FS.pausado?a.pause():a.play()}catch(_){}});
  const b=$("#exp-pausa");if(b)b.textContent=FS.pausado?"▶ Continuar":"⏸ Pausar";
}
