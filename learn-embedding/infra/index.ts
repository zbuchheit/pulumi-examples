import express from 'express';
import * as infra from './basic';
import { OutputMap } from '@pulumi/pulumi/automation';

const app = express();

app.get('/', (req, res) => {
    res.status(200).json({ response: "OK" });
});

app.get('/hello', (req, res) => {
    res.status(200).json({ response: "hello, world" });
});

app.get('/time', async (req, res) => {
    try {
        const timeZone = await spinUpProgram('timezone');
        res.status(200).json({ response: timeZone });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
});

app.get('/location', async (req, res) => {
    try {
        const location = await spinUpProgram('location');
        res.status(200).json({ response: location });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
});

app.listen(8000, () => {
    console.log('Serving on port 8000...');
});

export async function spinUpProgram(req: string): Promise<OutputMap> {
    const args = await infra.setContext("dev", "/api")
    const stack = await infra.setStack(args);
    await infra.installPlugins(stack);
    await infra.setConfig(stack, req);
    await infra.pulumiUp(stack);
    const results = await stack.outputs();   
    await infra.refreshStack(stack);
    await infra.destroyStack(stack);
    return results["awsInvokeResult"].value;
}
