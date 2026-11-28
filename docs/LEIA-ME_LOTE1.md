# Pokemath — Lote 1 (base + 3º ano funcionando)

## O que já funciona
- **Aba Fases:** trilha do 3º ano com 6 fases (casas dos números, somar, somar com "vai um", subtrair, multiplicar, dividir).
- **Explicação com o Pyri:** em cada fase, passos com fala, termos explicados e animação: os números "viajam" na conta armada (como no exemplo da adição), as frutas se juntam, saem, se repartem em pratos e os grupos se somam.
- **Exercícios:** escolher ou digitar; erro mostra a explicação e a questão volta no fim da fila.
- **Recompensas:** moedas e XP por acerto de primeira, bônus na primeira vez que conclui uma fase, e **Pokémon ao terminar sem nenhum erro** (também ao repetir).
- **Limite de 3 tentativas de fase por dia** e liberação por ano escolar (ajustáveis na área do professor).
- Tudo o que já existia continua: tabuada, ofensiva, captura, evolução, loja, cuidar (boca, carinho), Pokédex, área do professor, backup e senha.

## O que ainda NÃO está nesta versão (próximos lotes)
Contas na nuvem (Supabase), login da criança, controle externo, Pyri em 3D, modelos premium 3D, falas e gritos dos Pokémon no jogo, fases do 3º ano restantes e dos anos 4 a 9, trilha da tabuada nova, APK.
O Pyri aparece por enquanto como um ícone de fogo (🔥), até entrar o modelo 3D.

## Arquivos
- `index.html` — só a casca; carrega os módulos.
- `css/legado.css`, `css/novo.css` — visual.
- `js/conteudo/matriz.js` — anos, áreas, liberação das fases. `js/conteudo/ano3.js` — as fases do 3º ano (texto das explicações e qual gerador usar).
- `js/motor/geradores.js` — gera as questões. `js/motor/explicacao.js` — player e animações. `js/motor/trilha.js` — trilha, exercícios, recompensas e tentativas.
- `js/legado/jogo.js` — o app que já existia, movido sem mudar (com 4 ligações pequenas para a aba Fases).
- `dados/falas/` — falas dos Pokémon **com acentos corrigidos** (1.100 trocas), `falas_reserva.txt` (para quem não tem fala) e `RELATORIO_ACENTOS.txt`. `tools/corrigir_acentos.py` repete a correção em novos arquivos.
- `tests/` — testes automáticos.

## Como publicar (mesmo endereço do app atual)
1. Descompacte o zip.
2. No GitHub, abra o repositório do Pokemath → **Add file → Upload files**.
3. Arraste **todo o conteúdo da pasta** (arquivos e pastas `css`, `js`, `dados`, `tools`, `docs`, `tests`). Os arquivos com o mesmo nome são substituídos.
4. **Commit changes**, espere 1 a 2 minutos e abra o app. O progresso salvo continua (o endereço é o mesmo).
5. No celular, feche e abra o app duas vezes.

## Roteiro de teste (5 minutos)
1. Abra **Fases** e toque na 1ª fase. Passe os passos e veja as animações. Nas fases 2 e 3, confira os números viajando na conta.
2. Toque em "Vamos praticar!", erre uma questão de propósito e veja a explicação.
3. Termine a fase. Repita sem errar: deve aparecer a captura de um Pokémon.
4. Em **Prof.**, mude "Tentativas de fase por dia" para 1 e confira o bloqueio.
5. Feche e abra: o progresso das fases continua.

## Observações
- Não consegui ver as telas num celular de verdade: o visual, o tamanho dos botões e a fluidez das animações precisam ser conferidos por você.
- Suposição: o limite de 3 tentativas vale para o total do dia (todas as fases juntas), e cada vez que se começa os exercícios conta uma tentativa.

## Trilha por zonas (Etapa 1)
A aba **Fases** agora é uma trilha: cada **ano** é uma **zona** com cenário próprio e o lendário do fim do ano em silhueta (3º Pyron, 4º Lugia, 5º Ho-Oh, 6º Palkia, 7º Mewtwo, 8º Rayquaza, 9º Arceus). Cada **fase** é um círculo no caminho; tocar nele abre a folha com os 3 níveis (Bronze, Prata, Ouro). As regras (vidas, tentativas, liberação por ano) não mudaram.
- Para trocar o lendário, o nome ou as cores de uma zona: edite UMA linha em `js/conteudo/zonas.js`.
- Desenho da trilha: `js/ui/trilha_visual.js` e `css/trilha.css`. O lendário ainda NÃO é entregue (isso é a Etapa 7); o portal só mostra a silhueta e fica ✅ quando o ano está completo.

