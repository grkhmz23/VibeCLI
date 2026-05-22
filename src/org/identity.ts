import { loadConfig } from "../config/config.js";

export async function organizationIdentity(cwd: string): Promise<{
  enabled: boolean;
  orgId: string;
  orgName: string;
}> {
  const config = await loadConfig(cwd);
  return {
    enabled: config.organization.enabled,
    orgId: config.organization.org_id,
    orgName: config.organization.org_name
  };
}
