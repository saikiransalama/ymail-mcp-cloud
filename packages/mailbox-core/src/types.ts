export interface ProviderCredentials {
  email: string;
  appPassword: string;
}

export interface UserContext {
  userId: string;
  connectionId: string;
  credentials: ProviderCredentials;
}
