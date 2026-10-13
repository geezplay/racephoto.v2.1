declare module 'midtrans-client' {
  interface ClientConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface SnapTransaction {
    token: string;
    redirect_url: string;
  }

  class Snap {
    apiConfig: {
      set(options: Record<string, unknown>): void;
    };
    transaction: {
      status(orderId: string): Promise<Record<string, unknown>>;
    };
    constructor(config: ClientConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<SnapTransaction>;
  }

  class CoreApi {
    constructor(config: ClientConfig);
    charge(parameter: Record<string, unknown>): Promise<Record<string, unknown>>;
  }

  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };

  export default midtransClient;
}
