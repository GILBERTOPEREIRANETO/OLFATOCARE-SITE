# ISJ Laudos — V7

Versão de consolidação do MVP do Instituto do Sono Jundiaí.

## V7
- Importação de agenda diária por `.xls` ou `.xlsx`.
- Prévia antes de gravar: horário, paciente, nascimento, CPF, tipo, operadora e status.
- Linhas `CONSULTA`/acompanhante são ignoradas automaticamente.
- `CIPAP` é normalizado para `CPAP`.
- Celular é preferido ao telefone quando disponível.
- Prevenção de duplicidade por fingerprint da linha importada.
- Código/QR do paciente é gerado já no pré-cadastro importado.
- Cadastro manual permanece para encaixes/exceções.
- Data de nascimento passa a ficar visível na lista da recepção.
- PDF final: primeira página reconstruída com o texto revisado + bloco fixo das três assinaturas; páginas técnicas 2+ são preservadas integralmente do PDF enviado pela técnica.

## Antes do deploy
1. Rode `supabase/migrations/007_agenda_import.sql` no SQL Editor.
2. Suba os arquivos no GitHub.
3. A Vercel fará o novo deploy automaticamente.

## Homologação sugerida
Agenda XLS/XLSX → pré-cadastros/códigos → completar pós-exame → técnica → PDF + texto → round-robin → médico → PDF final → portal do paciente.


## Identidade visual
- Logo oficial do Instituto do Sono Jundiaí aplicado na home, portal do paciente, áreas internas, protocolo/QR e cabeçalho do PDF final.

## V7.2 - validação de segurança do PDF

- A técnica passa a validar o nome diretamente no conteúdo do PDF selecionado, sem confiar no texto editável.
- Divergência clara entre paciente cadastrado e paciente identificado no PDF bloqueia o envio ao médico.
- O médico possui uma segunda barreira: antes de finalizar/liberar, o sistema relê o PDF técnico armazenado e bloqueia a liberação em caso de divergência.
- Pequenas diferenças de grafia/acentuação não são tratadas como divergência automática.
- Não há alteração de banco de dados nesta versão.


## V7.4 - validação fail-closed
- Se o sistema não conseguir identificar o paciente no PDF técnico, o envio ao médico é bloqueado.
- A liberação médica também é bloqueada quando a validação do PDF falha ou não encontra nome.
- Divergência de nomes continua bloqueando normalmente.


## V7.4 — confirmação manual segura
- Divergência real entre paciente cadastrado e nome lido no PDF continua bloqueando o fluxo.
- Quando a leitura automática do PDF é inconclusiva, a técnica pode prosseguir somente após confirmação explícita de que conferiu manualmente o paciente.
- O médico repete a barreira antes de finalizar/liberar quando a leitura automática permanece inconclusiva.
- As confirmações manuais ficam registradas em `audit_logs` com etapa, usuário, exame e motivo.
- Não requer nova migração SQL.


## V7.6 — correção da busca
A busca em Recepção/Admin agora filtra corretamente por texto (nome, convênio, médico, tipo) sem depender de maiúsculas/minúsculas ou acentos. A busca numérica por CPF, código ou Neurovirtual só é aplicada quando há dígitos no termo, evitando que buscas apenas textuais retornem todos os exames.


## V2 — Pré-sono digital
- Portal do paciente com questionário pré-exame em 5 etapas.
- Salvamento parcial e conclusão com validação server-side.
- Epworth calculado automaticamente pelo banco.
- Recepção acompanha status: não iniciado / em preenchimento / concluído.
- Técnica recebe resumo estruturado e identificação clínica já inserida na área editável.
- Upload antigo de pré/pós-sono permanece como fallback durante homologação.
- APIs usam exclusivamente SUPABASE_SECRET_KEY no servidor; funções clínicas não são expostas a anon/authenticated.


