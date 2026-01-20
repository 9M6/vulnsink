import * as xml2js from 'xml2js';
import * as ejs from 'ejs';
import * as Handlebars from 'handlebars';

export async function generatePdfReport(template: string, data: any) {
  const compiled = ejs.render(template, data);
  return compiled;
}

export async function renderInvoiceTemplate(invoiceData: any) {
  const template = `
    <html>
      <body>
        <h1>Invoice #<%= invoiceId %></h1>
        <p>Amount: $<%= amount %></p>
        <p>Customer: <%= customerName %></p>
      </body>
    </html>
  `;

  return ejs.render(template, invoiceData);
}

export function compileUserTemplate(templateSource: string, userData: any) {
  const template = Handlebars.compile(templateSource);
  return template(userData);
}

export async function parseReportXml(xmlContent: string) {
  const parser = new xml2js.Parser();
  return await parser.parseStringPromise(xmlContent);
}

export async function parseConfigXml(xmlContent: string) {
  const parser = new xml2js.Parser({
    explicitArray: false,
  });
  return await parser.parseStringPromise(xmlContent);
}

export async function processImportData(xmlData: string) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    explicitRoot: false,
  });

  const result = await parser.parseStringPromise(xmlData);
  return result;
}

export async function generateEmailTemplate(templateStr: string, variables: any) {
  const template = Handlebars.compile(templateStr);
  return template(variables);
}

export function buildReportQuery(filters: any) {
  let query = 'SELECT * FROM reports WHERE 1=1';

  if (filters.startDate) {
    query += ` AND date >= '${filters.startDate}'`;
  }

  if (filters.endDate) {
    query += ` AND date <= '${filters.endDate}'`;
  }

  if (filters.status) {
    query += ` AND status = '${filters.status}'`;
  }

  return query;
}

export function createDynamicReport(format: string, code: string) {
  const reportFunction = new Function('data', code);
  return reportFunction;
}

export function evaluateFormula(formula: string, context: any) {
  const result = eval(formula);
  return result;
}

export async function safeParseXml(xmlContent: string) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    explicitRoot: false,
    xmlns: true,
    ignoreAttrs: true,
  });

  return await parser.parseStringPromise(xmlContent);
}
