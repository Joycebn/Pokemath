/* 3º ano: fases do lote 1 (aritmética). Cada fase tem um roteiro de explicação animada
   (ver ROT em js/motor/explicacao.js) e um gerador de exercícios (ver GER em js/motor/geradores.js).
   Os três níveis (Bronze, Prata e Ouro) usam o mesmo gerador, com dificuldade crescente. */
FASES.push(
{id:"a3-posicional",macete:"casas",ano:3,ordem:1,area:"Aritmética",icone:"🔢",titulo:"Casas dos números",resumo:"Unidades, dezenas e centenas",gerador:"valorPosicional",
 topicos:["Sistema de numeração decimal","Valor absoluto e valor posicional dos algarismos","Composição e decomposição de números"],roteiro:["posicional",345]},
{id:"a3-adicao",macete:"somar",ano:3,ordem:2,area:"Aritmética",icone:"➕",titulo:"Somar",resumo:"Juntar quantidades",gerador:"adicao",
 topicos:["Adição de números naturais","Significados das operações: juntar","Fatos fundamentais da adição"],roteiro:["soma",23,12]},
{id:"a3-vai-um",macete:"vaium",ano:3,ordem:3,area:"Aritmética",icone:"🚀",titulo:"Somar com “vai um”",curto:"Vai um",resumo:"Quando a soma passa de 9",gerador:"adicaoVaiUm",
 topicos:["Adição de números naturais","Composição e decomposição de números"],roteiro:["vaiUm",15,8]},
{id:"a3-subtracao",macete:"emprestimo",ano:3,ordem:4,area:"Aritmética",icone:"➖",titulo:"Subtrair",resumo:"Tirar, com empréstimo",gerador:"subtracao",
 topicos:["Subtração de números naturais","Significados das operações: retirar, comparar"],roteiro:["subEmp",32,15]},
{id:"a3-multiplicacao",macete:["tab2","tab3","tab4","tab5","tab6","tab7","tab8","tab9","tab10","tab11"],ano:3,ordem:5,area:"Aritmética",icone:"✖️",titulo:"Multiplicar",resumo:"Parcelas iguais",gerador:"multiplicacao",
 topicos:["Multiplicação como adição de parcelas iguais","Multiplicação em configuração retangular"],roteiro:["mult",3,4]},
{id:"a3-divisao",macete:"dividir",ano:3,ordem:6,area:"Aritmética",icone:"➗",titulo:"Dividir",resumo:"Repartir igualmente",gerador:"divisao",
 topicos:["Divisão por repartição","Relação entre multiplicação e divisão"],roteiro:["divide",12,3]},
{id:"a3-comparar",macete:"comparar",ano:3,ordem:7,area:"Aritmética",icone:"⚖️",titulo:"Comparar e ordenar",curto:"Comparar",resumo:"Maior, menor e em ordem",gerador:"comparar",
 topicos:["Comparação de números naturais","Ordem crescente e decrescente","Valor posicional na comparação"],roteiro:["comparar",358,385]},
{id:"a3-paresimpares",macete:"parimpar",ano:3,ordem:8,area:"Teoria dos Números",icone:"👯",titulo:"Pares e ímpares",curto:"Pares",resumo:"Duplas e sobras",gerador:"parImpar",
 topicos:["Números pares e ímpares","Critério pelo último algarismo"],roteiro:["parImpar",7]},
{id:"a3-sequencias",macete:"sequencia",ano:3,ordem:9,area:"Álgebra",icone:"🔁",titulo:"Sequências",resumo:"Descobrir a regra",gerador:"sequencia",
 topicos:["Sequências numéricas crescentes e decrescentes","Regra de formação de uma sequência"],roteiro:["sequencia",3,4]},
/* Lote B: geometria, medidas e dinheiro */
{id:"a3-figuras",macete:"figuras",ano:3,ordem:10,area:"Geometria",icone:"🔷",titulo:"Figuras geométricas",curto:"Figuras",resumo:"Lados, vértices e faces",gerador:"figuras",
 topicos:["Figuras planas: triângulo, quadrado, retângulo, pentágono e hexágono","Lados e vértices das figuras","Figura espacial: o cubo (faces, vértices e arestas)"],roteiro:["figuras","pentagono"]},
{id:"a3-comprimento",macete:"medidas-comprimento",ano:3,ordem:11,area:"Grandezas e Medidas",icone:"📏",titulo:"Medidas de comprimento",curto:"Comprimento",resumo:"Metro, centímetro e quilômetro",gerador:"comprimento",
 topicos:["Unidades de comprimento: metro, centímetro, milímetro e quilômetro","Transformações entre unidades de comprimento","Resolução de problemas com medidas"],roteiro:["comprimento",3]},
{id:"a3-tempo",macete:"tempo",ano:3,ordem:12,area:"Grandezas e Medidas",icone:"🕒",titulo:"Medidas de tempo",curto:"Tempo",resumo:"Relógio, horas, dias e meses",gerador:"tempo",
 topicos:["Leitura de horas em relógios analógicos","Horas, minutos, dias, semanas e meses","Resolução de problemas com medidas de tempo"],roteiro:["tempo",2]},
{id:"a3-dinheiro",macete:"dinheiro",ano:3,ordem:13,area:"Grandezas e Medidas",icone:"💰",titulo:"Dinheiro",curto:"Dinheiro",resumo:"Moedas, notas e troco",gerador:"dinheiro",
 topicos:["Sistema monetário brasileiro: reais e centavos","Valores de moedas e cédulas","Troco em situações de compra"],roteiro:["dinheiro",10,7]}
);
