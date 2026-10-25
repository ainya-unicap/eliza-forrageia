export interface CanteiroReport {
  introduction: string;
  objective: string;
  development: string;
  final_thoughts: string;
}

const REPORT_SECTIONS: Record<string, keyof CanteiroReport> = {
  introducao: 'introduction',
  objetivo: 'objective',
  desenvolvimento: 'development',
  'consideracoes finais': 'final_thoughts',
};

function normalizeHeading(heading: string): string {
  return heading
    .trim()
    .replace(/:$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function cleanSectionContent(content: string): string {
  return content
    .replace(/\{\{\{|\}\}\}/gu, '')
    .trim()
    .replace(/^[,;]\s*/u, '')
    .replace(/\s*[,;]\s*$/u, '')
    .trim();
}

export function parseCanteiroReport(text: string): CanteiroReport {
  const report: CanteiroReport = {
    introduction: '',
    objective: '',
    development: '',
    final_thoughts: '',
  };
  const headingRegex = /^\s*#{1,6}\s+(.+?)\s*#*\s*$/gmu;
  const headings = [...text.matchAll(headingRegex)];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const sectionKey = REPORT_SECTIONS[normalizeHeading(heading[1])];

    if (!sectionKey || heading.index === undefined) {
      continue;
    }

    const contentStart = heading.index + heading[0].length;
    const nextHeading = headings[index + 1];
    const contentEnd = nextHeading?.index ?? text.length;
    report[sectionKey] = cleanSectionContent(
      text.slice(contentStart, contentEnd),
    );
  }

  return report;
}
