/* Pokemath — porta de entrada. Roda ANTES do jogo (js/legado/jogo.js).
   1) Sem criança conectada neste aparelho → manda para a tela de entrada (entrar.html).
   2) Com criança conectada → o jogo passa a usar a cópia local DESTA criança (offline) e já nasce com a última configuração do controle externo. */
(function(){
  if(window.PM_TESTE_LOCAL||!window.PM_CONFIG)return;                 // modo antigo (testes e uso sem nuvem)
  let s=null;try{s=JSON.parse(localStorage.getItem("pm-sessao"))}catch{}
  if(!s||!s.id||s.expirada){
    window.PM_PARAR=true;window.PM_KEY="pokemath-sem-sessao";
    try{location.replace("entrar.html")}catch{}
    return;
  }
  window.PM_SESSAO=s;window.PM_KEY="pokemath-estado-"+s.id;
  /* aplica a última configuração recebida (vale mesmo sem internet) antes de o jogo ler o progresso */
  try{
    const sobre=JSON.parse(localStorage.getItem("pm-config-"+s.id));
    if(sobre&&sobre.sobre){
      let est=null;try{est=JSON.parse(localStorage.getItem(window.PM_KEY))}catch{}
      est=est||{};PMR.aplicarConfig(est,sobre.sobre);
      localStorage.setItem(window.PM_KEY,JSON.stringify(est));
    }
  }catch{}
})();
