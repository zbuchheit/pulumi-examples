import * as pulumi from "@pulumi/pulumi";
import * as auto from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as fs from 'fs';

export function setContext(stack: string, dirname: string): auto.LocalProgramArgs {
    return {
        stackName: stack,
        workDir: findLocal(dirname),
    }
}

export function findLocal(dirname: string) {
    const path = upath.joinSafe(__dirname, '../..', dirname);
    console.log("Constructed path:", path);
    if (!fs.existsSync(path)) {
        throw new Error(`Directory does not exist: ${path}`);
    }
    return path;
}

export async function setStack(args: auto.LocalProgramArgs): Promise<auto.Stack> {
    console.log("Initializing stack...")
    return await auto.LocalWorkspace.createOrSelectStack(args);
}

export async function installPlugins(stack: auto.Stack) {
    console.info("installing plugins...");
    await stack.workspace.installPlugin("aws", "v4.0.0")
    console.info("plugins installed");
}

export async function setConfig(stack: auto.Stack, request: string) {
    console.info("setting up config");
    await stack.setConfig("aws:region", {value: "us-west-2"})
    await stack.setConfig("request", {value: request})
    console.info("config set");
}

export async function refreshStack(stack: auto.Stack) {
    console.info("refreshing stack...");
    await stack.refresh({ onOutput: console.info });
    console.info("refresh complete");
}

export async function destroyStack(stack: auto.Stack) {
    console.info("destroying stack...");
    await stack.destroy({ onOutput: console.info });
    console.info("stack destroy complete");
}

export async function pulumiUp(stack: auto.Stack) {
    try {
    await console.info("updating stack...");
    const upRes = await stack.up({ onOutput: console.info });
    await console.log(`update summary: \n${JSON.stringify(upRes.summary.resourceChanges, null, 4)}`);
    } catch (error) {
        pulumi.log.error("Failure when trying to run pulumi up:")
        throw error;
    }
}

