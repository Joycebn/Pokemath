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
