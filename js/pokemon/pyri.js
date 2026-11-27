/* Pyri: primeira forma da família Pyron. É o guia do jogo E o companheiro inicial (não há escolha de Pokémon inicial).
   Aqui ficam: o companheiro inicial, o tutorial (nome grande + entrada do Pyri falando) e o botão “Pyri, me explica”. */
const PYRI_ID=900001,PYRELIS_ID=900002,PYRON_ID=900003;      // ids próprios (a PokéAPI só vai até 1025)
const PYRI_FOTO="img/pokemon/pyri.webp";   // figura 2D do Pyri (a 3D vem depois)
const PYRI_IMG="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><radialGradient id='g' cx='50%' cy='40%'><stop offset='0' stop-color='#ffd27a'/><stop offset='1' stop-color='#ff6a2f'/></radialGradient></defs><circle cx='100' cy='100' r='92' fill='url(#g)' stroke='#fff' stroke-width='8'/><text x='100' y='134' font-size='112' text-anchor='middle'>🔥</text></svg>");
const TUT_PASSOS=[
  {fala:"Oi, eu sou o Pyri!",ico:"👋"},
  {fala:"Vou ser o seu guia e o seu primeiro companheiro nesta aventura de matemática.",ico:"🔥🤝"},
  {fala:"Aqui você aprende em fases. Cada fase tem uma explicação animada e exercícios para praticar.",ico:"🗺️📖"},
  {fala:"Cada fase tem 3 níveis: Bronze, Prata e Ouro. Passou de um nível, o próximo abre!",ico:"🥉🥈🥇"},
  {fala:"Em cada nível você tem 2 vidas. Errou? Perde uma vida. Se perder as duas, é só tentar de novo!",ico:"❤️❤️"},
  {fala:"Para ir para a próxima fase, termine os 3 níveis. Você pode tentar cada nível 3 vezes por dia.",ico:"➡️🏁"},
  {fala:"Terminou o Ouro sem perder nenhuma vida? Você ganha um Pokémon de presente!",ico:"🎁⚡"},
  {fala:"Todo dia tem um desafio que dá XP. Com ele o seu Pokémon cresce e evolui!",ico:"🏆✨"},
  {fala:"E tem a ofensiva: estude todo dia e o foguinho fica aceso. Em 7 dias seguidos vem um Pokémon lendário!",ico:"🔥📅"},
  {fala:"Se precisar de ajuda, é só tocar em “Pyri, me explica”. Vamos começar?",ico:"🚀"}
];
let TUT=null;
const velTut=()=>(typeof window!=="undefined"&&window.__PYRI_VEL!=null)?window.__PYRI_VEL:1;

function garantirPyri(){
  const novo=!S.comp;
  if(!S.caught[PYRI_ID])S.caught[PYRI_ID]={nome:"Pyri",n:1,nivel:1,xp:0,amizade:0,rar:"raro"};
  if(novo){S.comp=PYRI_ID;S.tutorialVisto=false}               // começa com o Pyri; mostra o tutorial na 1ª abertura
  else if(S.tutorialVisto==null)S.tutorialVisto=true;           // quem já jogava não vê o tutorial sozinho (pode abrir pelo botão)
  EVO[PYRI_ID]=[PYRELIS_ID,"breve"];save();
}
function criarBotaoPyri(){
  if(document.getElementById("pyri-ajuda"))return;
  const b=document.createElement("button");b.id="pyri-ajuda";b.className="pm-pyri-btn";b.textContent="🔥 Pyri, me explica";
  b.setAttribute("aria-label","Pyri, me explica");b.onclick=()=>tutorialPyri(true);document.body.append(b);
}
const tutorialInicial=()=>{if(S.tutorialVisto===false)tutorialPyri(true)};
function fecharTutorial(){
  if(TUT){clearTimeout(TUT.t1);clearInterval(TUT.dig)}
  const o=document.querySelector(".pm-tut");if(o)o.remove();TUT=null;
}
function tutFim(){S.tutorialVisto=true;save();fecharTutorial();render()}
function escreverFala(el,texto,pyri){
  clearInterval(TUT.dig);el.textContent="";
  if(semMov()||velTut()===0){el.textContent=texto;pyri.classList.remove("falando");return}
  pyri.classList.add("falando");let i=0;
  TUT.dig=setInterval(()=>{i++;el.textContent=texto.slice(0,i);if(i>=texto.length){clearInterval(TUT.dig);pyri.classList.remove("falando")}},30*velTut());
}
function tutPasso(i){
  if(!TUT)return;const P=TUT_PASSOS,n=P.length;TUT.i=Math.max(0,Math.min(n-1,i));const p=P[TUT.i],ov=TUT.ov;
  escreverFala(ov.querySelector("#tut-fala"),p.fala,ov.querySelector("#tut-pyri"));
  ov.querySelector("#tut-ico").textContent=p.ico;
  ov.querySelector("#tut-pontos").innerHTML=P.map((_,k)=>`<i class="${k<=TUT.i?"on":""}"></i>`).join("");
  ov.querySelector("#tut-ant").disabled=TUT.i===0;
  ov.querySelector("#tut-prox").textContent=TUT.i===n-1?"Vamos começar! 🚀":"Próximo ▶";
}
function tutorialPyri(comTitulo){
  fecharTutorial();
  const ov=document.createElement("div");ov.className="pm-tut";ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Pyri explica o jogo");
  ov.innerHTML=`<div class="pm-tut-titulo" id="tut-tit">${[..."Pyri"].map((c,i)=>`<span style="animation-delay:${i*.18}s">${c}</span>`).join("")}</div>
  <div class="pm-tut-palco" id="tut-palco" style="display:none">
    <div class="pm-tut-pyri" id="tut-pyri"><div class="pm-pyri-corpo">🔥</div></div>
    <div class="pm-tut-balao"><div id="tut-fala" class="pm-tut-fala"></div><div class="pm-tut-ico" id="tut-ico"></div></div>
    <div class="pm-tut-pontos" id="tut-pontos"></div>
    <div class="pm-tut-btns"><button class="pm-bt" id="tut-ant">◀ Voltar</button><button class="pm-bt pm-bt-prox" id="tut-prox">Próximo ▶</button></div>
    <button class="lin pm-tut-pular" id="tut-pular">Pular</button>
  </div>`;
  document.body.append(ov);TUT={i:0,ov};
  const mostrarPalco=()=>{if(!TUT)return;clearTimeout(TUT.t1);ov.querySelector("#tut-tit").style.display="none";ov.querySelector("#tut-palco").style.display="flex";tutPasso(0)};
  ov.querySelector("#tut-ant").onclick=()=>tutPasso(TUT.i-1);
  ov.querySelector("#tut-prox").onclick=()=>{if(TUT.i>=TUT_PASSOS.length-1)tutFim();else tutPasso(TUT.i+1)};
  ov.querySelector("#tut-pular").onclick=tutFim;
  if(comTitulo){ov.querySelector("#tut-tit").onclick=mostrarPalco;TUT.t1=setTimeout(mostrarPalco,2800*velTut())}
  else{ov.querySelector("#tut-tit").style.display="none";mostrarPalco()}
}
