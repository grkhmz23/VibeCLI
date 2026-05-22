import { loadConfig } from "../config/config.js";
export async function organizationIdentity(cwd) {
    const config = await loadConfig(cwd);
    return {
        enabled: config.organization.enabled,
        orgId: config.organization.org_id,
        orgName: config.organization.org_name
    };
}
//# sourceMappingURL=identity.js.map