import { SurveyStatisticsEngine } from '../services/data/statistics';
import { SurveyQuestion, SurveyResponse } from '../types/survey';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertCloseTo(actual: number, expected: number, tolerance = 0.001, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion Failed: expected ${expected}, got ${actual}. ${message}`);
  }
}

function createQ(partial: Partial<SurveyQuestion> & { id: string; title: string; type: SurveyQuestion['type'] }): SurveyQuestion {
  return {
    required: false,
    order: 1,
    ...partial,
  };
}

function createResp(id: string, answers: Record<string, any>): SurveyResponse {
  return {
    id,
    submittedAt: '2026-01-01',
    answers,
  };
}

export function runStatisticsAuditTests() {
  console.log('--- STARTING STATISTICS ENGINE AUDIT TESTS ---');
  let passedCount = 0;

  // 1. Categorias duplicadas por espaços
  {
    const q = createQ({
      id: 'q_space',
      title: 'Pergunta Espaços',
      type: 'multiple_choice',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_space: 'Vendas' }),
      createResp('2', { q_space: '  Vendas  ' }),
      createResp('3', { q_space: 'Vendas ' }),
      createResp('4', { q_space: 'TI' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    assert(stats.validResponses === 4, 'Test 1: Total valid responses must be 4');
    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      assert(freqs.length === 2, `Test 1: Expected 2 categories, got ${freqs.length}`);
      const vendas = freqs.find((f) => f.label.toLowerCase() === 'vendas');
      assert(vendas?.count === 3, `Test 1: Vendas count must be 3, got ${vendas?.count}`);
      assertCloseTo(vendas!.percentage, 75.0, 0.01, 'Test 1: Vendas percentage should be 75%');
    }
    console.log('✅ Test 1 Passed: Categorias duplicadas por espaços');
    passedCount++;
  }

  // 2. Categorias duplicadas por capitalização
  {
    const q = createQ({
      id: 'q_case',
      title: 'Pergunta Capitalização',
      type: 'multiple_choice',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_case: 'Marketing' }),
      createResp('2', { q_case: 'marketing' }),
      createResp('3', { q_case: 'MARKETING' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      assert(freqs.length === 1, `Test 2: Expected 1 category, got ${freqs.length}`);
      assert(freqs[0].count === 3, `Test 2: Marketing count must be 3, got ${freqs[0].count}`);
      assertCloseTo(freqs[0].percentage, 100.0, 0.01, 'Test 2: Percentage must be 100%');
    }
    console.log('✅ Test 2 Passed: Categorias duplicadas por capitalização');
    passedCount++;
  }

  // 3. Multiple Choice
  {
    const q = createQ({
      id: 'q_mc',
      title: 'Senioridade',
      type: 'multiple_choice',
      options: [
        { value: 'Junior', label: 'Júnior', order: 1 },
        { value: 'Pleno', label: 'Pleno', order: 2 },
        { value: 'Senior', label: 'Sênior', order: 3 },
      ],
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_mc: 'Junior' }),
      createResp('2', { q_mc: 'Pleno' }),
      createResp('3', { q_mc: 'Pleno' }),
      createResp('4', { q_mc: 'Senior' }),
      createResp('5', { q_mc: '' }), // Empty
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    assert(stats.validResponses === 4, 'Test 3: Valid responses must be 4');
    assert(stats.emptyResponses === 1, 'Test 3: Empty responses must be 1');

    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      const pleno = freqs.find((f) => f.label === 'Pleno');
      assert(pleno?.count === 2, 'Test 3: Pleno count must be 2');
      assertCloseTo(pleno!.percentage, 50.0, 0.01, 'Test 3: Pleno percentage must be 50%');
    }
    console.log('✅ Test 3 Passed: Multiple choice');
    passedCount++;
  }

  // 4. Checkbox
  {
    const q = createQ({
      id: 'q_cb',
      title: 'Ferramentas IA',
      type: 'checkbox',
      options: [
        { value: 'ChatGPT', label: 'ChatGPT', order: 1 },
        { value: 'Gemini', label: 'Gemini', order: 2 },
        { value: 'Copilot', label: 'Copilot', order: 3 },
      ],
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_cb: 'ChatGPT; Gemini' }),
      createResp('2', { q_cb: 'ChatGPT; Copilot' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    assert(stats.validResponses === 2, 'Test 4: Valid respondents must be 2');
    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      const chatgpt = freqs.find((f) => f.label === 'ChatGPT');
      const gemini = freqs.find((f) => f.label === 'Gemini');
      const copilot = freqs.find((f) => f.label === 'Copilot');

      assert(chatgpt?.count === 2, `Test 4: ChatGPT count must be 2, got ${chatgpt?.count}`);
      assertCloseTo(chatgpt!.percentage, 100.0, 0.01, 'Test 4: ChatGPT percentage must be 100%');

      assert(gemini?.count === 1, `Test 4: Gemini count must be 1, got ${gemini?.count}`);
      assertCloseTo(gemini!.percentage, 50.0, 0.01, 'Test 4: Gemini percentage must be 50%');

      assert(copilot?.count === 1, `Test 4: Copilot count must be 1, got ${copilot?.count}`);
      assertCloseTo(copilot!.percentage, 50.0, 0.01, 'Test 4: Copilot percentage must be 50%');
    }
    console.log('✅ Test 4 Passed: Checkbox');
    passedCount++;
  }

  // 5. Checkbox com múltiplos delimitadores (;, |, ,, \n) e deduplicação interna
  {
    const q = createQ({
      id: 'q_cb_delim',
      title: 'Delimitadores',
      type: 'checkbox',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_cb_delim: 'A; B | C' }),
      createResp('2', { q_cb_delim: 'A, B\nC' }),
      createResp('3', { q_cb_delim: 'A; A; A' }), // Duplicate selection in same answer
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      const catA = freqs.find((f) => f.label === 'A');
      assert(catA?.count === 3, `Test 5: A must be selected by 3 respondents, got ${catA?.count}`);
      assertCloseTo(catA!.percentage, 100.0, 0.01, 'Test 5: A percentage should be 100%');
    }
    console.log('✅ Test 5 Passed: Checkbox com múltiplos delimitadores');
    passedCount++;
  }

  // 6. Linear scale
  {
    const q = createQ({
      id: 'q_scale',
      title: 'Satisfação',
      type: 'linear_scale',
      scaleConfig: { min: 1, max: 5, minLabel: 'Péssimo', maxLabel: 'Excelente' },
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_scale: 1 }),
      createResp('2', { q_scale: 3 }),
      createResp('3', { q_scale: 5 }),
      createResp('4', { q_scale: 5 }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'scale') {
      const s = stats.computedStats.stats;
      assert(s.validResponses === 4, 'Test 6: Valid responses must be 4');
      assert(s.min === 1, 'Test 6: Min must be 1');
      assert(s.max === 5, 'Test 6: Max must be 5');
      assertCloseTo(s.average, 3.5, 0.01, 'Test 6: Average must be 3.5');
      assertCloseTo(s.median, 4.0, 0.01, 'Test 6: Median of [1, 3, 5, 5] is (3+5)/2 = 4');
      assert(s.distribution.length === 5, 'Test 6: Scale 1..5 should have 5 distribution bars');
    }
    console.log('✅ Test 6 Passed: Linear scale');
    passedCount++;
  }

  // 7. Valores vazios (null, undefined, "", "   ")
  {
    const q = createQ({
      id: 'q_empty',
      title: 'Pergunta Vazia',
      type: 'multiple_choice',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_empty: null }),
      createResp('2', { q_empty: undefined }),
      createResp('3', { q_empty: '' }),
      createResp('4', { q_empty: '    ' }),
      createResp('5', { q_empty: 'Válido' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    assert(stats.validResponses === 1, `Test 7: Valid responses must be 1, got ${stats.validResponses}`);
    assert(stats.emptyResponses === 4, `Test 7: Empty responses must be 4, got ${stats.emptyResponses}`);
    console.log('✅ Test 7 Passed: Valores vazios');
    passedCount++;
  }

  // 8. Valores inválidos (ex: string em linear_scale)
  {
    const q = createQ({
      id: 'q_invalid',
      title: 'Escala com inválidos',
      type: 'linear_scale',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_invalid: '4' }),
      createResp('2', { q_invalid: 'Não sei' }), // Invalid numeric
      createResp('3', { q_invalid: 5 }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    assert(stats.validResponses === 2, 'Test 8: Valid numeric responses must be 2');
    assert(stats.invalidResponses.length === 1, 'Test 8: Invalid responses must be recorded');
    assert(stats.invalidResponses[0].value === 'Não sei', 'Test 8: Invalid value logged correctly');
    console.log('✅ Test 8 Passed: Valores inválidos');
    passedCount++;
  }

  // 9. Opções sem respostas preservadas com count 0 e percent 0
  {
    const q = createQ({
      id: 'q_zero',
      title: 'Pergunta Opções Zero',
      type: 'multiple_choice',
      options: [
        { value: 'OptA', label: 'Opção A', order: 1 },
        { value: 'OptB', label: 'Opção B', order: 2 },
        { value: 'OptC', label: 'Opção C', order: 3 },
      ],
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_zero: 'OptA' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      assert(freqs.length === 3, 'Test 9: All 3 predefined options must be present');
      const optB = freqs.find((f) => f.label === 'Opção B');
      assert(optB?.count === 0, 'Test 9: Opção B count must be 0');
      assert(optB?.percentage === 0, 'Test 9: Opção B percentage must be 0');
      assert(freqs[0].label === 'Opção A' && freqs[1].label === 'Opção B' && freqs[2].label === 'Opção C', 'Test 9: Order preserved');
    }
    console.log('✅ Test 9 Passed: Opções sem respostas');
    passedCount++;
  }

  // 10. Percentuais consistentes e soma das partes
  {
    const q = createQ({
      id: 'q_pct',
      title: 'Pergunta Percentuais',
      type: 'multiple_choice',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_pct: 'A' }),
      createResp('2', { q_pct: 'B' }),
      createResp('3', { q_pct: 'C' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      const sumPct = freqs.reduce((acc, curr) => acc + curr.percentage, 0);
      assertCloseTo(sumPct, 100.0, 0.001, 'Test 10: Sum of exact percentages must equal 100%');
      assertCloseTo(freqs[0].percentage, 33.3333333, 0.001, 'Test 10: 1/3 exact unrounded float');
    }
    console.log('✅ Test 10 Passed: Percentuais');
    passedCount++;
  }

  // 11. Média
  {
    const q = createQ({
      id: 'q_mean',
      title: 'Média',
      type: 'number',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_mean: 10 }),
      createResp('2', { q_mean: 20 }),
      createResp('3', { q_mean: 30 }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'scale') {
      assertCloseTo(stats.computedStats.stats.average, 20.0, 0.001, 'Test 11: Mean of 10, 20, 30 must be 20');
    }
    console.log('✅ Test 11 Passed: Média');
    passedCount++;
  }

  // 12. Mediana (Ímpar e Par)
  {
    const qOdd = createQ({ id: 'q_odd', title: 'Mediana Ímpar', type: 'number' });
    const oddResp: SurveyResponse[] = [
      createResp('1', { q_odd: 1 }),
      createResp('2', { q_odd: 5 }),
      createResp('3', { q_odd: 9 }),
    ];
    const statsOdd = SurveyStatisticsEngine.computeQuestionStatistics(qOdd, SurveyStatisticsEngine.generateDefaultMapping(qOdd), oddResp);
    if (statsOdd.computedStats.kind === 'scale') {
      assert(statsOdd.computedStats.stats.median === 5, 'Test 12: Odd median must be 5');
    }

    const qEven = createQ({ id: 'q_even', title: 'Mediana Par', type: 'number' });
    const evenResp: SurveyResponse[] = [
      createResp('1', { q_even: 10 }),
      createResp('2', { q_even: 20 }),
      createResp('3', { q_even: 30 }),
      createResp('4', { q_even: 40 }),
    ];
    const statsEven = SurveyStatisticsEngine.computeQuestionStatistics(qEven, SurveyStatisticsEngine.generateDefaultMapping(qEven), evenResp);
    if (statsEven.computedStats.kind === 'scale') {
      assert(statsEven.computedStats.stats.median === 25, 'Test 12: Even median must be (20+30)/2 = 25');
    }
    console.log('✅ Test 12 Passed: Mediana');
    passedCount++;
  }

  // 13. Datas (Parse, minDate, maxDate, chronological ordering)
  {
    const q = createQ({ id: 'q_date', title: 'Data Entrada', type: 'date' });
    const responses: SurveyResponse[] = [
      createResp('1', { q_date: '25/12/2025' }),
      createResp('2', { q_date: '2026-01-10' }),
      createResp('3', { q_date: '25/12/2025' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'date') {
      const d = stats.computedStats.stats;
      assert(d.validResponses === 3, 'Test 13: Valid date responses must be 3');
      assert(d.minDate === '2025-12-25', `Test 13: Min date must be 2025-12-25, got ${d.minDate}`);
      assert(d.maxDate === '2026-01-10', `Test 13: Max date must be 2026-01-10, got ${d.maxDate}`);
      assert(d.frequencies.length === 2, 'Test 13: 2 distinct dates');
      const dec25 = d.frequencies.find((f) => f.date === '2025-12-25');
      assert(dec25?.count === 2, 'Test 13: 2025-12-25 count should be 2');
    }
    console.log('✅ Test 13 Passed: Datas');
    passedCount++;
  }

  // 14. Horários
  {
    const q = createQ({ id: 'q_time', title: 'Horário', type: 'time' });
    const responses: SurveyResponse[] = [
      createResp('1', { q_time: '09:30' }),
      createResp('2', { q_time: '14:00' }),
      createResp('3', { q_time: '09:30:00' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    if (stats.computedStats.kind === 'time') {
      const t = stats.computedStats.stats;
      assert(t.validResponses === 3, 'Test 14: Valid time responses must be 3');
      assert(t.minTime === '09:30', 'Test 14: Min time must be 09:30');
      assert(t.maxTime === '14:00', 'Test 14: Max time must be 14:00');
      const h930 = t.frequencies.find((f) => f.time === '09:30');
      assert(h930?.count === 2, 'Test 14: 09:30 count must be 2');
    }
    console.log('✅ Test 14 Passed: Horários');
    passedCount++;
  }

  // 20. CASO REAL DA PESQUISA
  // "Qual é a sua área de atuação?"
  // Dados: Financeiro, Financeiro, financeiro,  Financeiro, Tecnologia, RH
  // Resultado esperado: Financeiro = 4, Tecnologia = 1, RH = 1
  {
    const q = createQ({
      id: 'q_area',
      title: 'Qual é a sua área de atuação?',
      type: 'multiple_choice',
    });
    const responses: SurveyResponse[] = [
      createResp('1', { q_area: 'Financeiro' }),
      createResp('2', { q_area: 'Financeiro' }),
      createResp('3', { q_area: 'financeiro' }),
      createResp('4', { q_area: ' Financeiro ' }),
      createResp('5', { q_area: 'Tecnologia' }),
      createResp('6', { q_area: 'RH' }),
    ];
    const mapping = SurveyStatisticsEngine.generateDefaultMapping(q);
    const stats = SurveyStatisticsEngine.computeQuestionStatistics(q, mapping, responses);

    assert(stats.validResponses === 6, 'Test 20: Valid responses must be 6');
    if (stats.computedStats.kind === 'categorical') {
      const freqs = stats.computedStats.stats.frequencies;
      assert(freqs.length === 3, `Test 20: Expected exactly 3 categories, got ${freqs.length} (${freqs.map(f => f.label).join(', ')})`);

      const financeiro = freqs.find((f) => f.label.toLowerCase() === 'financeiro');
      const tecnologia = freqs.find((f) => f.label.toLowerCase() === 'tecnologia');
      const rh = freqs.find((f) => f.label.toLowerCase() === 'rh');

      assert(financeiro?.count === 4, `Test 20: Financeiro must have count 4, got ${financeiro?.count}`);
      assert(tecnologia?.count === 1, `Test 20: Tecnologia must have count 1, got ${tecnologia?.count}`);
      assert(rh?.count === 1, `Test 20: RH must have count 1, got ${rh?.count}`);

      assertCloseTo(financeiro!.percentage, (4 / 6) * 100, 0.001, 'Test 20: Financeiro percentage');
      assertCloseTo(tecnologia!.percentage, (1 / 6) * 100, 0.001, 'Test 20: Tecnologia percentage');
      assertCloseTo(rh!.percentage, (1 / 6) * 100, 0.001, 'Test 20: RH percentage');
    }
    console.log('✅ Test 20 Passed: Caso Real ("Qual é a sua área de atuação?")');
    passedCount++;
  }

  console.log(`\n🎉 ALL ${passedCount} AUDIT TESTS PASSED WITH 100% DETERMINISTIC SUCCESS!`);
  return true;
}

// Auto-run if executed directly via tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('statistics.test')) {
  runStatisticsAuditTests();
}