### Zona ilustrada (3º ano — Ninho de Fogo)
A zona do 3º ano usa uma ilustração (`img/zonas/ano3.webp`) como cenário; os círculos ficam sobre a trilha de tijolos da imagem, de baixo (1ª fase) para cima (vulcão e portal do Pyron). As posições estão em `js/conteudo/zonas.js` (`pontos`, em % da imagem, um para cada fase e cada "em breve"). Ao concluir a Etapa 2 (novas fases), ajuste/adicione pontos; se faltar ponto, a zona volta sozinha ao degradê (nenhuma fase some). Outros anos: acrescentar `fundo` e `pontos` na linha do ano. Ao abrir a aba Fases, a tela rola até a fase atual. O `sw.js` (v11) guarda a imagem para funcionar offline.

### Folha dos níveis (laje de pedra com 3 medalhas)
Ao tocar numa fase abre, no MEIO da tela, uma laje de pedra com folhagem e as 3 medalhas (bronze, prata e ouro, desenhadas em SVG). O estado aparece no selo de cada medalha (✔ concluído, 🔒 bloqueado, 🔁 refazer; a disponível brilha) e em texto embaixo. O visual está em `js/ui/trilha_visual.js` (`medalhaSvg`, `laje`) e `css/trilha.css` (`.laje`). `sw.js` v12.

## Etapa 3 — Pyri 2D, Macetes e Tabuada em trilha

- **Pyri**: `img/pokemon/pyri.webp` (WebP transparente, ~106 KB). `IMG(PYRI_ID)` devolve essa figura em todas as telas; Pyrelis e Pyron continuam com o desenho provisório até terem figura. A figura 3D fica para depois.
- **Macetes** (`js/conteudo/macetes.js`, `js/ui/macetes.js`): medidas de comprimento (frase "Katia Herdou DA Mãe Dois Cachorrinhos Muito Mansinhos") e tabuadas do 4, 5, 9, 10 e 11. Prática: ordem das palavras, lacuna e aplicação (medidas) ou 5 contas com a explicação do truque. Sem vidas; erro mostra explicação e deixa tentar de novo. XP pequeno **uma vez por dia por macete** (`S.macetes`). Acesso: botão 💡 na aba Tabuada, na laje dos círculos ×4/×5/×9, e campo opcional `macete` em qualquer fase.
- **Tabuada em trilha** (`js/conteudo/tabuada_trilha.js`, `js/ui/tabuada_trilha.js`): círculos ×2 a ×9, depois 2×1, 3×1, 2×2 fácil e 2×2. Cada círculo abre a laje: 🥉 8 de 10 de primeira; 🥈 9 de 10 e tempo médio ≤ meta; 🥇 10 de 10 e tempo médio ≤ meta. Metas de 1 algarismo: Prata 6 s, Ouro 3 s por conta (outras: 2×1 12/7 s, 3×1 20/12 s, 2×2 fácil 15/9 s, 2×2 30/20 s). Ajustáveis em `S.cfg.tabMetas = {t7:{prata:5}}`. Bronze abre a próxima tabuada; Prata exige Bronze; Ouro exige Prata. O tempo vai da conta aparecer até o acerto (errar não zera). Progresso em `S.tabT` (últimas 30 sessões; gráfico de evolução na laje). Aprender/Treinar/Desafio ficam em "Livre". Sem SQL: o progresso já sincroniza dentro do `S`.
- `sw.js`: `pokemath-v13` com os arquivos novos e a figura do Pyri.

### Ajustes após a Etapa 3
- O Pyri (figura) aparece no tutorial inicial, na introdução da trilha de fases e na explicação animada (antes eram um círculo com 🔥).
- Macetes nas fases: campo `macete` da fase aceita um id ou uma lista; a laje da fase mostra 💡 e abre só os macetes dela. A Multiplicação do 3º ano já traz as tabuadas do 4, 5, 9, 10 e 11. O macete das medidas será ligado à fase de medidas quando ela existir.

