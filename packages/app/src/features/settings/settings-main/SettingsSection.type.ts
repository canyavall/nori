export interface AuthDetail {
  has_anthropic_access: boolean;
  anthropic_access_type: string;
  subscription_type?: string;
  anthropic_email?: string;
  cli_installed: boolean;
  cli_version?: string;
  issues: string[];
  instructions: string[];
}
