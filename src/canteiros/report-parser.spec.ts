import { parseCanteiroReport } from './report-parser';

describe('parseCanteiroReport', () => {
  it('maps report headings to the response fields and discards other text', () => {
    const result = parseCanteiroReport(`Texto extra antes do relatório.
{{{
# Introdução
Contexto do canteiro.
}}},
{{{
# Objetivo
Objetivo dos formulários.
}}},
{{{
# Desenvolvimento
Análise dos dados.
}}},
{{{
# Considerações finais
Conclusão do relatório.
}}},
# Observação adicional
Este tópico deve ser descartado.`);

    expect(result).toEqual({
      introduction: 'Contexto do canteiro.',
      objective: 'Objetivo dos formulários.',
      development: 'Análise dos dados.',
      final_thoughts: 'Conclusão do relatório.',
    });
  });

  it('returns empty strings for sections that were not generated', () => {
    expect(parseCanteiroReport('# Objetivo\nExplicação.')).toEqual({
      introduction: '',
      objective: 'Explicação.',
      development: '',
      final_thoughts: '',
    });
  });
});