## Etapa 2, Lote A — 3º ano: Comparar e ordenar, Pares e ímpares, Sequências
- Fases novas (ordens 7, 8 e 9 do 3º ano): `a3-comparar` (⚖️), `a3-paresimpares` (👯) e `a3-sequencias` (🔁), cada uma com 3 níveis, 2 vidas, os 4 tipos de questão (escrever, escolher, completar e ligar) e explicação animada do Pyri.
- Geradores em `js/motor/geradores.js` (`GER.comparar`, `GER.parImpar`, `GER.sequencia`): respostas sempre numéricas. Comparar: 3 algarismos (Bronze/Prata) e 4 (Ouro), números parecidos para comparar casa por casa. Pares e ímpares: último algarismo, contagem e "par/ímpar logo antes/depois de". Sequências: de 2 em 2 até de 10 em 10; no Ouro também de 20, 25 e 50 e sequências que diminuem.
- Roteiros em `js/motor/explicacao.js` (`ROT.comparar`, `ROT.parImpar`, `ROT.sequencia`), cada passo de 3 a 5 s.
- "Tabuadas" saiu da lista "Em breve" (a aba Tabuada é a trilha da tabuada); a tela de fases ganhou o atalho 🔢 para ela. Restavam em "Em breve" 4 itens; o Lote B tirou Figuras e Tempo/dinheiro, restam Tabelas e gráficos e Acaso e probabilidade (Lote C).
- Campo opcional `curto` na fase: nome curto da etiqueta na trilha ilustrada (o nome inteiro continua no rótulo de acessibilidade).

## Lâmpada 💡 com macetes (no lugar da dica escrita)
- Nos exercícios das fases (Bronze, Prata e Ouro), no Treino/Desafio da aba Tabuada e na trilha da Tabuada, a dica escrita saiu. No lugar há um botão 💡; só se a criança tocar abre o cartão com o macete e o Pyri. Abrir a lâmpada não custa vida, moeda nem tentativa, e a questão continua a mesma.
- Qual macete abre: cada fase tem o campo `macete` (um id ou uma lista) em `js/conteudo/ano3.js`. Na Multiplicação a lâmpada escolhe pelos números da conta (ordem 9, 6, 8, 7, 4, 3, 5, 10, 11, 2); os geradores de conta guardam os fatores no campo `fat`. Fase sem macete mostra um "Lembrete" com a dica antiga.
- 19 macetes em `js/conteudo/macetes.js`: medidas de comprimento (frase da Katia), casas dos números ("Um Dia Comi Mangas"), somar, "vai um", empréstimo, tabuadas do 2 ao 11, dividir, comparar (boca do sinal), pares e ímpares e sequências. Os da pesquisa (tabuadas e boca do sinal) vêm de Toda Matéria, Valor Final, Só Matemática e Psicopedagogia.com.br; os demais são propostas do projeto para ajuste.
- Prática de cada macete (💡 Macetes na aba Tabuada): os de tabuada usam 5 contas; os conceituais usam 4 questões de escolha do gerador da fase; as medidas têm ordem, lacuna e aplicação.

## Etapa 2, Lote B — 3º ano: Figuras geométricas, Medidas de comprimento, Medidas de tempo e Dinheiro
- Fases novas (ordens 10 a 13 do 3º ano): `a3-figuras` 🔷, `a3-comprimento` 📏, `a3-tempo` 🕒 e `a3-dinheiro` 💰 (tempo e dinheiro são duas fases separadas). Cada uma tem 3 níveis, 2 vidas, os 4 tipos de questão (escrever, escolher, completar e ligar), respostas **sempre numéricas e inteiras** (dinheiro só em reais inteiros ou centavos, sem vírgula) e explicação animada do Pyri com passos de 3 a 5 s.
- Geradores em `js/motor/geradores.js` (`GER.figuras`, `GER.comprimento`, `GER.tempo`, `GER.dinheiro`), todos montados por `montarFam`, que junta "famílias" de questões (enunciado, versão com ___, texto para ligar, resposta, explicação e desenho opcional). Bronze/Prata usam o nível fácil e o Ouro o difícil:
  - Figuras: lados e vértices de triângulo, quadrado, retângulo, pentágono e hexágono; cubo (faces no Bronze/Prata; faces, vértices e arestas no Ouro).
  - Comprimento: m↔cm, cm↔mm e km↔m; no Ouro também "2 m e 35 cm em cm", fitas juntas e diferença entre fios.
  - Tempo: horas↔minutos, dias↔horas, semanas↔dias, anos↔meses, meia hora, relógio (Bronze/Prata: :00, :15, :30 e :45; Ouro: de 5 em 5 minutos, "1 hora e meia" e "quantos minutos faltam").
  - Dinheiro: reais↔centavos, somar valores, troco (em reais e em centavos), somar moedas e notas desenhadas.
