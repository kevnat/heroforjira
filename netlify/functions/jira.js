// Jira API proxy — runs server-side so credentials never reach the browser.
// Receives any request to /api/jira/* and forwards it to your Jira site.
//
// Required Netlify env vars:
//   JIRA_EMAIL      your-email@company.com
//   JIRA_API_TOKEN  your Jira API token
//   JIRA_SITE       https://yourorg.atlassian.net

export const handler = async (event) => {
  const { JIRA_EMAIL, JIRA_API_TOKEN, JIRA_SITE } = process.env;

  if (!JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_SITE) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing JIRA_EMAIL, JIRA_API_TOKEN, or JIRA_SITE env vars' }),
    };
  }

  // Strip the function prefix — what remains is the Jira REST path.
  // e.g. /.netlify/functions/jira/rest/api/3/search/jql → /rest/api/3/search/jql
  const jiraPath = event.path.replace(/^\/.netlify\/functions\/jira/, '');
  const url      = `${JIRA_SITE}${jiraPath}`;

  const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

  const upstream = await fetch(url, {
    method:  event.httpMethod,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: ['POST', 'PUT', 'PATCH'].includes(event.httpMethod) ? event.body : undefined,
  });

  const body = await upstream.text();

  return {
    statusCode: upstream.status,
    headers:    { 'Content-Type': 'application/json' },
    body,
  };
};
