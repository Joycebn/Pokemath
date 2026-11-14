/* 3º ano: fases do lote 1 (aritmética). Cada fase tem a explicação em passos e o gerador de exercícios. */
FASES.push(
{id:"a3-posicional",ano:3,ordem:1,area:"Aritmética",icone:"🔢",titulo:"Casas dos números",resumo:"Unidades, dezenas e centenas",gerador:"valorPosicional",
 topicos:["Sistema de numeração decimal","Valor absoluto e valor posicional dos algarismos","Composição e decomposição de números"],
 explicacao:[
  {fala:"Oi! Eu sou o Pyri, seu guia! Hoje vamos descobrir o segredo dos números: cada algarismo mora em uma casa."},
  {fala:"Olha o número 345. Da direita para a esquerda, as casas são: unidades, dezenas e centenas.",termos:{"unidades":"os números soltos, de 0 a 9","dezenas":"grupos de 10","centenas":"grupos de 100"},visual:{tipo:"casas",n:345}},
  {fala:"Cada algarismo vale pela casa onde está: o 3 vale 300, o 4 vale 40 e o 5 vale 5.",visual:{tipo:"decomp",n:345}},
  {fala:"Então 345 = 300 + 40 + 5. Quanto mais para a esquerda, maior o valor! Agora é com você!"}
 ]},
{id:"a3-adicao",ano:3,ordem:2,area:"Aritmética",icone:"➕",titulo:"Somar",resumo:"Juntar quantidades",gerador:"adicao",
 topicos:["Adição de números naturais","Significados das operações: juntar","Fatos fundamentais da adição"],
 explicacao:[
  {fala:"Somar é juntar. Se eu tenho 2 maçãs e ganho mais 3, fico com quantas? Vamos ver!",visual:{tipo:"grupos",partes:[2,3],emoji:"🍎"}},
  {fala:"Agora com números maiores: 23 + 12. Começamos sempre pelas unidades, que ficam à direita. Veja os números viajando!",termos:{"unidades":"a casa da direita, dos números soltos"},visual:{tipo:"conta",op:"+",a:23,b:12,colunas:1}},
  {fala:"Depois somamos as dezenas: 2 + 1 = 3. O resultado é 35!",visual:{tipo:"conta",op:"+",a:23,b:12}},
  {fala:"Dica do Pyri: confira se a conta faz sentido. 23 + 12 tem que dar mais que 23. E deu 35!"}
 ]},
{id:"a3-vai-um",ano:3,ordem:3,area:"Aritmética",icone:"🚀",titulo:"Somar com “vai um”",resumo:"Quando a soma passa de 9",gerador:"adicaoVaiUm",
 topicos:["Adição de números naturais","Composição e decomposição de números"],
 explicacao:[
  {fala:"E quando a soma passa de 9? Vamos ver 47 + 36. Primeiro as unidades: 7 + 6 = 13.",visual:{tipo:"conta",op:"+",a:47,b:36,colunas:1}},
  {fala:"13 não cabe em uma casa só! Escrevemos o 3 e o 1 “vai” para a casa das dezenas.",termos:{"vai um":"o grupo de 10 que viaja para a casa ao lado"},visual:{tipo:"conta",op:"+",a:47,b:36,colunas:1}},
  {fala:"Nas dezenas: 4 + 3 + 1 que veio = 8. O resultado é 83!",visual:{tipo:"conta",op:"+",a:47,b:36}},
  {fala:"Macete do Pyri: passou de 9? Escreva a unidade e mande a dezena viajar para a casa ao lado!"}
 ]},
{id:"a3-subtracao",ano:3,ordem:4,area:"Aritmética",icone:"➖",titulo:"Subtrair",resumo:"Tirar e comparar",gerador:"subtracao",
 topicos:["Subtração de números naturais","Significados das operações: retirar, comparar"],
 explicacao:[
  {fala:"Subtrair é tirar. Se eu tenho 5 maçãs e como 2, ficam quantas?",visual:{tipo:"tirar",total:5,tirar:2,emoji:"🍎"}},
  {fala:"Com números maiores: 58 − 23. Começamos pelas unidades: 8 − 3 = 5.",visual:{tipo:"conta",op:"-",a:58,b:23,colunas:1}},
  {fala:"Depois as dezenas: 5 − 2 = 3. O resultado é 35!",visual:{tipo:"conta",op:"-",a:58,b:23}},
  {fala:"Para conferir, some o resultado com o que saiu: 35 + 23 = 58. Deu certo! Subtrair e somar são amigas."}
 ]},
{id:"a3-multiplicacao",ano:3,ordem:5,area:"Aritmética",icone:"✖️",titulo:"Multiplicar",resumo:"Parcelas iguais",gerador:"multiplicacao",
 topicos:["Multiplicação como adição de parcelas iguais","Multiplicação em configuração retangular"],
 explicacao:[
  {fala:"Multiplicar é somar parcelas iguais. Aqui temos 3 grupos com 4 maçãs em cada um.",termos:{"parcelas":"as partes iguais que a gente soma"},visual:{tipo:"iguais",grupos:3,cada:4,emoji:"🍎",somar:false}},
  {fala:"Somando: 4 + 4 + 4 = 12.",visual:{tipo:"iguais",grupos:3,cada:4,emoji:"🍎",somar:true}},
  {fala:"Em vez de somar tudo, escrevemos 3 × 4 = 12. Lemos: “3 vezes 4 é 12”."},
  {fala:"Dica do Pyri: 3 × 4 e 4 × 3 dão o mesmo resultado! Depois vamos treinar a tabuada."}
 ]},
{id:"a3-divisao",ano:3,ordem:6,area:"Aritmética",icone:"➗",titulo:"Dividir",resumo:"Repartir igualmente",gerador:"divisao",
 topicos:["Divisão por repartição","Relação entre multiplicação e divisão"],
 explicacao:[
  {fala:"Dividir é repartir igualmente. São 12 biscoitos para 3 pratos: vamos distribuir um por vez!",visual:{tipo:"reparte",total:12,pratos:3,emoji:"🍪"}},
  {fala:"Cada prato ficou com 4 biscoitos. Então 12 ÷ 3 = 4."},
  {fala:"Para conferir, multiplique: 3 × 4 = 12. A divisão e a multiplicação são amigas!",visual:{tipo:"iguais",grupos:3,cada:4,emoji:"🍪",somar:false}}
 ]}
);