- Desenhos em SVG feitos no próprio código (`svgFigura`, `svgRelogio`, `svgDinheiro` em `js/motor/trilha.js`, chamados por `visEstatico`), sem imagens de terceiros. Questões com desenho guardam o desenho na chave para não repetir. Estilos em `css/novo.css` (`.visSvg`, `.pm-txt`, `.pm-moeda`, `.pm-nota`).
- Roteiros em `js/motor/explicacao.js` (`ROT.figuras`, `ROT.comprimento`, `ROT.tempo`, `ROT.dinheiro`): vértices acendem e o cubo aparece; a régua de 1 m se divide em 100 cm; o ponteiro grande dá a volta de 60 minutos; moedas e notas se juntam e o troco é completado.
- Macetes novos em `js/conteudo/macetes.js` (agora 22): `figuras` (tri = 3, quadri = 4, penta = 5, hexa = 6; cubo como um dado), `tempo` (cada número do ponteiro grande vale 5 minutos) e `dinheiro` (troco: complete do preço até o valor pago). A fase de comprimento usa o macete que já existia (frase da Katia), com uma frase a mais explicando "1 m = 100 cm" e "1 km = 1000 m". A prática dos macetes agora também mostra o desenho da questão.
- Em breve (3º ano): só restam Tabelas e gráficos e Acaso e probabilidade (Lote C).
- Trilha ilustrada: 15 círculos (13 fases + 2 cadeados). Foi acrescentado 1 ponto no caminho de cima do vulcão em `js/conteudo/zonas.js`, e cada ponto aceita um 3º valor opcional (`"e"` ou `"d"`) para escolher o lado da etiqueta e evitar que ela cubra o círculo vizinho. Nomes curtos: Figuras, Comprimento, Tempo, Dinheiro.
- `sw.js`: `pokemath-v14`.

## Ajustes das fases — Entrega 1 (Comparar, Pares e ímpares, Sequências)
- **Comparar, "ligar"**: agora é "Ligue o sinal correto em cada situação" (`568 ▢ 477` ↔ maior que (>), menor que (<), igual (=)), três situações, uma de cada sinal. Em `montarComparar` (`js/motor/geradores.js`).
- **Comparar, Ouro**: no lugar de "qual número falta", vem o tipo novo **ordenar** (4 ou 5 números, crescente ou decrescente): a criança toca nos números na ordem, vê a fila, pode desfazer e só então verifica. Bronze e Prata mantêm o completar. Tela em `htmlOrdenar`/`ordenarNum`/`desfazerOrd`/`verificarOrd` (`js/motor/trilha.js`); estilo em `css/novo.css`.
- **Pares e ímpares, "ligar"**: quatro números ligados a "par" ou "ímpar" (um cartão "par" ou "ímpar" para cada número).
- **Explicação de Comparar** (`ROT.comparar`): três passos novos — maior que / menor que / igual, crescente e decrescente. **Macete de Comparar** também completo.
- **Sequências**: macete e explicação (`ROT.sequencia`, 2 passos novos) com a regra: aumentando = soma, quanto = segundo − primeiro; diminuindo = subtrai, quanto = primeiro − segundo.
- `sw.js`: `pokemath-v17`. Arquivos alterados: js/motor/geradores.js, js/motor/trilha.js, js/motor/explicacao.js, js/conteudo/macetes.js, css/novo.css, sw.js, tests/teste_lote1.js, tests/teste_nuvem.js, docs/LEIA-ME_LOTE1.md.

