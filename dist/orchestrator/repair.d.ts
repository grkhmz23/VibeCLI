export type RepairResult = {
    runId: string;
    status: "not_required" | "proposed" | "failed" | "max_cycles_reached";
    cycle: number | null;
    message: string;
};
export declare function repairRun(cwd: string, runId: string, options: {
    live?: boolean;
    dryRun?: boolean;
    confirm?: string;
}): Promise<RepairResult>;
