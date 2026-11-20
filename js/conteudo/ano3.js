/* 3º ano: fases do lote 1 (aritmética). Cada fase tem um roteiro de explicação animada
   (ver ROT em js/motor/explicacao.js) e um gerador de exercícios (ver GER em js/motor/geradores.js).
   Os três níveis (Bronze, Prata e Ouro) usam o mesmo gerador, com dificuldade crescente. */
FASES.push(
{id:"a3-posicional",ano:3,ordem:1,area:"Aritmética",icone:"🔢",titulo:"Casas dos números",resumo:"Unidades, dezenas e centenas",gerador:"valorPosicional",
 topicos:["Sistema de numeração decimal","Valor absoluto e valor posicional dos algarismos","Composição e decomposição de números"],roteiro:["posicional",345]},
{id:"a3-adicao",ano:3,ordem:2,area:"Aritmética",icone:"➕",titulo:"Somar",resumo:"Juntar quantidades",gerador:"adicao",
 topicos:["Adição de números naturais","Significados das operações: juntar","Fatos fundamentais da adição"],roteiro:["soma",23,12]},
{id:"a3-vai-um",ano:3,ordem:3,area:"Aritmética",icone:"🚀",titulo:"Somar com “vai um”",resumo:"Quando a soma passa de 9",gerador:"adicaoVaiUm",
 topicos:["Adição de números naturais","Composição e decomposição de números"],roteiro:["vaiUm",15,8]},
{id:"a3-subtracao",ano:3,ordem:4,area:"Aritmética",icone:"➖",titulo:"Subtrair",resumo:"Tirar, com empréstimo",gerador:"subtracao",
 topicos:["Subtração de números naturais","Significados das operações: retirar, comparar"],roteiro:["subEmp",32,15]},
{id:"a3-multiplicacao",ano:3,ordem:5,area:"Aritmética",icone:"✖️",titulo:"Multiplicar",resumo:"Parcelas iguais",gerador:"multiplicacao",
 topicos:["Multiplicação como adição de parcelas iguais","Multiplicação em configuração retangular"],roteiro:["mult",3,4]},
{id:"a3-divisao",ano:3,ordem:6,area:"Aritmética",icone:"➗",titulo:"Dividir",resumo:"Repartir igualmente",gerador:"divisao",
 topicos:["Divisão por repartição","Relação entre multiplicação e divisão"],roteiro:["divide",12,3]}
);
