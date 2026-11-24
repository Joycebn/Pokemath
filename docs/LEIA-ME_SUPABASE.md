# Pokemath — camada de dados na nuvem (Supabase)

O progresso agora fica salvo **no aparelho e na nuvem**. A criança entra com **código + figura + senha de 4 números** (sem e-mail). O jogo em si (animações, níveis, vidas, recompensas) **não mudou**: só mudou *onde* o progresso é guardado.

## Como funciona (resumo)

| Parte | O que faz |
|---|---|
| **Banco (Supabase)** | 6 tabelas com regras de acesso (RLS): cada criança só lê/grava o que é dela; o responsável só vê as crianças da própria conta. |
| **Entrada da criança** (`entrar.html`) | Código + figura + PIN. O PIN é conferido no servidor, guardado só como *hash* (bcrypt) e há limite de tentativas erradas. |
| **Área do responsável** (`responsavel.html`) | Cadastro com consentimento (data + versão do texto), cadastrar crianças, ajustes do controle externo, trocar PIN, baixar dados, excluir. |
| **Jogo** (`index.html`) | Continua salvando no aparelho (rápido e funciona sem internet). Quando há internet, envia uma cópia à nuvem e junta o que veio de outro aparelho **sem perder conquistas**. |
| **Controle externo** | Lê a tabela `configuracoes` ao abrir e sempre que ficar online; sem internet usa a última recebida. |

A chave que fica no app é **somente a publicável** (`sb_publishable_…`). A chave secreta nunca sai do servidor.

---

## PARTE 1 — Preparar o Supabase (uma vez só, ~20 minutos)

### Passo 1 · Rodar os arquivos SQL, na ordem
1. Abra o projeto no painel do Supabase → menu **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/sql/001_base.sql`, copie **todo** o conteúdo, cole no editor e clique **Run**. Deve aparecer *Success. No rows returned*.
3. Repita, **um de cada vez e nesta ordem**: `002_tabelas.sql` → `003_funcoes_e_gatilhos.sql` → `004_seguranca_rls.sql`.
4. Se aparecer algum erro vermelho, **pare** e me mande o texto do erro. Não pule arquivos.

### Passo 2 · Rodar o teste de segurança (o mais importante)
1. Nova query → cole `supabase/sql/005_teste_isolamento.sql` → **Run**.
2. Ele cria 2 famílias de mentira, tenta "espiar" os dados umas das outras, confere o PIN, o limite de tentativas e o consentimento, e **apaga tudo que criou**.
3. No fim aparece uma tabela. **A coluna `resultado` deve ser `OK` em todas as 61 linhas.** Qualquer `FALHOU` = não use o app com crianças ainda; me mande a tabela.
4. Pode rodar de novo sempre que mudar algo no banco.

O que o teste prova (entre outras coisas):
- uma criança **não vê** a ficha, o progresso nem a configuração de outra (nem da mesma família);
- uma criança **não consegue gravar** no progresso de outra, nem alterar a própria configuração do controle externo;
- ninguém (criança, responsável, visitante) consegue **ler o hash do PIN**; visitante sem login não lê nada;
- o responsável só enxerga/ajusta as crianças dele e **não passa a criança para outra família**;
- 5 erros no mesmo código → bloqueio de 15 min (até o PIN certo é recusado); 30 erros do mesmo IP → bloqueio; código inexistente responde **igual** a PIN errado;
- cadastro **sem consentimento é recusado**; com consentimento grava versão, hash do texto e data/hora.

### Passo 3 · Ajustar a autenticação
Painel → **Authentication**:
- **URL Configuration** → *Site URL*: `https://joycebn.github.io/Pokemath/` e, em *Redirect URLs*, adicione o mesmo endereço.
- **Sign In / Providers → Email**: deixe **Confirm email** *ligado* (recomendado: garante que o e-mail é do responsável) e coloque tamanho mínimo de senha **8**.
- Se quiser testar sem e-mail de confirmação, desligue e ligue de volta depois.

### Passo 4 · Publicar as 2 funções do servidor
1. Painel → **Edge Functions** → **Secrets** (ou *Manage secrets*) → crie o segredo **`PM_SEGREDO_SENHA`** com um texto **longo e aleatório** (40+ caracteres, tipo `k3Jd…`; um gerador de senhas serve). **Guarde uma cópia num lugar seguro.**
   > ⚠️ **Nunca mude esse segredo depois de cadastrar crianças**: ele é usado para abrir a sessão delas; se mudar, ninguém consegue entrar (teria que recadastrar as crianças).
2. **Edge Functions → Deploy a new function → Via Editor**, nome **`login-crianca`**: apague o exemplo, cole o conteúdo de `supabase/functions/login-crianca/index.ts` e **Deploy**.
3. Repita com o nome **`gerenciar-crianca`** e o conteúdo de `supabase/functions/gerenciar-crianca/index.ts`.
4. Nas **duas** funções, deixe **Verify JWT / Enforce JWT verification DESLIGADO** (a criança ainda não tem sessão ao entrar; e a outra função confere o login por conta própria).
5. As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem sozinhas dentro das funções — **não** copie nenhuma chave para o app.
   - *Só se* o painel disser que as chaves antigas (legacy) foram desativadas: crie o segredo `PM_CHAVE_SECRETA` com a chave **Secret** (`sb_secret_…`) do projeto.

### Passo 5 · Subir os arquivos do app no GitHub
Extraia o zip e use **Add file → Upload files** (como nos lotes anteriores), mantendo as pastas. A pasta `supabase/` e `tests/` é só documentação/testes: pode subir ou não, o app não usa.

---

## PARTE 2 — Testar na vida real