## Ajustes das fases — Entrega 2 (🪙 Dica da resposta)
- Em todas as fases, ao lado da 💡 (macete, que continua **de graça**), há o botão **🪙 Dica da resposta · 3**. Gasta **3 moedas** (`PRECO_DICA` em `js/motor/trilha.js`), uma compra por questão; sem moedas suficientes o botão fica apagado mostrando o preço.
- A dica **não conta como erro**: medalha, "perfeito" e o Pokémon do Ouro não mudam.
- O que cada tipo de questão recebe: escolher → 2 opções erradas ficam apagadas; ligar → 1 par certo já vem ligado; ordenar → o próximo número certo entra na fila; escrever/completar → o texto diz quantos algarismos tem a resposta. Em todos aparece o conselho da fase (`ex.dica`), numa caixa amarela.
- Funções: `dicaTextoResp`, `aplicarDicaResp`, `comprarDica`, `htmlDicaMoeda` (`js/motor/trilha.js`). A questão repetida depois de um erro mantém a dica já paga (não cobra de novo). Estilos em `css/novo.css`. `sw.js`: `pokemath-v18`.
- Limite diário de tentativas: está **desligado** por enquanto (`SEM_LIMITE_TENTATIVAS=true` em `js/conteudo/matriz.js`); voltar para `false` antes de entregar às crianças.

## Ajustes das fases — Entrega 3 (Figuras, Comprimento, Tempo, Dinheiro)
- **Figuras:** o cubo saiu das questões e da explicação (o desenho `cubo` continua guardado em `svgFigura`, para quando for pedido de volta). Figuras do jogo: triângulo, quadrado, retângulo, quadrilátero, pentágono, hexágono, heptágono, octógono, eneágono e decágono (Bronze e Prata até o hexágono; o Ouro vai até o decágono). Explicação completa (`ROT.figuras`, 10 passos): quadrado, retângulo e triângulo com vértices e lados; **cada lado fica vermelho ao ser contado**; quadrilátero (quadri + látero); o corte na diagonal que faz **2 triângulos**; pentágono ao decágono; resumo dos prefixos. Macete atualizado.
- **Comprimento:** explicação nova (`ROT.comprimento`, 8 passos) com o **quadro de ordem** (km, hm, dam, m, dm, cm, mm), a **frase da Katia**, "direita = × 10" e "esquerda = ÷ 10", e o **Pyri andando pelas casas** (3 m → 300 cm; 300 cm → 3 m; 1 km → 1000 m). O macete também traz o quadro de ordem e a volta (÷ 10).
- **Tempo:** o ponteiro grande **não girava** porque havia duas funções `girar` com o mesmo nome (a segunda cobria a primeira); a do relógio agora é `girarMao`. O ponteiro pequeno começa no 4 (não esconde mais o grande), a **legenda** "ponteiro pequeno = horas / ponteiro grande = minutos" fica na tela, e há um passo novo com a hora quebrada **3:55**. **Horas quebradas** (minutos de 5 em 5): só na Prata e no Ouro; o Bronze fica com :00, :15, :30 e :45. Para isso `novaSessao` agora passa o nível ao gerador (`GER.xxx(dif, tipo, nivel)`).
- **Dinheiro:** cédulas e moedas redesenhadas em SVG **próprio e estilizado** (`svgCedula`, `svgMoeda`, `bichoNota` em `js/motor/trilha.js`): cada cédula tem cor, "BRASIL", "R$ n" grande, "REAL" e um animal desenhado por mim (tartaruga, garça, arara, mico-leão, onça, garoupa); moedas com os tons certos (R$ 1 dourada com miolo prateado, 50 centavos prateada, 25 e 5 cobre, 10 dourada). **Não são cópias das cédulas** do Banco Central: levam a marca "ILUSTRAÇÃO" e não repetem o texto "Banco Central do Brasil". A explicação animada usa os mesmos desenhos.
- `sw.js`: `pokemath-v18` (mesma versão da Entrega 2; os arquivos novos entram junto). Arquivos alterados: js/motor/geradores.js, js/motor/trilha.js, js/motor/explicacao.js, js/conteudo/macetes.js, js/conteudo/ano3.js, css/novo.css, tests/teste_lote1.js, docs/LEIA-ME_LOTE1.md.

