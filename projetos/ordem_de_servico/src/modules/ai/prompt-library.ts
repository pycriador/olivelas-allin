import type { Prompt } from "./types";

export const PROMPT_LIBRARY: Omit<Prompt, "id" | "status" | "version" | "history" | "createdAt" | "updatedAt" | "companyId">[] = [
  // ===== OCR (12 prompts) =====
  { name: "OCR - Ordem de Serviço", category: "ocr", description: "Extrair dados de uma OS impressa", template: "Extraia os seguintes campos da Ordem de Serviço: número OS, cliente, CPF/CNPJ, telefone, endereço, aparelho, defeito relatado, valor. Formate como JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "os", "extracao"] },
  { name: "OCR - Recibo", category: "ocr", description: "Extrair dados de recibos", template: "Extraia os dados do recibo: número, data, cliente, valor, forma de pagamento, itens. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "recibo", "extracao"] },
  { name: "OCR - Nota Fiscal", category: "ocr", description: "Extrair dados de nota fiscal", template: "Extraia da nota fiscal: número, série, data emissão, emitente, CNPJ, cliente, valor total, impostos, itens. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "nf", "extracao"] },
  { name: "OCR - Garantia", category: "ocr", description: "Extrair dados de certificado de garantia", template: "Extraia da garantia: número, cliente, aparelho, data início, data fim, cobertura, termos. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "garantia"] },
  { name: "OCR - Orçamento", category: "ocr", description: "Extrair dados de orçamento impresso", template: "Extraia do orçamento: número, data, cliente, itens (serviço/peça), valor unitário, quantidade, desconto, valor total, validade. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "orcamento"] },
  { name: "OCR - Laudo Técnico", category: "ocr", description: "Extrair dados de laudo técnico", template: "Extraia do laudo técnico: número, técnico, data, aparelho, defeitos, diagnóstico, serviços realizados, peças substituídas, observações. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "laudo"] },
  { name: "OCR - Comprovante de Pagamento", category: "ocr", description: "Extrair dados de comprovante", template: "Extraia do comprovante: tipo (PIX/TED/DINHEIRO/CARTÃO), valor, data, recebedor, pagador, código transação, forma pagamento. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "pagamento"] },
  { name: "OCR - Etiqueta de Endereço", category: "ocr", description: "Extrair endereço de etiqueta", template: "Extraia da etiqueta: destinatário, logradouro, número, complemento, bairro, cidade, estado, CEP. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "etiqueta"] },
  { name: "OCR - Documento Pessoal (RG)", category: "ocr", description: "Extrair dados de RG", template: "Extraia do RG: nome, RG, data nascimento, filiação, CPF se presente. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "documento"] },
  { name: "OCR - CNH", category: "ocr", description: "Extrair dados de CNH", template: "Extraia da CNH: nome, número, CPF, data nascimento, categoria, validade. Retorne JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "documento"] },
  { name: "OCR - Texto Livre", category: "ocr", description: "Extrair texto de imagem genérica", template: "Extraia todo o texto legível da imagem. Preserve parágrafos e formatação básica.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "texto"] },
  { name: "OCR - Tabela", category: "ocr", description: "Extrair dados tabulares de imagem", template: "Identifique e extraia dados tabulares da imagem. Retorne como array de objetos JSON.", isGlobal: true, variables: [], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["ocr", "tabela"] },

  // ===== Ordem de Serviço (10 prompts) =====
  { name: "OS - Resumo", category: "service-order", description: "Resumir dados da OS para técnico", template: "Resuma a Ordem de Serviço #{osNumber} para o técnico {technicianName}: cliente {customerName}, aparelho {deviceName}, defeito {defectReported}. Destaque pontos críticos.", isGlobal: true, variables: [
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "technicianName", label: "Nome Técnico", type: "text", required: true },
    { name: "customerName", label: "Nome Cliente", type: "text", required: true },
    { name: "deviceName", label: "Aparelho", type: "text", required: true },
    { name: "defectReported", label: "Defeito Relatado", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["os", "resumo"] },
  { name: "OS - Sugestão de Diagnóstico", category: "service-order", description: "Sugerir diagnóstico baseado em sintomas", template: "Com base nos sintomas: {symptoms} para o aparelho {deviceBrand} {deviceModel}, sugestão de diagnóstico: causas prováveis, testes recomendados, peças que podem ser necessárias.", isGlobal: true, variables: [
    { name: "symptoms", label: "Sintomas", type: "text", required: true },
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
  ], temperature: 0.4, suggestedModel: "gpt-4o", tags: ["os", "diagnostico"] },
  { name: "OS - Classificar Prioridade", category: "service-order", description: "Classificar prioridade automaticamente", template: "Classifique a prioridade desta OS com base em: defeito: {defect}, cliente VIP: {isVip}, dias em aberto: {daysOpen}. Retorne apenas: low/medium/high/critical.", isGlobal: true, variables: [
    { name: "defect", label: "Defeito", type: "text", required: true },
    { name: "isVip", label: "Cliente VIP", type: "text", required: true },
    { name: "daysOpen", label: "Dias em Aberto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["os", "classificacao"] },
  { name: "OS - Sugerir Peças", category: "service-order", description: "Sugerir peças para diagnóstico", template: "Para o reparo de {defect} em {deviceBrand} {deviceModel}, sugira peças necessárias com estimativa de custo. Considere compatibilidade.", isGlobal: true, variables: [
    { name: "defect", label: "Defeito", type: "text", required: true },
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
  ], temperature: 0.4, suggestedModel: "gpt-4o", tags: ["os", "pecas"] },
  { name: "OS - Comunicar Cliente", category: "service-order", description: "Gerar comunicado para cliente", template: "Gere uma mensagem para o cliente {customerName} sobre o andamento da OS #{osNumber}. Status atual: {status}. Tom profissional e cordial.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome Cliente", type: "text", required: true },
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "status", label: "Status", type: "text", required: true },
  ], temperature: 0.5, suggestedModel: "gpt-4o-mini", tags: ["os", "comunicacao"] },
  { name: "OS - Gerar Laudo", category: "service-order", description: "Gerar texto de laudo técnico", template: "Gere um laudo técnico para OS #{osNumber}. Cliente: {customerName}. Aparelho: {deviceName}. Serviço realizado: {servicePerformed}. Peças: {partsUsed}. Técnico: {techName}. Use linguagem técnica mas acessível ao cliente.", isGlobal: true, variables: [
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "customerName", label: "Nome Cliente", type: "text", required: true },
    { name: "deviceName", label: "Aparelho", type: "text", required: true },
    { name: "servicePerformed", label: "Serviço Realizado", type: "text", required: true },
    { name: "partsUsed", label: "Peças Utilizadas", type: "text", required: false },
    { name: "techName", label: "Nome Técnico", type: "text", required: true },
  ], temperature: 0.4, suggestedModel: "gpt-4o", tags: ["os", "laudo", "documento"] },
  { name: "OS - Estimar Tempo", category: "service-order", description: "Estimar tempo de serviço", template: "Estime o tempo necessário (em horas) para: {serviceType} em {deviceBrand} {deviceModel}. Defeito: {defect}. Considere complexidade.", isGlobal: true, variables: [
    { name: "serviceType", label: "Tipo Serviço", type: "text", required: true },
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
    { name: "defect", label: "Defeito", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o-mini", tags: ["os", "tempo"] },
  { name: "OS - Checklist Pós-Serviço", category: "service-order", description: "Gerar checklist de verificação", template: "Gere um checklist de verificação pós-serviço para OS #{osNumber}: itens de qualidade, testes funcionais, limpeza, conferência de peças. Aparelho: {deviceName}. Serviço: {servicePerformed}.", isGlobal: true, variables: [
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "deviceName", label: "Aparelho", type: "text", required: true },
    { name: "servicePerformed", label: "Serviço Realizado", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["os", "checklist"] },
  { name: "OS - Sugerir Garantia", category: "service-order", description: "Sugerir garantia para serviço", template: "Sugira prazo e cobertura de garantia para: tipo de serviço: {serviceType}, valor: {value}, peças: {partsUsed}. Considere padrões do mercado.", isGlobal: true, variables: [
    { name: "serviceType", label: "Tipo Serviço", type: "text", required: true },
    { name: "value", label: "Valor", type: "text", required: true },
    { name: "partsUsed", label: "Peças Utilizadas", type: "text", required: false },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["os", "garantia"] },
  { name: "OS - Análise de Satisfação", category: "service-order", description: "Analisar feedback do cliente", template: "Analise o feedback do cliente {customerName} sobre OS #{osNumber}: '{feedback}'. Identifique sentimento, pontos positivos, pontos negativos, sugestões.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome Cliente", type: "text", required: true },
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "feedback", label: "Feedback", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["os", "feedback", "analise"] },

  // ===== Clientes (7 prompts) =====
  { name: "Cliente - Classificar Perfil", category: "customer", description: "Classificar perfil de cliente", template: "Classifique o perfil do cliente: {customerName}, gasto total: {totalSpent}, OS realizadas: {orderCount}, última visita: {lastVisit}. Categorias: bronze/prata/ouro/vip.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome", type: "text", required: true },
    { name: "totalSpent", label: "Gasto Total", type: "text", required: true },
    { name: "orderCount", label: "Quantidade OS", type: "text", required: true },
    { name: "lastVisit", label: "Última Visita", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["cliente", "classificacao"] },
  { name: "Cliente - Detectar Duplicidade", category: "customer", description: "Detectar possíveis duplicidades", template: "Compare: {customer1} (CPF: {cpf1}, tel: {phone1}) com {customer2} (CPF: {cpf2}, tel: {phone2}). Probabilidade de duplicidade (0-100%). Indique campos coincidentes.", isGlobal: true, variables: [
    { name: "customer1", label: "Cliente 1", type: "text", required: true },
    { name: "cpf1", label: "CPF 1", type: "text", required: true },
    { name: "phone1", label: "Telefone 1", type: "text", required: false },
    { name: "customer2", label: "Cliente 2", type: "text", required: true },
    { name: "cpf2", label: "CPF 2", type: "text", required: true },
    { name: "phone2", label: "Telefone 2", type: "text", required: false },
  ], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["cliente", "duplicidade"] },
  { name: "Cliente - Sugerir Endereço", category: "customer", description: "Completar/complementar endereço", template: "Complete o endereço: {partialAddress}. Preencha bairro, cidade, estado e CEP se possível.", isGlobal: true, variables: [
    { name: "partialAddress", label: "Endereço Parcial", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o-mini", tags: ["cliente", "endereco"] },
  { name: "Cliente - Resumo de Histórico", category: "customer", description: "Resumir histórico do cliente", template: "Resuma o histórico do cliente {customerName}: {osCount} OS realizadas, total gasto: {totalSpent}, aparelhos: {devices}, última visita: {lastVisit}, status: {status}. Destaque fatos relevantes.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome", type: "text", required: true },
    { name: "osCount", label: "Qtd OS", type: "text", required: true },
    { name: "totalSpent", label: "Total Gasto", type: "text", required: true },
    { name: "devices", label: "Aparelhos", type: "text", required: false },
    { name: "lastVisit", label: "Última Visita", type: "text", required: true },
    { name: "status", label: "Status", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["cliente", "resumo"] },
  { name: "Cliente - Sugerir Comunicação", category: "customer", description: "Sugerir melhor canal de comunicação", template: "Para o cliente {customerName} (idade: {age}, perfil: {profile}), sugira o melhor canal de comunicação: WhatsApp/Email/Telefone/SMS. Justifique.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome", type: "text", required: true },
    { name: "age", label: "Idade", type: "text", required: true },
    { name: "profile", label: "Perfil", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["cliente", "comunicacao"] },
  { name: "Cliente - Gerar Mensagem Cobrança", category: "customer", description: "Gerar mensagem de cobrança personalizada", template: "Gere mensagem de cobrança para {customerName} referente OS #{osNumber}, valor: {value}, vencimento: {dueDate}. Tom profissional e cordial. Inclua dados para pagamento.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome", type: "text", required: true },
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "value", label: "Valor", type: "text", required: true },
    { name: "dueDate", label: "Vencimento", type: "text", required: true },
  ], temperature: 0.4, suggestedModel: "gpt-4o-mini", tags: ["cliente", "cobranca"] },
  { name: "Cliente - Aniversário", category: "customer", description: "Gerar mensagem de aniversário", template: "Gere mensagem de aniversário personalizada para {customerName}. Cliente desde {sinceYear}. Tom cordial e profissional. Mencione parceria.", isGlobal: true, variables: [
    { name: "customerName", label: "Nome", type: "text", required: true },
    { name: "sinceYear", label: "Cliente Desde", type: "text", required: true },
  ], temperature: 0.5, suggestedModel: "gpt-4o-mini", tags: ["cliente", "marketing"] },

  // ===== Aparelhos (6 prompts) =====
  { name: "Aparelho - Identificar por Características", category: "device", description: "Identificar modelo por descrição", template: "Com base na descrição '{description}', identifique: marca provável, modelo, ano aproximado, especificações técnicas.", isGlobal: true, variables: [
    { name: "description", label: "Descrição", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["aparelho", "identificacao"] },
  { name: "Aparelho - Sugerir Valor de Mercado", category: "device", description: "Estimar valor de mercado", template: "Estime o valor de mercado para: {deviceBrand} {deviceModel} ({year}), condição: {condition}, acessórios: {accessories}. Considere depreciação.", isGlobal: true, variables: [
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
    { name: "year", label: "Ano", type: "text", required: true },
    { name: "condition", label: "Condição", type: "text", required: true },
    { name: "accessories", label: "Acessórios", type: "text", required: false },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["aparelho", "valor"] },
  { name: "Aparelho - Histórico de Problemas", category: "device", description: "Listar problemas comuns do modelo", template: "Liste problemas comuns do {deviceBrand} {deviceModel}: defeitos frequentes, peças que mais quebram, dicas de reparo, recalls conhecidos.", isGlobal: true, variables: [
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["aparelho", "defeitos"] },
  { name: "Aparelho - Compatibilidade de Peças", category: "device", description: "Verificar compatibilidade", template: "A peça {partName} ({partCode}) é compatível com {deviceBrand} {deviceModel}? Indique se é original, similar ou incompatível.", isGlobal: true, variables: [
    { name: "partName", label: "Nome Peça", type: "text", required: true },
    { name: "partCode", label: "Código Peça", type: "text", required: false },
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["aparelho", "pecas"] },
  { name: "Aparelho - Resumo Técnico", category: "device", description: "Gerar resumo técnico do aparelho", template: "Resumo técnico: {deviceBrand} {deviceModel} ({year}). Componentes principais, especificações, pontos fortes/frágeis, facilidade de reparo (1-5).", isGlobal: true, variables: [
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
    { name: "year", label: "Ano", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o-mini", tags: ["aparelho", "resumo"] },
  { name: "Aparelho - Sugerir Acessórios", category: "device", description: "Sugerir acessórios compatíveis", template: "Sugira acessórios compatíveis com {deviceBrand} {deviceModel}: carregadores, capas, películas, fones. Considere qualidade e custo-benefício.", isGlobal: true, variables: [
    { name: "deviceBrand", label: "Marca", type: "text", required: true },
    { name: "deviceModel", label: "Modelo", type: "text", required: true },
  ], temperature: 0.4, suggestedModel: "gpt-4o-mini", tags: ["aparelho", "acessorios"] },

  // ===== Financeiro (7 prompts) =====
  { name: "Financeiro - Analisar Fluxo de Caixa", category: "financial", description: "Analisar fluxo financeiro", template: "Analise o fluxo de caixa: receitas: {revenue}, despesas: {expenses}, período: {period}. Saldo: {balance}. Sugira melhorias.", isGlobal: true, variables: [
    { name: "revenue", label: "Receitas", type: "text", required: true },
    { name: "expenses", label: "Despesas", type: "text", required: true },
    { name: "period", label: "Período", type: "text", required: true },
    { name: "balance", label: "Saldo", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["financeiro", "analise"] },
  { name: "Financeiro - Sugerir Preço", category: "financial", description: "Sugerir preço para serviço", template: "Sugira preço para: serviço: {serviceName}, custo mão de obra: {laborCost}, peças: {partsCost}, complexidade: {complexity}, margem desejada: {margin}. Considere mercado local.", isGlobal: true, variables: [
    { name: "serviceName", label: "Serviço", type: "text", required: true },
    { name: "laborCost", label: "Custo Mão Obra", type: "text", required: true },
    { name: "partsCost", label: "Custo Peças", type: "text", required: true },
    { name: "complexity", label: "Complexidade", type: "text", required: true },
    { name: "margin", label: "Margem (%)", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o", tags: ["financeiro", "precificacao"] },
  { name: "Financeiro - Classificar Despesa", category: "financial", description: "Classificar tipo de despesa", template: "Classifique a despesa: {description}, valor: {value}, data: {date}. Categorias: fixa/variavel/operacional/investimento/extraordinaria.", isGlobal: true, variables: [
    { name: "description", label: "Descrição", type: "text", required: true },
    { name: "value", label: "Valor", type: "text", required: true },
    { name: "date", label: "Data", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["financeiro", "classificacao"] },
  { name: "Financeiro - Detectar Anomalia", category: "financial", description: "Detectar transações anômalas", template: "Analise: transações do período {period}. Média: {avgValue}, maior: {maxValue}, menor: {minValue}. Detectar anomalias ou valores suspeitos.", isGlobal: true, variables: [
    { name: "period", label: "Período", type: "text", required: true },
    { name: "avgValue", label: "Valor Médio", type: "text", required: true },
    { name: "maxValue", label: "Maior Valor", type: "text", required: true },
    { name: "minValue", label: "Menor Valor", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["financeiro", "anomalia"] },
  { name: "Financeiro - Projeção", category: "financial", description: "Projetar faturamento", template: "Com base nos últimos {months} meses: {monthlyData}, projete faturamento para os próximos 3 meses. Considere sazonalidade e tendências.", isGlobal: true, variables: [
    { name: "months", label: "Meses Base", type: "text", required: true },
    { name: "monthlyData", label: "Dados Mensais", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o", tags: ["financeiro", "projecao"] },
  { name: "Financeiro - Sugerir Parcelamento", category: "financial", description: "Sugerir melhor condição de parcelamento", template: "Valor: {value}, perfil cliente: {profile}, histórico: {history}. Sugira melhor condição de parcelamento (parcelas, juros, entrada).", isGlobal: true, variables: [
    { name: "value", label: "Valor", type: "text", required: true },
    { name: "profile", label: "Perfil Cliente", type: "text", required: true },
    { name: "history", label: "Histórico", type: "text", required: false },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["financeiro", "parcelamento"] },
  { name: "Financeiro - Relatório Resumido", category: "financial", description: "Gerar relatório resumido", template: "Gere relatório financeiro resumido: período: {period}, receita: {revenue}, despesas: {expenses}, lucro: {profit}, margem: {margin}. Destaques e alertas.", isGlobal: true, variables: [
    { name: "period", label: "Período", type: "text", required: true },
    { name: "revenue", label: "Receita", type: "text", required: true },
    { name: "expenses", label: "Despesas", type: "text", required: true },
    { name: "profit", label: "Lucro", type: "text", required: true },
    { name: "margin", label: "Margem", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["financeiro", "relatorio"] },

  // ===== Documentos (6 prompts) =====
  { name: "Documento - Gerar Contrato", category: "document", description: "Gerar contrato de prestação de serviços", template: "Gere minuta de contrato de prestação de serviços para: contratante: {customerName}, serviços: {services}, valor: {value}, prazo: {deadline}, garantia: {warranty}. Linguagem jurídica formal.", isGlobal: true, variables: [
    { name: "customerName", label: "Contratante", type: "text", required: true },
    { name: "services", label: "Serviços", type: "text", required: true },
    { name: "value", label: "Valor", type: "text", required: true },
    { name: "deadline", label: "Prazo", type: "text", required: true },
    { name: "warranty", label: "Garantia", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["documento", "contrato"] },
  { name: "Documento - Gerar Termo de Garantia", category: "document", description: "Gerar termo de garantia", template: "Gere termo de garantia para: cliente: {customerName}, aparelho: {deviceName}, serviço: {serviceRepaired}, garantia: {warrantyDays} dias, cobertura: {coverage}. Termos e condições.", isGlobal: true, variables: [
    { name: "customerName", label: "Cliente", type: "text", required: true },
    { name: "deviceName", label: "Aparelho", type: "text", required: true },
    { name: "serviceRepaired", label: "Serviço", type: "text", required: true },
    { name: "warrantyDays", label: "Dias Garantia", type: "text", required: true },
    { name: "coverage", label: "Cobertura", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["documento", "garantia"] },
  { name: "Documento - Resumir Documento", category: "document", description: "Resumir documento extenso", template: "Resuma o documento abaixo em até {maxSentences} frases. Preserve dados importantes: datas, valores, partes envolvidas. Documento: {documentText}.", isGlobal: true, variables: [
    { name: "maxSentences", label: "Máx Frases", type: "text", required: true },
    { name: "documentText", label: "Texto Documento", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o-mini", tags: ["documento", "resumo"] },
  { name: "Documento - Classificar Tipo", category: "document", description: "Classificar tipo de documento", template: "Classifique o documento: '{documentText}'. Tipos: contrato/recibo/nota-fiscal/orçamento/laudo/garantia/comprovante/outro. Confiança: 0-100%.", isGlobal: true, variables: [
    { name: "documentText", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["documento", "classificacao"] },
  { name: "Documento - Extrair Metadados", category: "document", description: "Extrair metadados de documento", template: "Extraia metadados do documento: tipo, data, número, autor, destinatário, assunto, palavras-chave. Texto: {documentText}.", isGlobal: true, variables: [
    { name: "documentText", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["documento", "extracao"] },
  { name: "Documento - Validar Preenchimento", category: "document", description: "Validar campos de documento", template: "Valide o documento: {documentText}. Verifique: campos obrigatórios preenchidos, valores consistentes, datas válidas, assinaturas. Liste problemas.", isGlobal: true, variables: [
    { name: "documentText", label: "Texto Documento", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o", tags: ["documento", "validacao"] },

  // ===== Comunicação (5 prompts) =====
  { name: "Comunicação - Sugerir Resposta", category: "communication", description: "Sugerir resposta para cliente", template: "Cliente: {customerName}, mensagem: '{message}', contexto: {context}. Sugira resposta profissional e empática. Tom cordial.", isGlobal: true, variables: [
    { name: "customerName", label: "Cliente", type: "text", required: true },
    { name: "message", label: "Mensagem", type: "text", required: true },
    { name: "context", label: "Contexto", type: "text", required: true },
  ], temperature: 0.4, suggestedModel: "gpt-4o-mini", tags: ["comunicacao", "resposta"] },
  { name: "Comunicação - Classificar Sentimento", category: "communication", description: "Classificar sentimento de mensagem", template: "Classifique o sentimento da mensagem: '{message}'. Sentimentos: positivo/negativo/neutro/urgente/reclamação. Confiança 0-100%.", isGlobal: true, variables: [
    { name: "message", label: "Mensagem", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["comunicacao", "sentimento"] },
  { name: "Comunicação - Extrair Informações", category: "communication", description: "Extrair dados de mensagem", template: "Extraia da mensagem: '{message}': cliente, assunto, data, telefone, solicitação, prioridade. Retorne JSON.", isGlobal: true, variables: [
    { name: "message", label: "Mensagem", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["comunicacao", "extracao"] },
  { name: "Comunicação - Gerar E-mail Marketing", category: "communication", description: "Gerar e-mail de marketing", template: "Gere e-mail marketing para: campanha: {campaignName}, público: {audience}, oferta: {offer}. Tom persuasivo mas profissional. Inclua call-to-action.", isGlobal: true, variables: [
    { name: "campaignName", label: "Campanha", type: "text", required: true },
    { name: "audience", label: "Público", type: "text", required: true },
    { name: "offer", label: "Oferta", type: "text", required: true },
  ], temperature: 0.6, suggestedModel: "gpt-4o", tags: ["comunicacao", "marketing"] },
  { name: "Comunicação - Detectar Urgência", category: "communication", description: "Detectar nível de urgência", template: "Mensagem: '{message}'. Nível de urgência: baixa/média/alta/crítica. Justifique com indicadores de urgência identificados.", isGlobal: true, variables: [
    { name: "message", label: "Mensagem", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["comunicacao", "urgencia"] },

  // ===== Sumários (5 prompts) =====
  { name: "Resumo - OS do Dia", category: "summary", description: "Resumir OS do dia", template: "Resuma as ordens de serviço do dia {date}: total: {total}, concluídas: {completed}, pendentes: {pending}, faturamento: {revenue}. Destaques.", isGlobal: true, variables: [
    { name: "date", label: "Data", type: "text", required: true },
    { name: "total", label: "Total", type: "text", required: true },
    { name: "completed", label: "Concluídas", type: "text", required: true },
    { name: "pending", label: "Pendentes", type: "text", required: true },
    { name: "revenue", label: "Faturamento", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["resumo", "os"] },
  { name: "Resumo - Atividades do Técnico", category: "summary", description: "Resumir atividades do técnico", template: "Resuma atividades do técnico {techName} em {date}: atividades realizadas: {activitiesCount}, tempo total: {totalTime}, OS concluídas: {completedCount}.", isGlobal: true, variables: [
    { name: "techName", label: "Técnico", type: "text", required: true },
    { name: "date", label: "Data", type: "text", required: true },
    { name: "activitiesCount", label: "Atividades", type: "text", required: true },
    { name: "totalTime", label: "Tempo Total", type: "text", required: true },
    { name: "completedCount", label: "Concluídas", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["resumo", "tecnico"] },
  { name: "Resumo - Financeiro Semanal", category: "summary", description: "Resumir financeiro da semana", template: "Resumo financeiro semanal ({week}): receita: {revenue}, despesas: {expenses}, lucro: {profit}, OS pagas: {paidCount}, a receber: {pendingCount}.", isGlobal: true, variables: [
    { name: "week", label: "Semana", type: "text", required: true },
    { name: "revenue", label: "Receita", type: "text", required: true },
    { name: "expenses", label: "Despesas", type: "text", required: true },
    { name: "profit", label: "Lucro", type: "text", required: true },
    { name: "paidCount", label: "Pagas", type: "text", required: true },
    { name: "pendingCount", label: "Pendentes", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["resumo", "financeiro"] },
  { name: "Resumo - Estoque", category: "summary", description: "Resumir situação do estoque", template: "Resumo do estoque: total itens: {totalItems}, valor total: {totalValue}, itens críticos (abaixo mínimo): {criticalItems}, itens a vencer: {expiringItems}.", isGlobal: true, variables: [
    { name: "totalItems", label: "Total Itens", type: "text", required: true },
    { name: "totalValue", label: "Valor Total", type: "text", required: true },
    { name: "criticalItems", label: "Itens Críticos", type: "text", required: true },
    { name: "expiringItems", label: "Vencendo", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o-mini", tags: ["resumo", "estoque"] },
  { name: "Resumo - Clientes Novos", category: "summary", description: "Resumir novos clientes do período", template: "Novos clientes no período {period}: {count}. Principais setores: {segments}, ticket médio: {avgTicket}. Sugira ações de boas-vindas.", isGlobal: true, variables: [
    { name: "period", label: "Período", type: "text", required: true },
    { name: "count", label: "Quantidade", type: "text", required: true },
    { name: "segments", label: "Setores", type: "text", required: false },
    { name: "avgTicket", label: "Ticket Médio", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o-mini", tags: ["resumo", "clientes"] },

  // ===== Classificação (5 prompts) =====
  { name: "Classificação - Defeito por Tipo", category: "classification", description: "Classificar tipo de defeito", template: "Classifique o defeito '{defectDescription}' em: elétrico/mecânico/software/tela/bateria/carregador/conector/outro. Confiança 0-100%.", isGlobal: true, variables: [
    { name: "defectDescription", label: "Descrição Defeito", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["classificacao", "defeito"] },
  { name: "Classificação - Prioridade OS", category: "classification", description: "Classificar prioridade automaticamente", template: "Classifique prioridade: defeito: {defect}, cliente especial: {isSpecial}, dias parado: {daysStopped}. Retorne: low/medium/high/critical + justificativa.", isGlobal: true, variables: [
    { name: "defect", label: "Defeito", type: "text", required: true },
    { name: "isSpecial", label: "Cliente Especial", type: "text", required: true },
    { name: "daysStopped", label: "Dias Parado", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["classificacao", "os"] },
  { name: "Classificação - Tipo de Serviço", category: "classification", description: "Classificar tipo de serviço", template: "Classifique o serviço: '{serviceDescription}' em: reparo/manutenção/instalação/consulta/garantia/urgente. Confiança.", isGlobal: true, variables: [
    { name: "serviceDescription", label: "Descrição", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["classificacao", "servico"] },
  { name: "Classificação - Canal de Entrada", category: "classification", description: "Classificar canal de origem", template: "Identifique canal de origem: '{description}': presencial/whatsapp/telefone/email/site/indicacao. Confiança.", isGlobal: true, variables: [
    { name: "description", label: "Descrição", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["classificacao", "origem"] },
  { name: "Classificação - Tipo de Cliente", category: "classification", description: "Classificar tipo de cliente", template: "Classifique: '{data}' em: PF (pessoa física) ou PJ (pessoa jurídica). Extraia nome/razão social e documento se presente.", isGlobal: true, variables: [
    { name: "data", label: "Dados", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["classificacao", "cliente"] },

  // ===== Extração (6 prompts) =====
  { name: "Extração - Dados do Cliente", category: "extraction", description: "Extrair dados de cadastro", template: "Extraia dados de cadastro: {text}. Campos: nome, CPF/CNPJ, telefone, email, endereço, cidade, estado. Retorne JSON.", isGlobal: true, variables: [
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["extracao", "cliente"] },
  { name: "Extração - Dados do Aparelho", category: "extraction", description: "Extrair dados de aparelho", template: "Extraia dados do aparelho: {text}. Campos: marca, modelo, serial, IMEI, cor, acessórios, condição. Retorne JSON.", isGlobal: true, variables: [
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["extracao", "aparelho"] },
  { name: "Extração - Valores Financeiros", category: "extraction", description: "Extrair valores de texto", template: "Extraia valores financeiros de: {text}. Identifique: valor total, desconto, juros, parcelas, entrada, forma pagamento. Retorne JSON.", isGlobal: true, variables: [
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["extracao", "financeiro"] },
  { name: "Extração - Datas e Prazos", category: "extraction", description: "Extrair datas e prazos", template: "Extraia datas e prazos de: {text}. Identifique: data emissão, data vencimento, prazo garantia, prazo entrega, datas importantes. Retorne JSON.", isGlobal: true, variables: [
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["extracao", "datas"] },
  { name: "Extração - Números de Série", category: "extraction", description: "Extrair números de série", template: "Extraia números de série e códigos de: {text}. Procure: serial, IMEI, código de barras, QR code, número de patrimônio. Retorne JSON.", isGlobal: true, variables: [
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["extracao", "serial"] },
  { name: "Extração - Endereço Completo", category: "extraction", description: "Extrair endereço completo", template: "Extraia endereço completo de: {text}. Campos: logradouro, número, complemento, bairro, cidade, estado, CEP. Retorne JSON.", isGlobal: true, variables: [
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["extracao", "endereco"] },

  // ===== Validação (6 prompts) =====
  { name: "Validação - CPF/CNPJ", category: "validation", description: "Validar CPF ou CNPJ", template: "Valide o documento: '{document}'. Determine se é CPF ou CNPJ, valide dígitos verificadores, formate corretamente. Retorne resultado da validação.", isGlobal: true, variables: [
    { name: "document", label: "Documento", type: "text", required: true },
  ], temperature: 0.0, suggestedModel: "gpt-4o-mini", tags: ["validacao", "documento"] },
  { name: "Validação - OS Completa", category: "validation", description: "Validar OS completa antes de fechar", template: "Valide OS #{osNumber}: cliente preenchido ({customerStatus}), aparelho ({deviceStatus}), defeito ({defectStatus}), diagnóstico ({diagnosticStatus}), serviços ({servicesStatus}), pagamento ({paymentStatus}). Liste pendências.", isGlobal: true, variables: [
    { name: "osNumber", label: "Número OS", type: "text", required: true },
    { name: "customerStatus", label: "Status Cliente", type: "text", required: true },
    { name: "deviceStatus", label: "Status Aparelho", type: "text", required: true },
    { name: "defectStatus", label: "Status Defeito", type: "text", required: true },
    { name: "diagnosticStatus", label: "Status Diagnóstico", type: "text", required: true },
    { name: "servicesStatus", label: "Status Serviços", type: "text", required: true },
    { name: "paymentStatus", label: "Status Pagamento", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["validacao", "os"] },
  { name: "Validação - Endereço", category: "validation", description: "Validar endereço", template: "Valide o endereço: '{address}'. Verifique CEP, cidade/estado consistentes, logradouro completo, número. Liste problemas encontrados.", isGlobal: true, variables: [
    { name: "address", label: "Endereço", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["validacao", "endereco"] },
  { name: "Validação - Dados Bancários", category: "validation", description: "Validar dados bancários", template: "Valide dados bancários: banco: {bank}, agência: {agency}, conta: {account}, tipo: {accountType}, titular: {holder}. Verifique formato.", isGlobal: true, variables: [
    { name: "bank", label: "Banco", type: "text", required: true },
    { name: "agency", label: "Agência", type: "text", required: true },
    { name: "account", label: "Conta", type: "text", required: true },
    { name: "accountType", label: "Tipo Conta", type: "text", required: true },
    { name: "holder", label: "Titular", type: "text", required: true },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["validacao", "bancario"] },
  { name: "Validação - Garantia", category: "validation", description: "Validar condição de garantia", template: "Verifique garantia: data serviço: {serviceDate}, garantia: {warrantyDays} dias, data atual: {currentDate}. Garantia vigente? Calcule data de expiração.", isGlobal: true, variables: [
    { name: "serviceDate", label: "Data Serviço", type: "text", required: true },
    { name: "warrantyDays", label: "Dias Garantia", type: "text", required: true },
    { name: "currentDate", label: "Data Atual", type: "text", required: true },
  ], temperature: 0.0, suggestedModel: "gpt-4o-mini", tags: ["validacao", "garantia"] },
  { name: "Validação - Dados Técnico", category: "validation", description: "Validar dados do técnico", template: "Valide dados do técnico: nome: {name}, CPF: {cpf}, conselho: {council}, especialidades: {specialties}. Verifique formato e consistência.", isGlobal: true, variables: [
    { name: "name", label: "Nome", type: "text", required: true },
    { name: "cpf", label: "CPF", type: "text", required: true },
    { name: "council", label: "Conselho", type: "text", required: false },
    { name: "specialties", label: "Especialidades", type: "text", required: false },
  ], temperature: 0.1, suggestedModel: "gpt-4o-mini", tags: ["validacao", "tecnico"] },

  // ===== Gerais/Misc (5 prompts) =====
  { name: "Análise - Tendências de Defeitos", category: "classification", description: "Analisar tendências de defeitos", template: "Analise dados de defeitos do período {period}: {defectData}. Identifique: defeitos mais comuns, sazonalidade, tendências, sugestões de prevenção.", isGlobal: true, variables: [
    { name: "period", label: "Período", type: "text", required: true },
    { name: "defectData", label: "Dados Defeitos", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["analise", "defeitos"] },
  { name: "Análise - Performance Técnicos", category: "classification", description: "Analisar performance de técnicos", template: "Analise performance dos técnicos: {techData}. Métricas: OS concluídas, tempo médio, reincidência, satisfação cliente. Rankings.", isGlobal: true, variables: [
    { name: "techData", label: "Dados Técnicos", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o", tags: ["analise", "tecnico"] },
  { name: "Geral - Sugerir Nome Empresa", category: "extraction", description: "Sugerir nome para empresa", template: "Sugira 5 nomes para empresa de assistência técnica especializada em {specialty}. Nomes criativos, disponíveis, com domínio .com.br.", isGlobal: true, variables: [
    { name: "specialty", label: "Especialidade", type: "text", required: true },
  ], temperature: 0.7, suggestedModel: "gpt-4o", tags: ["geral", "sugestao"] },
  { name: "Geral - Responder Pergunta Técnica", category: "validation", description: "Responder pergunta técnica", template: "Pergunta técnica: '{question}'. Responda de forma clara e precisa. Considere boas práticas e segurança.", isGlobal: true, variables: [
    { name: "question", label: "Pergunta", type: "text", required: true },
  ], temperature: 0.3, suggestedModel: "gpt-4o", tags: ["geral", "tecnico"] },
  { name: "Geral - Traduzir Texto", category: "communication", description: "Traduzir texto entre idiomas", template: "Traduza o texto abaixo de {sourceLang} para {targetLang}. Preserve formatação e termos técnicos. Texto: {text}.", isGlobal: true, variables: [
    { name: "sourceLang", label: "Idioma Origem", type: "text", required: true },
    { name: "targetLang", label: "Idioma Destino", type: "text", required: true },
    { name: "text", label: "Texto", type: "text", required: true },
  ], temperature: 0.2, suggestedModel: "gpt-4o", tags: ["geral", "traducao"] },
];
