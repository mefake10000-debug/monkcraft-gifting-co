/* eslint-disable @typescript-eslint/no-require-imports -- Node bootstrap utility. */
const { MONCRAFT_BOARDS } = require('../src/lib/automation/blueprint.ts');

const token = process.env.MONKCRAFT_NOTION_TOKEN?.trim();
const parentPageId = process.env.MONKCRAFT_NOTION_PARENT_PAGE_ID?.trim();
const version = '2026-03-11';

async function notion(path, init = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': version,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Notion returned ${response.status} for ${path}: ${body.message || 'request failed'}`);
  return body;
}

function help() {
  console.error('Set MONKCRAFT_NOTION_TOKEN and MONKCRAFT_NOTION_PARENT_PAGE_ID, share the parent page with the integration, then run:');
  console.error('  node -r ./scripts/register-ts-hook.cjs scripts/bootstrap-notion.cjs --confirm-create');
  process.exit(2);
}

async function main() {
  if (!token || !parentPageId || process.argv[2] !== '--confirm-create') help();
  const created = [];
  for (const board of MONCRAFT_BOARDS) {
    const database = await notion('/databases', {
      method: 'POST',
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parentPageId },
        title: [{ type: 'text', text: { content: board.name } }],
        description: [{ type: 'text', text: { content: `Moncraft shared operations board: ${board.name}. Use the same record across role views; do not create duplicate lead or order records.` } }],
        initial_data_source: { properties: board.properties },
      }),
    });
    const databaseId = database.id;
    if (typeof databaseId !== 'string') throw new Error(`No database id returned for ${board.name}`);
    const retrieved = await notion(`/databases/${databaseId}`);
    const dataSourceId = retrieved.data_sources?.[0]?.id;
    if (typeof dataSourceId !== 'string') throw new Error(`No data source returned for ${board.name}`);
    const source = await notion(`/data_sources/${dataSourceId}`);
    const statusPropertyId = source.properties?.Status?.id;
    if (typeof statusPropertyId !== 'string') throw new Error(`No Status property id returned for ${board.name}`);
    for (const view of [{ name: 'Kanban' }, ...board.views.roleViews]) {
      await notion('/views', {
        method: 'POST',
        body: JSON.stringify({
          database_id: databaseId,
          data_source_id: dataSourceId,
          name: view.name,
          type: 'board',
          ...(view.filter ? { filter: view.filter } : {}),
          configuration: {
            type: 'board',
            group_by: { property_id: statusPropertyId, hide_empty_groups: true },
          },
        }),
      });
    }
    created.push({ key: board.key, name: board.name, databaseId, dataSourceId });
    console.log(`Created ${board.name}`);
  }
  console.log('\nAdd the Leads data source ID to the server environment:');
  console.log(`MONKCRAFT_NOTION_LEADS_DATA_SOURCE_ID=${created.find((board) => board.key === 'leads').dataSourceId}`);
  console.log(`MONKCRAFT_NOTION_SUPPLIERS_DATA_SOURCE_ID=${created.find((board) => board.key === 'suppliers').dataSourceId}`);
  console.log(`MONKCRAFT_NOTION_SUPPLIER_CHECKS_DATA_SOURCE_ID=${created.find((board) => board.key === 'supplier_checks').dataSourceId}`);
  console.log(`MONKCRAFT_NOTION_QUOTES_ORDERS_DATA_SOURCE_ID=${created.find((board) => board.key === 'quotes_orders').dataSourceId}`);
  console.log(`MONKCRAFT_NOTION_CUSTOMER_CARE_DATA_SOURCE_ID=${created.find((board) => board.key === 'customer_care').dataSourceId}`);
  console.log(`MONKCRAFT_NOTION_CONTENT_DATA_SOURCE_ID=${created.find((board) => board.key === 'content').dataSourceId}`);
  console.log(`MONKCRAFT_NOTION_AGENT_FEEDBACK_DATA_SOURCE_ID=${created.find((board) => board.key === 'agent_feedback').dataSourceId}`);
  console.log('\nBoard IDs (save this output in your private operations notes):');
  console.log(JSON.stringify(created, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Notion bootstrap failed');
  process.exitCode = 1;
});