## Lote C — Tabelas e gráficos e Acaso e probabilidade (as duas últimas fases do 3º ano)
- **Duas fases novas** em `js/conteudo/ano3.js`: `a3-tabelas` (ordem 14, área Estatística, 📊) e `a3-acaso` (ordem 15, área Probabilidade, 🎲). A lista "Em breve" do 3º ano ficou **vazia** (`EM_BREVE={3:[]}` em `js/conteudo/matriz.js`). A trilha continua com **15 círculos**: os dois lugares que eram cadeados agora são as fases (nenhum ponto novo em `js/conteudo/zonas.js`).
- **Tabelas e gráficos** (`GER.tabelas`, `montarTabelas` em `js/motor/geradores.js`), com os Pokémon do jogo (Pikachu, Charmander, Squirtle, Bulbasaur, Eevee, Jigglypuff) e valores sem empate:
  - Bronze: tabela simples e pictograma (cada ícone vale 1); ler, maior/menor, total, "quantos a mais".
  - Prata: tabela de dupla entrada (ler a célula, somar linha, somar coluna) e **gráfico de colunas** (régua de 1 em 1 ou de 2 em 2).
  - Ouro: **gráfico de barras** (régua de 5 em 5 ou de 10 em 10), pictograma em que cada ícone vale 2, 5 ou 10, soma das duas maiores barras e total da tabela de dupla entrada.
  - "Ligar": um só desenho e três perguntas, cada uma com um valor diferente.
- **Acaso e probabilidade** (`GER.acaso`, `montarAcaso`), só com palavras e números inteiros (sem fração nem porcentagem):
  - Bronze: **certo / possível / impossível** (botões com as palavras) e contagem de bolinhas na urna.
  - Prata: **mais e menos provável** (botões com o nome da cor), quantas bolinhas a mais, total; a urna sempre tem 3 cores com quantidades diferentes.
  - Ouro: resultados possíveis de **dado, moeda e roleta**, quantas partes da roleta têm a cor, quantas chances tem uma cor da urna.
  - Tipo de apoio novo: `ex.rotulos` (em `htmlResposta`, `js/motor/trilha.js`) mostra palavras nos botões da questão de escolher; por baixo a resposta continua sendo um número (1 = certo, 2 = possível, 3 = impossível).
- **Desenhos em SVG feitos no próprio código** (`js/motor/trilha.js`, chamados por `visEstatico`): `svgTabela`, `svgPictograma`, `svgColunas`, `svgBarras` (a régua e a altura/largura são proporcionais ao valor; o número não vem escrito em cima da barra), `svgUrna`, `svgDado`, `svgMoedaSorte` (cara e coroa), `svgRoleta` e `svgIconePk` (carinha de Pokémon própria). Sem imagens de terceiros.
- **Explicações do Pyri** em `js/motor/explicacao.js`: `ROT.tabelas` (7 passos: tabela, ler um valor, linha × coluna, pictograma, colunas crescendo, ler a altura com linha pontilhada, comparar e somar) e `ROT.acaso` (7 passos: certo, impossível, possível, mais provável, dado, moeda, roleta). Passos de 3 a 5 s, resultados em destaque e **sem a legenda de unidades/dezenas** (que não faz sentido aqui). Funções novas de apoio: `svgBox`, `caixaG`, `bolaG`, `crescer`, `semLegenda`.
- **Macetes novos** (agora 24) em `js/conteudo/macetes.js`: `tabelas` (1º o título, 2º a linha e a coluna, 3º o número ou a altura da barra) e `acaso` (mais bolinhas da mesma cor = mais chance). O treino do macete do acaso usa palavras (`js/ui/macetes.js`).
- 💡 e 🪙 funcionam nas fases novas sem mudança; a 🪙 nunca entrega a resposta.
- `sw.js`: `pokemath-v19`. Arquivos alterados: js/motor/geradores.js, js/motor/trilha.js, js/motor/explicacao.js, js/conteudo/ano3.js, js/conteudo/macetes.js, js/conteudo/matriz.js, js/ui/macetes.js, css/novo.css, sw.js, tests/teste_lote1.js, tests/teste_nuvem.js, docs/LEIA-ME_LOTE1.md.
- Lembrete: `SEM_LIMITE_TENTATIVAS=true` (js/conteudo/matriz.js) continua ligado só para a programação; voltar para `false` antes de dar às crianças.

