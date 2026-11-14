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
