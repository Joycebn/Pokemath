/* Zonas da trilha: cada ano escolar é uma zona, com cenário próprio e o lendário que a criança recebe ao concluir o ano.
   Para acrescentar ou trocar um ano, basta mexer em UMA linha abaixo.
   id = número do Pokémon na PokéAPI (900003 = Pyron, bestiário do app). cor1/cor2 = degradê do cenário (do alto para o chão).
   ZONA ILUSTRADA (opcional): fundo = imagem da zona (proporção 800x1732); pontos = [x%,y%,lado?] de cada círculo (lado opcional: "e" ou "d" decide de que lado fica a etiqueta; sem ele, x>50 → esquerda) sobre a trilha de tijolos da
   imagem, DE BAIXO PARA CIMA (o 1º ponto é o da 1ª fase). Precisa de um ponto para cada fase + cada "em breve" do ano; sem eles, a zona usa o degradê. */
const ZONAS={
  3:{nome:"Ninho de Fogo",        emoji:"🔥",cor1:"#ff8a3d",cor2:"#6e1b0c",lendario:{id:900003,nome:"Pyron"},
     fundo:"img/zonas/ano3.webp",
     pontos:[[12.5,96.0],[21.1,90.4],[29.4,84.9],[39.2,79.8,"e"],[51.2,76.1,"d"],[62.8,71.8,"d"],[63.5,65.0,"d"],[51.4,61.3,"d"],[38.0,58.4,"e"],[45.9,52.8,"e"],[59.4,50.4,"d"],[50.6,45.0,"d"],[58.0,39.2,"d"],[46.3,35.2],[61.0,31.8]]},
  4:{nome:"Mar Profundo",         emoji:"🌊",cor1:"#2f86e0",cor2:"#0a2656",lendario:{id:249,nome:"Lugia"}},
  5:{nome:"Torre Arco-íris",      emoji:"🌈",cor1:"#f2b632",cor2:"#7a3aa8",lendario:{id:250,nome:"Ho-Oh"}},
  6:{nome:"Fenda do Espaço-Tempo",emoji:"🌌",cor1:"#a678f2",cor2:"#25104f",lendario:{id:484,nome:"Palkia"}},
  7:{nome:"Laboratório Secreto",  emoji:"🧪",cor1:"#c58ad6",cor2:"#34234a",lendario:{id:150,nome:"Mewtwo"}},
  8:{nome:"Céu das Tempestades",  emoji:"⛈️",cor1:"#35b987",cor2:"#0a3a30",lendario:{id:384,nome:"Rayquaza"}},
  9:{nome:"Templo Final",         emoji:"✨",cor1:"#ecd878",cor2:"#463610",lendario:{id:493,nome:"Arceus"}}
};
