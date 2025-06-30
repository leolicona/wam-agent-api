
type WhatsAppConfig = {
  service:Fetcher
  apiUrl: string;
  token?: string;
};

export const makeApiRequester = (config: WhatsAppConfig) =>
  async (body: object, method: string = 'POST'): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    const response = await config.service.fetch(config.apiUrl, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Side effect: Logging errors to the console
      console.error(`❌ OTPless API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OTPless API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  };
