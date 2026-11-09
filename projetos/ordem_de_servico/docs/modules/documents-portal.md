# Módulo: Documentos, Assinaturas & Portal Público

Este módulo cobre os canais de formalização jurídica, emissão de termos técnicos e a interface de autoatendimento para os clientes finais da assistência técnica.

---

## 📄 Gestão de Documentos & Assinaturas Digitais (`/documents`)

```mermaid
flowchart LR
    Template["🎨 Designer de Templates (/documents/designer)"]
    OS["⚙️ Dados da OS / Cliente"]
    Gen["⚡ Gerador de Documentos (/documents/generator)"]
    PDF["📄 PDF Renderizado"]
    Sign["✍️ Coleta de Assinatura (/documents/signatures)"]
    QR["📱 Validação por QR Code (/documents/qr-validation)"]

    Template --> Gen
    OS --> Gen
    Gen --> PDF
    PDF --> Sign
    Sign --> QR
```

### Funcionalidades:
1. **Designer Visual de Templates (`/documents/designer`)**:
   - Criação e personalização visual de Ordens de Serviço, Termos de Entrada, Laudos de Diagnóstico, Recibos de Pagamento e Certificados de Garantia.
   - Suporte a tags dinâmicas como `{{empresa.logo}}`, `{{cliente.nome}}`, `{{equipamento.serial}}`, `{{servicos.tabela}}`, `{{valor.total}}`.
2. **Coleta de Assinatura Eletrônica (`/documents/signatures`)**:
   - Coleta de assinatura em tela sensível ao toque (smartphones, tablets no balcão) ou mouse.
   - Carimbo de data/hora (timestamp UTC), endereço IP e hash criptográfico SHA-256 para validade jurídica.
3. **Autenticação por QR Code (`/documents/qr-validation`)**:
   - Cada documento impresso ou gerado em PDF contém um QR Code único.
   - Qualquer pessoa (cliente, fiscalização ou seguradora) pode escanear o código para validar a autenticidade e a versão original do laudo técnico.

---

## 🌐 Portal do Cliente (`/portal`)

Uma área pública segura que permite ao cliente final acompanhar o andamento dos seus equipamentos sem sobrecarregar o atendimento telefônico:

```mermaid
graph TD
    Client["👤 Cliente Acessa Link Seguro / QR Code"]
    Portal["🌐 Portal Público (/portal)"]
    
    subgraph Acoes_Cliente ["Ações Disponíveis ao Cliente"]
        Track["📍 Rastreamento em Tempo Real do Status da OS"]
        Photos["📸 Visualização de Fotos do Diagnóstico"]
        Budget["💵 Aprovação / Recusa de Orçamento com 1 Clique"]
        DocDownload["📥 Download de Laudos, Recibos e Certificados"]
        Chat["💬 Envio de Mensagens e Comprovantes"]
    end

    Client --> Portal
    Portal --> Acoes_Cliente
```

### Recursos do Portal:
- **Acesso Sem Necessidade de Cadastro Complexo**: Autenticação via link único seguro (token temporário) enviado por WhatsApp/E-mail ou consulta rápida por Número da OS + CPF/CNPJ.
- **Customização de Marca (*Branding* / White-label) (`/portal/branding`)**: Apresentação com o logotipo, cores primárias, domínio próprio e dados de contato da sua assistência técnica.
- **Histórico de Garantias (`/portal/guarantees`)**: Consulta rápida de todos os serviços já executados no mesmo aparelho e prazo restante de cobertura.
