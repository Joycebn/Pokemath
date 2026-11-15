/* Player de explicações: o Pyri fala e os números "viajam" pela tela. */
const FS={vista:"trilha",fase:null,passo:0,ses:null,tok:0};
const aguardar=ms=>{const t=FS.tok;return new Promise((ok,er)=>setTimeout(()=>FS.tok===t?ok():er("cancel"),semMov()?0:ms))};
const maisTxt=op=>op==="+"?"+":"−";

async function visConta(stage,{op,a,b,colunas=9,animar=true}){
  const sa=String(a),sb=String(b),res=op==="+"?a+b:a-b,sr=String(res);
  const cols=Math.max(sa.length,sb.length,sr.length),cw=50,rh=54,W=(cols+1)*cw,H=5*rh;
  const P=(r,c)=>`left:${c*cw}px;top:${r*rh}px`;
  const dig=(s,row,id)=>[...s].map((d,i)=>{const c=cols-s.length+i;return `<span class="cel" id="${id}${c}" style="${P(row,1+c)}">${d}</span>`}).join("");
  stage.innerHTML=`<div class="contav" style="width:${W}px;height:${H}px">${dig(sa,1,"a")}${dig(sb,2,"b")}<span class="cel op" style="${P(2,0)}">${maisTxt(op)}</span><i class="linha" style="left:0;top:${3*rh+2}px;width:${W}px"></i></div><p class="cap" id="cap">&nbsp;</p>`;
  const box=stage.querySelector(".contav"),cap=stage.querySelector("#cap");
  const mk=(txt,row,c,cls)=>{const e=document.createElement("span");e.className="cel "+cls;e.style.cssText=P(row,1+c);e.textContent=txt;box.append(e);return e};
  if(!animar){cap.textContent=`${a} ${maisTxt(op)} ${b} = ?`;return}
  let carry=0,feitas=0,completo=true;
  for(let c=cols-1;c>=0;c--){
    const ia=c-(cols-sa.length),ib=c-(cols-sb.length),da=ia>=0?+sa[ia]:0,db=ib>=0?+sb[ib]:0;
    if(ia<0&&ib<0&&!carry)break;
    if(feitas>=colunas){completo=false;break}
    const ea=ia>=0?box.querySelector("#a"+c):null,eb=ib>=0?box.querySelector("#b"+c):null,ec=carry?box.querySelector("#k"+c):null;
    const total=op==="+"?da+db+carry:da-db,d1=op==="+"?total%10:total;
    [ea,eb,ec].forEach(e=>e&&e.classList.add("dest"));
    cap.textContent=op==="+"?`${da} + ${db}${carry?` + ${carry} (o que veio)`:""} = ${total}`:`${da} − ${db} = ${total}`;
    await aguardar(700);
    const voos=[[ea,1],[eb,2],[ec,0]].filter(x=>x[0]).map(([e,row])=>{const f=mk(e.textContent,row,c,"voa");f.dataset.row=row;e.style.opacity=.25;return f});
    void box.offsetHeight;voos.forEach(f=>f.style.transform=`translate(0,${(4-f.dataset.row)*rh}px)`);
    await aguardar(1000);
    voos.forEach(f=>f.remove());mk(String(d1),4,c,"res pop");
    if(op==="+"&&total>=10&&c>0){carry=1;const k=mk("1",0,c-1,"carry pop");k.id="k"+(c-1);cap.textContent+=` → escreve ${d1} e o 1 vai para a casa ao lado`}else carry=0;
    await aguardar(800);feitas++;
  }
  cap.textContent=completo?`${a} ${maisTxt(op)} ${b} = ${res}`:cap.textContent;
}
async function visGrupos(stage,{partes,emoji="🍎"}){
  const sz=38,gap=34,total=partes.reduce((s,x)=>s+x,0);let x=0;const it=[],mais=[];
  partes.forEach((n,gi)=>{for(let i=0;i<n;i++)it.push({x:x+i*sz});x+=n*sz;if(gi<partes.length-1){mais.push(x+gap/2-10);x+=gap}});
  const W=Math.max(x,total*sz),H=4*sz,off=(W-total*sz)/2;
  stage.innerHTML=`<div class="frutas" style="width:${W}px;height:${H}px">${it.map((o,i)=>`<span class="fr" id="fr${i}" style="left:${o.x}px;top:0">${emoji}</span>`).join("")}${mais.map(m=>`<span class="mais" style="left:${m}px;top:0">+</span>`).join("")}</div><p class="cap" id="cap">${partes.join(" + ")}</p>`;
  const cap=stage.querySelector("#cap");await aguardar(900);
  it.forEach((o,i)=>{const e=stage.querySelector("#fr"+i);e.style.transform=`translate(${off+i*sz-o.x}px,${3*sz}px)`});
  await aguardar(1100);cap.textContent=`${partes.join(" + ")} = ${total}`;
}
async function visTirar(stage,{total,tirar,emoji="🍎"}){
  stage.innerHTML=`<div class="frutas" style="width:${total*38}px;height:44px">${Array.from({length:total},(_,i)=>`<span class="fr" id="fr${i}" style="left:${i*38}px;top:0">${emoji}</span>`).join("")}</div><p class="cap" id="cap">${total} frutas</p>`;
  const cap=stage.querySelector("#cap");await aguardar(900);
  for(let i=total-1;i>=total-tirar;i--){stage.querySelector("#fr"+i).classList.add("sai");await aguardar(450)}
  cap.textContent=`${total} − ${tirar} = ${total-tirar}`;
}
async function visIguais(stage,{grupos,cada,emoji="🍎",somar=false}){
  const caixa=()=>`<div class="cx">${emoji.repeat(cada)}</div>`;
  stage.innerHTML=`<div class="iguais">${Array.from({length:grupos},(_,i)=>`<div class="cx" id="cx${i}">${emoji.repeat(cada)}</div>`).join("")}</div><p class="cap" id="cap">${grupos} grupos de ${cada}</p>`;
  if(!somar)return;const cap=stage.querySelector("#cap");await aguardar(700);
  for(let i=0;i<grupos;i++){stage.querySelector("#cx"+i).classList.add("on");cap.textContent=Array(i+1).fill(cada).join(" + ")+(i===grupos-1?` = ${grupos*cada}`:"");await aguardar(700)}
}
async function visReparte(stage,{total,pratos,emoji="🍪"}){
  const iw=34,pw=112,W=Math.max(total*iw,pratos*pw),pt=100;
  const px=k=>(W-pratos*pw)/2+k*pw;
  stage.innerHTML=`<div class="reparte" style="width:${W}px;height:${pt+90}px">${Array.from({length:pratos},(_,k)=>`<span class="prato" style="left:${px(k)}px;top:90px"></span>`).join("")}${Array.from({length:total},(_,i)=>`<span class="fr" id="fr${i}" style="left:${i*iw+(W-total*iw)/2}px;top:0">${emoji}</span>`).join("")}</div><p class="cap" id="cap">${total} biscoitos, ${pratos} pratos</p>`;
  const cap=stage.querySelector("#cap");await aguardar(800);
  for(let i=0;i<total;i++){
    const k=i%pratos,j=Math.floor(i/pratos),e=stage.querySelector("#fr"+i),x0=i*iw+(W-total*iw)/2;
    e.style.transform=`translate(${px(k)+8+(j%3)*30-x0}px,${90+10+Math.floor(j/3)*30}px)`;await aguardar(260)}
  await aguardar(600);cap.textContent=`${total} ÷ ${pratos} = ${total/pratos}`;
}
async function visCasas(stage,{n}){
  const s=String(n),nomes=["centenas","dezenas","unidades"].slice(3-s.length);
  stage.innerHTML=`<div class="casas">${[...s].map((d,i)=>`<div class="casa"><b>${d}</b><small>${nomes[i]}</small></div>`).join("")}</div><p class="cap">${n}</p>`;
}
async function visDecomp(stage,{n}){
  const s=String(n),nomes=["centenas","dezenas","unidades"].slice(3-s.length),partes=[...s].map((d,i)=>d+"0".repeat(s.length-1-i));
  stage.innerHTML=`<div class="casas">${[...s].map((d,i)=>`<div class="casa"><b>${d}</b><small>${nomes[i]}</small></div>`).join("")}</div><div class="decomp" id="dc"></div><p class="cap" id="cap"></p>`;
  const dc=stage.querySelector("#dc"),cap=stage.querySelector("#cap");await aguardar(700);
  for(let i=0;i<partes.length;i++){dc.insertAdjacentHTML("beforeend",`<span class="pop">${i?" + ":""}${partes[i]}</span>`);cap.textContent=`${s[i]} ${nomes[i]} = ${partes[i]}`;await aguardar(900)}
  cap.textContent=`${n} = ${partes.join(" + ")}`;
}
const VIS={conta:visConta,grupos:visGrupos,tirar:visTirar,iguais:visIguais,reparte:visReparte,casas:visCasas,decomp:visDecomp};
const desenharVisual=(stage,v)=>VIS[v.tipo]?VIS[v.tipo](stage,v):Promise.resolve();

