/* Pokemath — dados do projeto Supabase.
   Aqui vai SOMENTE a chave PUBLICÁVEL (feita para ficar no app; quem protege os dados são as regras RLS do banco).
   NUNCA coloque neste arquivo a chave secreta / service_role. */
window.PM_CONFIG={
  url:"https://cxfwnuyzkyugkbtbrgfl.supabase.co",
  chave:"sb_publishable_uA-tRTTlFWQOGKD8tMghpA_b4c_Tr7G",
  termos:{versao:"2026-11-v3",arquivo:"dados/consentimento_v3.txt"},   // texto mostrado no CADASTRO DO RESPONSÁVEL (não muda)
  // Texto das AUTORIZAÇÕES POR ESTUDANTE (formulário de cadastrar criança). A versão e o hash do arquivo precisam estar
  // no segredo PM_TEXTOS_CONSENTIMENTO da função gerenciar-crianca (formato  versao:hash). Versão final (v3) já configurada.
  autorizacao_estudante:{versao:"2026-11-v3",arquivo:"dados/consentimento_v3.txt"}
};
