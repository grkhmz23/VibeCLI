export declare function organizationIdentity(cwd: string): Promise<{
    enabled: boolean;
    orgId: string;
    orgName: string;
}>;