## Ajustes pós-Lote C — dado completo, imagens reais e dinheiro em reais com vírgula
- **Dado (Acaso):** `svgDadoTodos()` desenha as **6 faces** (1 a 6, com os pontinhos); as questões de dado e o passo 5 da explicação do Acaso mostram todas as faces (a explicação as acende uma a uma). `svgDado(n)` (uma face) continua existindo, usado dentro do desenho.
- **Imagens reais dos Pokémon (Tabelas e gráficos):** arte oficial de Pikachu, Charmander, Squirtle, Bulbasaur, Eevee e Jigglypuff em `img/pokemon/*.webp` (128 px, ~6 KB cada). Entram na tabela, no pictograma (cada ícone é a imagem), nas colunas (imagem sob a base) e nas barras (imagem ao lado do nome). `PKS[i].img`, `imgPk()` e `svgIconePk()` em `js/motor/geradores.js` / `trilha.js`. A legenda do pictograma agora é uma Pokébola desenhada. As imagens são arte da Nintendo/Game Freak, usadas só para fins educacionais.
- **Dinheiro em reais, com vírgula** (`js/motor/geradores.js`): o valor é guardado em **centavos** e mostrado como `R$ 2,30` (`Rs()`); a criança digita `2,30` (também vale `2.30`, `R$ 2,30`, `3,5`, `2`) — `parseDin()`. Campo de texto decimal com "R$" ao lado (no "completar" o R$ já está no enunciado). Botões de escolha mostram `R$ x,xx` (`ex.rotulos`); ao errar, "A resposta certa é R$ 2,30".
  - Bronze: reais inteiros e meios (R$ 2,00 · 3,50 · 0,50). Prata: de 10 em 10 centavos (R$ 2,30). Ouro: de 5 em 5 centavos, compra de 3 itens, quanto falta, notas + moedas.
  - Tipos de questão: converter centavos ↔ reais, escrever "2 reais e 30 centavos" em dinheiro, somar, troco, quanto falta, moedas e notas (soma em R$). Dica 🪙 fala da vírgula sem entregar a resposta.
  - Explicação do Pyri (`ROT.dinheiro`, agora 8 passos): novos passos "R$ 2,30 = 2 reais e 30 centavos", "somar alinhando a vírgula" e "troco com centavos". Macete Dinheiro e a prática do macete atualizados (`js/ui/macetes.js` usa os rótulos).
- `sw.js`: `pokemath-v20` (imagens no cache offline). **Depois de publicar, limpar o cache do site** (como na vez anterior) para ver tudo.
- Arquivos alterados: js/motor/geradores.js, js/motor/trilha.js, js/motor/explicacao.js, js/conteudo/macetes.js, js/conteudo/ano3.js, js/ui/macetes.js, css/novo.css, sw.js, img/pokemon/*.webp (6 novos), tests/teste_lote1.js, tests/teste_nuvem.js, docs/LEIA-ME_LOTE1.md.

## Tábuas de madeira na trilha (ponte até o vulcão)
- Cada fase da trilha é agora uma **tábua de madeira** (botão `button.circulo.tabua`, em `js/ui/trilha_visual.js` e `css/trilha.css`), no formato da imagem que a Joyce enviou: retângulo grosso, moldura escura, face lisa com veios, espessura embaixo e 2 pregos. Desenhada só em CSS (sem arquivo novo).
- Na zona ilustrada (Ninho de Fogo) o tamanho usa `cqw` (`container-type:inline-size` em `.zona.ilus`): 15% da largura × 8,6% — cresce e diminui junto com a imagem; fica nas mesmas posições (`pontos` em `js/conteudo/zonas.js`). O nome curto continua na etiqueta ao lado (a tábua é pequena demais para o nome; ícone, medalha, ✔ e cadeado ficam nela). Área de toque ampliada em 6 px por `::before`.
- Estados: disponível (madeira clara que brilha), concluída (madeira esverdeada + selo ✔ + medalha), para refazer (laranja), bloqueada (cinza + 🔒), em breve (apagada). Fora da zona ilustrada (zigue-zague) a tábua tem 96 × 48 px.
- Regras, folha com as 3 medalhas e a aba Tabuada em trilha não mudaram. `sw.js`: `pokemath-v21`.
- Arquivos alterados: js/ui/trilha_visual.js, css/trilha.css, sw.js, tests/teste_lote1.js, tests/teste_nuvem.js, docs/LEIA-ME_LOTE1.md.

