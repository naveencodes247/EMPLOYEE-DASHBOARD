import { handleLoginRequest } from '../../server/loginHandler';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { employeeId, password } = JSON.parse(event.body || '{}');
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

    const result = await handleLoginRequest({
      employeeId,
      password,
      clientIp,
    });

    return {
      statusCode: result.status,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.body),
    };
  } catch {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Internal server error processing login.' }),
    };
  }
};