/* ---- tela da explicação ---- */
function htmlExplica(){
  const f=FS.fase;
  return `<div class="faseTop"><button class="lin" onclick="voltarTrilha()">← Trilha</button><b>${f.icone} ${f.titulo}</b></div>
  <div class="dots">${f.explicacao.map(()=>`<i></i>`).join("")}</div>
  <div class="pyriBox"><div class="pyriAv" aria-label="Pyri">🔥</div><div class="balao" id="exp-fala"></div></div>
  <div class="termos" id="exp-termos"></div>
  <div class="palcoExp" id="exp-stage"></div>
  <div class="navExp"><button class="sec" id="exp-ant" onclick="passoMenos()">◀ Voltar</button><button class="sec" onclick="repetirPasso()">↻ De novo</button><button class="grande" id="exp-prox" onclick="passoMais()">Próximo ▶</button></div>
  <button class="lin" onclick="irExercicios()">Já sei! Ir para os exercícios</button>`;
}
function mostrarPasso(){
  const f=FS.fase;if(!f||!$("#exp-fala"))return;FS.tok++;
  const p=f.explicacao[FS.passo],n=f.explicacao.length;
  $("#exp-fala").textContent=p.fala;
  $("#exp-termos").innerHTML=Object.entries(p.termos||{}).map(([k,v])=>`<span>📘 <b>${k}</b>: ${v}</span>`).join("");
  document.querySelectorAll(".dots i").forEach((e,i)=>e.classList.toggle("on",i<=FS.passo));
  $("#exp-ant").disabled=FS.passo===0;$("#exp-prox").textContent=FS.passo===n-1?"Vamos praticar! 🚀":"Próximo ▶";
  const st=$("#exp-stage");st.innerHTML="";
  if(p.visual)desenharVisual(st,p.visual).catch(()=>{});
}
const passoMais=()=>{if(FS.passo<FS.fase.explicacao.length-1){FS.passo++;mostrarPasso()}else irExercicios()};
const passoMenos=()=>{if(FS.passo>0){FS.passo--;mostrarPasso()}};
const repetirPasso=()=>mostrarPasso();
