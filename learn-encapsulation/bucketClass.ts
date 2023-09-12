import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

type PolicyType = "default" | "locked" | "permissive";

export class OurBucketClass extends pulumi.ComponentResource {
    private bucket: aws.s3.Bucket;
    private bucketPolicy: aws.s3.BucketPolicy;
    private policies: { [K in PolicyType]: aws.iam.PolicyStatement };

    constructor(name: string, args: { policy: PolicyType, specificFolder?: string }, opts?: pulumi.ComponentResourceOptions) {

        super("zbuchheit:index:OurBucketComponent", name, args, opts);

        this.bucket = new aws.s3.Bucket(`${name}-bucket`, {}, {parent: this});

        if (args.policy !== "locked" && args.specificFolder) {
            throw new Error(`Can only specify a specific folder with a "locked" policy`)
        }

        this.policies = {
            default: {
                Effect: "Allow",
                Principal: "*",
                Action: [
                    "s3:GetObject"
                ],
            },
            locked: {
                Effect: "Allow",
                Action: [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                Resource: [
                    pulumi.interpolate`${this.bucket.arn}${args.specificFolder ? `${args.specificFolder}/*` : "/*"}`
                ]
            },
            permissive: {
                Effect: "Allow",
                Action: [
                    "s3:*"
                ],
                Resource: "*"
            },
        };

        this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
            bucket: this.bucket.id,
            policy: this.getBucketPolicy(args.policy),
        },
            {
                parent: this.bucket
            }
        );

        this.registerOutputs({
            bucket: this.bucket,
            bucketPolicy: this.bucketPolicy
        })
    }

    private getBucketPolicy(policyType: PolicyType): aws.iam.PolicyDocument {
        return {
            Version: "2012-10-17",
            Statement: [{
                ...this.policies[policyType],
                Resource: [
                    pulumi.interpolate`${this.bucket.arn}/*`,
                ],
            }],
        }
    };

}
