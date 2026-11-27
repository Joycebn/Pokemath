/* Tabuada em trilha: dados, geradores e regras (sem tela). Estado em S.tabT (criado só quando preciso). */
const TAB_TRILHA=[
 ...[2,3,4,5,6,7,8,9].map(n=>({id:"t"+n,n,rot:"×"+n,titulo:"Tabuada do "+n,digitos:1,macete:"tab"+n})),
 {id:"m21",rot:"2×1",titulo:"2 algarismos × 1",digitos:2},
 {id:"m31",rot:"3×1",titulo:"3 algarismos × 1",digitos:2},
 {id:"m22f",rot:"2×2 fácil",titulo:"2 × 2 algarismos (fácil)",digitos:2},
 {id:"m22",rot:"2×2",titulo:"2 × 2 algarismos",digitos:2}];
const TAB_METAS={t:{prata:6,ouro:3},m21:{prata:12,ouro:7},m31:{prata:20,ouro:12},m22f:{prata:15,ouro:9},m22:{prata:30,ouro:20}};
const TAB_MIN={bronze:8,prata:9,ouro:10};
const tabItem=id=>TAB_TRILHA.find(x=>x.id===id);
const _ri=(a,b,r)=>a+Math.floor(r()*(b-a+1));
function tabGerar(it,rnd){
  const r=rnd||Math.random,id=typeof it==="string"?it:it.id,out=[];
  const emb=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  if(/^t\d$/.test(id)){const n=+id.slice(1);return emb(Array.from({length:10},(_,i)=>[n,i+1]))}
  const lim={m21:()=>{let a;do a=_ri(11,99,r);while(a%10===0);return[a,_ri(2,9,r)]},
    m31:()=>{let a;do a=_ri(101,999,r);while(a%10===0);return[a,_ri(2,9,r)]},
    m22f:()=>[_ri(11,30,r),[10,11,12,15,20][_ri(0,4,r)]],
    m22:()=>[_ri(11,99,r),_ri(11,99,r)]}[id];
  const vis=new Set();let g=0;
  while(out.length<10&&g++<500){const p=lim(),k=p.join("x");if(vis.has(k))continue;vis.add(k);out.push(p)}
  return out;
}
function tabMeta(id,nivel){
  const o=S.cfg&&S.cfg.tabMetas&&S.cfg.tabMetas[id];if(o&&typeof o[nivel]==="number")return o[nivel];
  return (TAB_METAS[/^t\d$/.test(id)?"t":id]||TAB_METAS.t)[nivel];
}
function tabAvaliar(id,r){
  const a=r.acertos,m=r.media;
  return{bronze:a>=TAB_MIN.bronze,prata:a>=TAB_MIN.prata&&m<=tabMeta(id,"prata"),ouro:a>=TAB_MIN.ouro&&m<=tabMeta(id,"ouro")};
}
const tabDados=id=>{S.tabT=S.tabT||{};return S.tabT[id]||(S.tabT[id]={niveis:{},sessoes:[]})};
const tabOk=(id,n)=>!!(S.tabT&&S.tabT[id]&&S.tabT[id].niveis&&S.tabT[id].niveis[n]&&S.tabT[id].niveis[n].ok);
function tabEstadoFase(id){
  const i=TAB_TRILHA.findIndex(x=>x.id===id);if(i<0)return"bloqueado";
  if(i>0&&!tabOk(TAB_TRILHA[i-1].id,"bronze"))return"bloqueado";
  return tabOk(id,"ouro")?"concluido":"disponivel";
}
function tabEstadoNivel(id,n){
  if(tabOk(id,n))return"concluido";
  const i=TAB_TRILHA.findIndex(x=>x.id===id);
  if(i>0&&!tabOk(TAB_TRILHA[i-1].id,"bronze"))return"bloqueado";
  const ant={prata:"bronze",ouro:"prata"}[n];if(ant&&!tabOk(id,ant))return"bloqueado";
  const v=S.tabT&&S.tabT[id]&&S.tabT[id].niveis&&S.tabT[id].niveis[n];
  return v&&v.vezes>0?"refazer":"disponivel";
}
function tabRegistrar(id,n,r){
  const d=tabDados(id),media=Math.round(r.media*10)/10,av=tabAvaliar(id,{acertos:r.acertos,media});
  const v=d.niveis[n]||(d.niveis[n]={ok:false,melhor:null,vezes:0});
  v.vezes++;const novo=av[n]&&!v.ok;
  if(av[n]){v.ok=true;v.melhor=v.melhor==null?media:Math.min(v.melhor,media)}
  d.sessoes.push({d:hoje(),acertos:r.acertos,media,nivel:n});
  if(d.sessoes.length>30)d.sessoes=d.sessoes.slice(-30);
  return{ok:av[n],novo,aval:av};
}
function tabEvolucao(id){
  const s=(S.tabT&&S.tabT[id]&&S.tabT[id].sessoes)||[];
  if(!s.length)return{melhor:null,media:null,sessoes:[]};
  const m=s.map(x=>x.media);
  return{melhor:Math.min(...m),media:Math.round(m.reduce((a,b)=>a+b,0)/m.length*10)/10,sessoes:s};
}
/* explicação curta de uma conta de mais algarismos (sem dar o resultado final) */
function tabDecompor(a,b){
  const pv=n=>String(n).split("").map((d,i,arr)=>+d*Math.pow(10,arr.length-1-i)).filter(x=>x>0);
  const pb=pv(b),pa=pv(a);
  if(pb.length>1)return`${a} × ${b} = ${pb.map(p=>a+" × "+p).join(" + ")}`;
  if(pa.length>1)return`${a} × ${b} = ${pa.map(p=>p+" × "+b).join(" + ")}`;
  return`${a} × ${b}: multiplique os algarismos e depois acrescente os zeros`;
}