## V2.1 — correções do pré-sono
- Epworth não exibe 0/24 quando nenhum item foi respondido.
- Mostra pontuação parcial e quantidade de itens respondidos.
- Navegação pelas abas do questionário é livre.
- "Salvar e avançar" muda de etapa somente após confirmação do servidor.
- Endpoints de pré-sono com maxDuration=30s e mensagens de erro mais claras.
- Timeout do navegador preserva as respostas na tela para nova tentativa.


## V2.2 — candidata a produção
- Datas de entrada no portal, pré-sono e pré-cadastro em DD/MM/AAAA.
- Datas exibidas permanecem em pt-BR.
- Pré-sono concluído continua fechado para o paciente.
- Recepção/Admin podem reabrir o mesmo questionário concluído.
- Reabertura é registrada em audit_logs com action pre_sleep_reopened.
- Avisos de conferência do PDF foram preservados sem novas barreiras.

## V2.3 — estudo bruto Neurovirtual na nuvem

Inclui armazenamento operacional do arquivo bruto de polissonografia em bucket privado separado (`isj-psg-raw`).

Fluxo proposto:
1. Recepção envia o exame para a fila técnica como já ocorre.
2. Técnica local abre o exame e envia o estudo bruto Neurovirtual para a nuvem.
3. O upload usa TUS/resumable upload, com barra de progresso e retomada após interrupção.
4. Técnica remota abre o mesmo exame, baixa o estudo bruto e gera o PDF técnico.
5. O restante do fluxo (PDF -> médico -> paciente) permanece igual.

Antes do deploy, rode `supabase/migrations/008_psg_raw_cloud.sql`.

### Importante para arquivos de ~200 MB
O plano Free do Supabase limita uploads a 50 MB. Para testar um estudo real de ~200 MB, migre o projeto para Pro e ajuste em Storage > Settings o limite global de arquivo para um valor acima do maior estudo esperado (por exemplo, 500 MB). O bucket permanece privado e não há acesso do paciente ao estudo bruto.


## V2.3.1 — fluxo Jundiaí → Sorocaba
- Upload do estudo bruto Neurovirtual disponível diretamente na Recepção/Admin, em qualquer exame em andamento.
- Não é necessário criar paciente novo: exames existentes podem receber o arquivo bruto.
- Recepção pode enviar, consultar e substituir o estudo bruto.
- Técnica mantém o download do estudo em Sorocaba.
- Fluxo operacional: Recepção Jundiaí → Supabase Storage privado → Técnica Sorocaba.

- Hotfix 2.3.1: corrigido erro de sintaxe no carregamento dos metadados PSG da Recepção/Admin.


## V2.4 — Registro Técnico da Noite
1. Rode `supabase/migrations/009a_v24_add_polysomnography_role.sql` e aguarde Success.
2. Em nova execução, rode `supabase/migrations/009b_v24_technical_night.sql`.
3. Depois faça deploy do código.
4. Novo perfil: **Técnica de Polissonografia** (`polysomnography_technician`) → `/polissonografia`.
5. O perfil anteriormente chamado "Técnica" passa a ser exibido como **Laudadora**.
6. Recepção/Admin continuam podendo enviar e substituir o estudo bruto.
7. Laudadora pode apenas baixar o estudo bruto.
8. Registro técnico inclui dados gerais, CPAP/titulação, eventos cronológicos e pós-sono.
9. Médico e Laudadora visualizam o registro técnico estruturado junto ao fluxo do laudo.


## V2.4.1 — Hotfix fila Técnica de Polissonografia
- Ao concluir o Registro Técnico da Noite, o exame sai imediatamente da lista "Exames em andamento".
- A fila agora exclui exames cujo `sleep_technical_reports.completed_at` já esteja preenchido.
- O fluxo posterior (Laudadora → Médico) permanece inalterado.
- Não requer novo SQL.


## V2.4.2 — Hotfix datas BR
- Corrigido o pré-cadastro de paciente novo.
- `DD/MM/AAAA` agora é convertido para `YYYY-MM-DD` antes de gravar no Supabase.
- Interface continua exibindo data no padrão brasileiro.
- Não requer SQL.