### Teste A · Cadastrar o responsável e uma criança
1. Abra `https://joycebn.github.io/Pokemath/responsavel.html` → **Criar conta** → leia o texto, marque as duas caixas → **Criar conta**.
2. Abra o e-mail, clique no link de confirmação, volte e **Entrar**.
3. Em **Cadastrar criança**: apelido, ano, idade, figura e senha de 4 números (2 vezes) → **Cadastrar**. Aparece o **código de 6 letras/números** — anote.
4. No painel do Supabase → **Table Editor → consentimentos**: deve ter 1 linha com a versão `2026-11-v1`, o hash e a data. Em **criancas**, a coluna `pin_hash` deve começar com `$2a$10$…` (nunca os 4 números).

> Se o passo 3 der erro, abra **Edge Functions → gerenciar-crianca → Logs** e me mande a mensagem.

### Teste B · Entrada da criança
1. Abra `…/Pokemath/` no celular. Sem conta, ele vai sozinho para a tela de entrada.
2. Digite o código, toque na figura, digite a senha → o jogo abre **igual ao de antes** (Pyri, fases, tudo).
3. **Senha errada 5 vezes** → aparece "Espere 15 minuto(s)". Até a senha certa é recusada nesse período.
4. Se o aparelho já tinha progresso do app antigo, aparece "Trazer o progresso que já está salvo neste aparelho" (marcado) — ele é juntado à conta.

### Teste C · A criança não vê dados de outra
1. Cadastre **duas** crianças (A e B) e jogue um pouco com cada uma (A com 2 Pokémon, B com 0).
2. Entre como B em outro navegador/aparelho: B começa do zero e **não** vê os Pokémon, moedas ou fases de A.
3. Rode de novo o `005_teste_isolamento.sql` (prova no banco, com os papéis reais `anon`/`authenticated`).

### Teste D · Offline e sincronização
1. Com a criança dentro, ative o **modo avião**, jogue um nível e ganhe moedas. Na aba **Prof.** (rolando até "Conta e nuvem") aparece "Sem internet… será enviado quando a conexão voltar".
2. Feche e reabra o app **ainda sem internet**: o progresso está lá.
3. Desligue o modo avião: em poucos segundos o status vira "Tudo salvo na nuvem ☁️". Confira em **Table Editor → progresso** (a coluna `moedas` acompanha).

### Teste E · Controle externo
1. Em `responsavel.html` → **⚙ Ajustes** da criança: mude "Questões por fase" para 10 e "Tentativas por dia" para 2 → **Salvar**.
2. No celular da criança, abra o app com internet: as fases passam a ter 10 questões (Prata). Ponha em modo avião e reabra: continua com 10 (usa a última recebida).
3. Na aba **Prof.** do aparelho, mude "Tempo do desafio": ele volta sozinho ao valor do responsável.

---

## Regras de junção entre aparelhos (quando 2 aparelhos mexem offline)
- **Nunca se perde:** Pokémon (e o maior nível/XP/amizade), fases e níveis concluídos, estatísticas, histórico, tutorial visto.
- **Contadores do dia** (tentativas por nível, meta, capturas): vale o **maior** valor do mesmo dia — não dá para burlar o limite trocando de aparelho.
- **Ofensiva:** vale a do aparelho com estudo mais recente.
- **Moedas, inventário, companheiro, ajustes:** vale o aparelho que salvou por último. *Limitação conhecida:* se dois aparelhos ganharem/gastarem moedas offline ao mesmo tempo, o valor do que salvou primeiro é descartado. Para uma criança com um celular isso não acontece.

## Limitações e cuidados
- **Plano gratuito do Supabase pausa o projeto após ~1 semana sem uso.** O app continua funcionando offline; ao reativar o projeto no painel, tudo sincroniza.
- O **texto de consentimento** (`dados/consentimento_v1.txt`) é um **rascunho**: preencha o contato e peça revisão jurídica (LGPD e ECA Digital) antes de usar com famílias. Se mudar o texto, mude a versão em `js/nuvem/config.js` (`termos.versao`).
- Os e-mails técnicos das crianças usam `@pokemath.example.com` (domínio reservado, nunca recebe mensagem).
- "Esqueci a senha da criança": o responsável usa **🔑 Novo PIN** (zera também as tentativas erradas).
- A aba **Prof.** do aparelho continua existindo (a retirada fica para quando o controle externo estiver completo).

## Arquivos
**Alterados** (só o "onde guardar"): `index.html` (carrega os scripts novos), `js/legado/jogo.js` (6 pontos: chave local por criança, gancho no `save()`, `_ts` ao restaurar backup, texto/botão da aba Prof. e início do app só quando há conta), `sw.js` (cache v4, nunca guarda dados do Supabase, páginas novas offline), `tests/teste_jogo_antigo.js` e `tests/teste_lote1.js` (só 1 linha cada: rodam em "modo sem nuvem").
**Novos:** `js/nuvem/{config,regras,cliente,inicio,sincronia,avatares,entrar,responsavel}.js`, `entrar.html`, `responsavel.html`, `css/nuvem.css`, `dados/consentimento_v1.txt`, `supabase/sql/001…005`, `supabase/functions/{login-crianca,gerenciar-crianca}/index.ts`, `tests/{teste_nuvem,teste_regras,teste_funcoes}.js`.

## Rodar os testes automáticos
```
npm install jsdom
node tests/teste_regras.js        # regras de junção e configuração externa
node tests/teste_funcoes.js       # funções do servidor (Supabase simulado)
node tests/teste_nuvem.js         # app inteiro: login, offline, 2 aparelhos, configuração
node tests/teste_jogo_antigo.js   # o jogo que já existia
node tests/teste_lote1.js         # fases, níveis, vidas, animações
```
