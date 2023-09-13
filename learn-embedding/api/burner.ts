import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export function pulumiProgram() {
    const config = new pulumi.Config();
    const request = config.require("request");
    let invokeMeResult: pulumi.Output<string>;

    if (request === "timezone") {
        // Spin up a serverless function infra with the time function in the requested zone with the right permissions
        const lambdaRole = new aws.iam.Role("role-tz", {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com",
                        },
                        Effect: "Allow",
                        Sid: "",
                    },
                ],
            }),
        });

        new aws.iam.RolePolicyAttachment("role-policy", {
            role: lambdaRole.id,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
        });

        const timeFn = new aws.lambda.Function("timezone-finder", {
            runtime: "nodejs18.x",
            role: lambdaRole.arn,
            handler: "index.handler",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./time/bin"),
            }),
        });

        const invokeMe = new aws.lambda.Invocation("test-invoke-timezone", {
            functionName: timeFn.name,
            input: `{"request": "timezone"}`,
        });
        invokeMeResult = invokeMe.result;
    } else if (request === "location") {
        // Spin up a serverless function infra with the location function in the requested region with the right permissions
        const lambdaRole = new aws.iam.Role("role-location", {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com",
                        },
                        Effect: "Allow",
                        Sid: "",
                    },
                ],
            }),
        });

        new aws.iam.RolePolicyAttachment("role-policy", {
            role: lambdaRole.id,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
        });

        const locationFn = new aws.lambda.Function("location-finder", {
            runtime: "nodejs18.x",
            role: lambdaRole.arn,
            handler: "index.handler",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./time/bin"),
            }),
        });

        const invokeMe = new aws.lambda.Invocation("test-invoke-location", {
            functionName: locationFn.name,
            input: `{"request": "location"}`,
        });

        invokeMeResult = invokeMe.result;
    } else {
        invokeMeResult = pulumi.output("invalid request")
        console.log("Please send me something real");
    }
    return invokeMeResult;
}
