import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

async function runSeed() {
  const pool = new Pool({
    host: process.env.host || 'aws-0-ca-central-1.pooler.supabase.com',
    port: parseInt(process.env.port || '5432', 10),
    database: process.env.database || 'postgres',
    user: process.env.user || 'postgres.pkbjoxzqllextmtmjoia',
    password: process.env.password || 'viDXv2XHa8cdU6Sz',
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('[Seed] Connected to database!');

    // 1. Seed Users (Single Global Admin: willian.o.jesus@gmail.com)
    console.log('[Seed] Seeding IAM Users (Single Global Admin)...');
    await client.query(`DELETE FROM olivelas_iam_forms_users WHERE lower(email) <> 'willian.o.jesus@gmail.com';`);
    const usersData = [
      {
        auth_id: '00000000-0000-0000-0000-000000000001',
        email: 'willian.o.jesus@gmail.com',
        full_name: 'Willian Jesus (Global Admin)',
        role: 'admin',
        status: 'active',
        department: 'Diretoria Executiva & Engenharia',
        password_hash: null,
      },
    ];

    const userMap: Record<string, string> = {};

    for (const u of usersData) {
      const res = await client.query(
        `INSERT INTO olivelas_iam_forms_users (auth_id, email, full_name, role, status, department, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET 
           auth_id = COALESCE(EXCLUDED.auth_id, olivelas_iam_forms_users.auth_id),
           full_name = EXCLUDED.full_name,
           role = EXCLUDED.role,
           department = EXCLUDED.department
         RETURNING id, email;`,
        [u.auth_id, u.email, u.full_name, u.role, u.status, u.department, u.password_hash]
      );
      const willianId = res.rows[0].id;
      userMap['willian.o.jesus@gmail.com'] = willianId;
      userMap['py.criador@gmail.com'] = willianId;
      userMap['admin@olivelas.com'] = willianId;
      userMap['creator@olivelas.com'] = willianId;
      userMap['editor@olivelas.com'] = willianId;
      userMap['viewer@olivelas.com'] = willianId;
    }

    // 2. Seed Groups
    console.log('[Seed] Seeding Groups...');
    const groupsData = [
      { name: 'Administradores do Sistema', description: 'Acesso total a governança, HBAC, tokens e auditoria', color: '#6366f1' },
      { name: 'Criadores de Pesquisa & RH', description: 'Criação de formulários internos de clima, feedback e recrutamento', color: '#0ea5e9' },
      { name: 'Auditores e Analistas de Dados', description: 'Visualização de dashboards gerenciais e relatórios consolidados', color: '#10b981' },
    ];

    const groupMap: Record<string, string> = {};
    for (const g of groupsData) {
      const res = await client.query(
        `INSERT INTO olivelas_iam_forms_groups (name, description, color, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color = EXCLUDED.color
         RETURNING id, name;`,
        [g.name, g.description, g.color, userMap['admin@olivelas.com']]
      );
      groupMap[res.rows[0].name] = res.rows[0].id;
    }

    // Link user groups
    await client.query(
      `INSERT INTO olivelas_iam_forms_user_groups (user_id, group_id)
       VALUES ($1, $2), ($3, $4), ($5, $6)
       ON CONFLICT DO NOTHING;`,
      [
        userMap['admin@olivelas.com'], groupMap['Administradores do Sistema'],
        userMap['creator@olivelas.com'], groupMap['Criadores de Pesquisa & RH'],
        userMap['viewer@olivelas.com'], groupMap['Auditores e Analistas de Dados'],
      ]
    );

    // 3. Seed Sample Form with ALL field types
    console.log('[Seed] Seeding Comprehensive Sample Form...');
    const formRes = await client.query(
      `INSERT INTO olivelas_iam_forms_forms 
       (title, description, owner_id, status, theme_id, is_public, share_code, requires_login, allow_anonymous, confirmation_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (share_code) DO UPDATE SET title = EXCLUDED.title
       RETURNING id;`,
      [
        'Censo de Inovação & Feedback Operacional Olivelas',
        'Formulário demonstrativo de alta fidelidade com todos os tipos avançados de campos: números inteiros, números quebrados/decimais, listas dinâmicas, uploads de imagem, ratings e blocos informativos.',
        userMap['creator@olivelas.com'],
        'published',
        'google-classic',
        true,
        'censo-olivelas-2026',
        false,
        true,
        'Muito obrigado por participar do Censo Olivelas! Suas respostas já foram sincronizadas em tempo real com nossos dashboards e Google Sheets.',
      ]
    );
    const formId = formRes.rows[0].id;

    // Add collaborator: Juliana as editor, Vinicius as viewer
    await client.query(
      `INSERT INTO olivelas_iam_forms_collaborators (form_id, user_id, user_email, role, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (form_id, user_email) DO NOTHING;`,
      [formId, userMap['editor@olivelas.com'], 'editor@olivelas.com', 'editor', userMap['creator@olivelas.com']]
    );
    await client.query(
      `INSERT INTO olivelas_iam_forms_collaborators (form_id, user_id, user_email, role, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (form_id, user_email) DO NOTHING;`,
      [formId, userMap['viewer@olivelas.com'], 'viewer@olivelas.com', 'viewer', userMap['creator@olivelas.com']]
    );

    // Seed Fields
    console.log('[Seed] Seeding Form Fields...');
    // Delete existing fields to re-seed cleanly
    await client.query(`DELETE FROM olivelas_iam_forms_fields WHERE form_id = $1`, [formId]);

    const fieldsData = [
      {
        type: 'info_text',
        label: 'Bem-vindo ao Censo Olivelas 2026',
        description: 'Por favor, leia atentamente cada item. Todos os campos destacados com asterisco (*) são de preenchimento obrigatório.',
        required: false,
        order_index: 0,
        options: [],
        validation: {},
      },
      {
        type: 'text',
        label: 'Nome Completo do Colaborador / Participante',
        description: 'Informe seu nome oficial cadastrado',
        placeholder: 'Ex: Lucas Alcantara da Silva',
        required: true,
        order_index: 1,
        options: [],
        validation: { minLength: 3, maxLength: 100 },
      },
      {
        type: 'dropdown',
        label: 'Unidade Operacional / Departamento',
        description: 'Selecione a sua alocação primária',
        placeholder: 'Selecione uma opção...',
        required: true,
        order_index: 2,
        options: ['Sede Matriz - São Paulo', 'Centro Logístico - Barueri', 'Fábrica - Joinville', 'Hub Tech & Inovação', 'Atendimento Remoto'],
        validation: {},
      },
      {
        type: 'integer',
        label: 'Tempo de Experiência no Setor (em Anos Inteiros)',
        description: 'Número inteiro de anos completos trabalhando na área',
        placeholder: 'Ex: 5',
        required: true,
        order_index: 3,
        options: [],
        validation: { min: 0, max: 50, step: 1 },
      },
      {
        type: 'decimal',
        label: 'Média de Horas Diárias Dedicadas a Projetos (Número Quebrado)',
        description: 'Aceita casas decimais com precisão configurada (ex: 7.5 ou 8.25 horas)',
        placeholder: 'Ex: 7.5',
        required: true,
        order_index: 4,
        options: [],
        validation: { min: 0.5, max: 24.0, step: 0.25, precision: 2 },
      },
      {
        type: 'radio',
        label: 'Modalidade de Trabalho Atual',
        description: 'Escolha uma única opção representativa',
        required: true,
        order_index: 5,
        options: ['Presencial Integral', 'Híbrido (2-3 dias remotos)', '100% Remoto (Home Office)'],
        validation: {},
      },
      {
        type: 'checkbox',
        label: 'Quais ferramentas do ecossistema Google você utiliza diariamente?',
        description: 'Marque todas as opções que se aplicam',
        required: true,
        order_index: 6,
        options: ['Google Drive (Armazenamento na Nuvem)', 'Google Sheets (Planilhas & Fórmulas)', 'Google Forms (Formulários)', 'Google Meet (Videoconferências)', 'Google Docs (Redação & Relatórios)'],
        validation: {},
      },
      {
        type: 'rating',
        label: 'Nível de Satisfação com os Sistemas Olivelas (1 a 5 Estrelas)',
        description: 'Avalie sua experiência geral de uso no dia a dia',
        required: true,
        order_index: 7,
        options: [],
        validation: { maxRating: 5 },
      },
      {
        type: 'textarea',
        label: 'Sugestões de Melhorias, Inovações ou Feedback Livre',
        description: 'Texto longo para detalhar qualquer oportunidade observada',
        placeholder: 'Descreva detalhadamente sua sugestão ou comentário...',
        required: false,
        order_index: 8,
        options: [],
        validation: { maxLength: 2000 },
      },
      {
        type: 'file_upload',
        label: 'Upload de Imagem ou Documento de Evidência',
        description: 'Envio de comprovante, foto de crachá ou print de processo (Formatos: PNG, JPG, WEBP, PDF)',
        required: false,
        order_index: 9,
        options: [],
        validation: { allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'], maxFileSizeMB: 10 },
      },
      {
        type: 'switch',
        label: 'Deseja receber cópia das respostas e relatórios por e-mail?',
        description: 'Ative para confirmação imediata',
        required: false,
        order_index: 10,
        options: [],
        validation: {},
      },
    ];

    const insertedFields = [];
    for (const f of fieldsData) {
      const res = await client.query(
        `INSERT INTO olivelas_iam_forms_fields 
         (form_id, type, label, description, placeholder, required, order_index, options, validation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, type, label;`,
        [formId, f.type, f.label, f.description, f.placeholder || null, f.required, f.order_index, JSON.stringify(f.options), JSON.stringify(f.validation)]
      );
      insertedFields.push(res.rows[0]);
    }

    // 4. Seed Sample Responses & Answers
    console.log('[Seed] Seeding Sample Responses & Answers...');
    const sampleResponses = [
      {
        name: 'Mariana Duarte',
        email: 'mariana.duarte@empresa.com.br',
        dept: 'Hub Tech & Inovação',
        exp: 6,
        hours: 8.5,
        modality: 'Híbrido (2-3 dias remotos)',
        tools: ['Google Drive (Armazenamento na Nuvem)', 'Google Sheets (Planilhas & Fórmulas)', 'Google Forms (Formulários)'],
        rating: 5,
        feedback: 'A integração com Google Sheets economiza horas semanais de consolidação de dados!',
        switchVal: true,
      },
      {
        name: 'Roberto Castro',
        email: 'roberto.castro@logistica.com',
        dept: 'Centro Logístico - Barueri',
        exp: 12,
        hours: 9.0,
        modality: 'Presencial Integral',
        tools: ['Google Drive (Armazenamento na Nuvem)', 'Google Sheets (Planilhas & Fórmulas)'],
        rating: 4,
        feedback: 'Excelente usabilidade no celular e leitor ágil.',
        switchVal: false,
      },
      {
        name: 'Aline Menezes',
        email: 'aline.menezes@olivelas.com',
        dept: 'Sede Matriz - São Paulo',
        exp: 3,
        hours: 7.25,
        modality: '100% Remoto (Home Office)',
        tools: ['Google Drive (Armazenamento na Nuvem)', 'Google Meet (Videoconferências)', 'Google Docs (Redação & Relatórios)'],
        rating: 5,
        feedback: 'Gostei muito dos 30 temas visuais e da troca rápida de idiomas.',
        switchVal: true,
      },
      {
        name: 'Felipe Santana',
        email: 'felipe.santana@olivelas.com',
        dept: 'Fábrica - Joinville',
        exp: 8,
        hours: 8.0,
        modality: 'Presencial Integral',
        tools: ['Google Drive (Armazenamento na Nuvem)', 'Google Forms (Formulários)'],
        rating: 4,
        feedback: 'A validação de números quebrados impede erros de digitação nas medições.',
        switchVal: true,
      },
      {
        name: 'Beatriz Lima',
        email: 'beatriz.lima@remoto.com',
        dept: 'Atendimento Remoto',
        exp: 2,
        hours: 6.5,
        modality: '100% Remoto (Home Office)',
        tools: ['Google Sheets (Planilhas & Fórmulas)', 'Google Meet (Videoconferências)'],
        rating: 5,
        feedback: 'Perfeito para preenchimento no celular sem travamentos.',
        switchVal: true,
      },
    ];

    for (const sr of sampleResponses) {
      const respRes = await client.query(
        `INSERT INTO olivelas_iam_forms_responses (form_id, respondent_email, status)
         VALUES ($1, $2, 'completed')
         RETURNING id;`,
        [formId, sr.email]
      );
      const respId = respRes.rows[0].id;

      for (const field of insertedFields) {
        let valText = null;
        let valNum = null;
        let valJson = null;

        if (field.label.includes('Nome Completo')) valText = sr.name;
        else if (field.label.includes('Departamento')) valText = sr.dept;
        else if (field.label.includes('Anos Inteiros')) valNum = sr.exp;
        else if (field.label.includes('Horas Diárias')) valNum = sr.hours;
        else if (field.label.includes('Modalidade')) valText = sr.modality;
        else if (field.label.includes('ferramentas')) valJson = JSON.stringify(sr.tools);
        else if (field.label.includes('Satisfação')) valNum = sr.rating;
        else if (field.label.includes('Sugestões')) valText = sr.feedback;
        else if (field.label.includes('Deseja receber')) valText = sr.switchVal ? 'true' : 'false';

        if (valText !== null || valNum !== null || valJson !== null) {
          await client.query(
            `INSERT INTO olivelas_iam_forms_answers (response_id, field_id, value_text, value_number, value_json)
             VALUES ($1, $2, $3, $4, $5);`,
            [respId, field.id, valText, valNum, valJson]
          );
        }
      }
    }

    // 5. Seed Interactive Dashboard with Widgets
    console.log('[Seed] Seeding Interactive Dashboard...');
    const dashRes = await client.query(
      `INSERT INTO olivelas_iam_forms_dashboards
       (title, description, owner_id, is_public, share_code, form_id, theme_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (share_code) DO UPDATE SET title = EXCLUDED.title
       RETURNING id;`,
      [
        'Painel Executivo: Resultados do Censo Olivelas 2026',
        'Dashboard analítico em tempo real com distribuição de respostas, médias operacionais e cruzamento de dados com suporte a exportação e sincronização com Google.',
        userMap['creator@olivelas.com'],
        true,
        'dash-censo-olivelas',
        formId,
        'google-classic',
      ]
    );
    const dashId = dashRes.rows[0].id;

    await client.query(`DELETE FROM olivelas_iam_forms_dashboard_widgets WHERE dashboard_id = $1`, [dashId]);

    const widgetsData = [
      {
        title: 'Total de Respostas Coletadas',
        widget_type: 'metric',
        data_source: 'form',
        config: { metricType: 'count_responses', prefix: '', suffix: ' Envios' },
        position: { x: 0, y: 0, w: 3, h: 2 },
        order_index: 0,
      },
      {
        title: 'Média de Horas Diárias (Decimais)',
        widget_type: 'metric',
        data_source: 'form',
        config: { metricType: 'avg_number', fieldMatch: 'Horas Diárias', suffix: ' hrs/dia' },
        position: { x: 3, y: 0, w: 3, h: 2 },
        order_index: 1,
      },
      {
        title: 'Média de Satisfação Geral (1-5)',
        widget_type: 'metric',
        data_source: 'form',
        config: { metricType: 'avg_rating', fieldMatch: 'Satisfação', suffix: ' ★' },
        position: { x: 6, y: 0, w: 3, h: 2 },
        order_index: 2,
      },
      {
        title: 'Média de Experiência (Anos Inteiros)',
        widget_type: 'metric',
        data_source: 'form',
        config: { metricType: 'avg_number', fieldMatch: 'Anos Inteiros', suffix: ' Anos' },
        position: { x: 9, y: 0, w: 3, h: 2 },
        order_index: 3,
      },
      {
        title: 'Distribuição por Modalidade de Trabalho',
        widget_type: 'pie',
        data_source: 'form',
        config: { fieldMatch: 'Modalidade', chartType: 'pie' },
        position: { x: 0, y: 2, w: 6, h: 4 },
        order_index: 4,
      },
      {
        title: 'Alocação por Unidade Operacional / Departamento',
        widget_type: 'bar',
        data_source: 'form',
        config: { fieldMatch: 'Departamento', chartType: 'bar' },
        position: { x: 6, y: 2, w: 6, h: 4 },
        order_index: 5,
      },
      {
        title: 'Adesão às Ferramentas Google (Multi-Seleção)',
        widget_type: 'bar_horizontal',
        data_source: 'form',
        config: { fieldMatch: 'ferramentas', chartType: 'bar_horizontal' },
        position: { x: 0, y: 6, w: 6, h: 4 },
        order_index: 6,
      },
      {
        title: 'Distribuição das Notas de Satisfação',
        widget_type: 'doughnut',
        data_source: 'form',
        config: { fieldMatch: 'Satisfação', chartType: 'doughnut' },
        position: { x: 6, y: 6, w: 6, h: 4 },
        order_index: 7,
      },
    ];

    for (const w of widgetsData) {
      await client.query(
        `INSERT INTO olivelas_iam_forms_dashboard_widgets
         (dashboard_id, title, widget_type, data_source, config, position, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [dashId, w.title, w.widget_type, w.data_source, JSON.stringify(w.config), JSON.stringify(w.position), w.order_index]
      );
    }

    // 6. Seed API Token
    console.log('[Seed] Seeding Demo API Token...');
    const rawToken = 'oif_live_9a8b7c6d5e4f3a2b1c0e9d8c7b6a5f4e';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await client.query(
      `INSERT INTO olivelas_iam_forms_api_tokens (user_id, name, token_hash, token_prefix, scopes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token_hash) DO NOTHING;`,
      [
        userMap['admin@olivelas.com'],
        'Token Produção CI/CD & Integrações Externas',
        tokenHash,
        'oif_live_9a8...',
        ['forms:read', 'forms:write', 'responses:read', 'responses:write', 'dashboards:read', 'users:read'],
      ]
    );

    // 7. Seed Audit Log entry
    await client.query(
      `INSERT INTO olivelas_iam_forms_audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'DATABASE_SEED', 'system', 'seed_v1', '{"initialized": true, "formsCount": 1, "usersCount": 4}', '127.0.0.1');`,
      [userMap['admin@olivelas.com']]
    );

    client.release();
    console.log('[Seed] Database seeded successfully!');
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
