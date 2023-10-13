import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { ResourceTransformationArgs } from "@pulumi/pulumi";

const newAwsProvider = new aws.Provider("newAwsProvider", {
    region: "us-west-2",
});

const autoExplicitProvider: pulumi.ResourceTransformation = (args:ResourceTransformationArgs) => {
    // Override the provider property with the new provider
    args.opts.provider = newAwsProvider;
    return args;
};

/**
 * Apply provider to all resources in the stack without having to use the opts parameter
 */
pulumi.runtime.registerStackTransformation(autoExplicitProvider);

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("zbuchheit-bucket");

const vpc = new aws.ec2.Vpc("zbuchheit-vpc", {
    cidrBlock: "10.0.0.0/16",
    tags: {
        owner: "zbuchheit",
    },
});

const subnet = new aws.ec2.Subnet("zbuchheit-subnet", {
    cidrBlock: "10.0.1.0/24",
    vpcId: vpc.id,
    availabilityZone: "us-west-2a",
});

const securityGroup = new aws.ec2.SecurityGroup("zbuchheit-sg", {
    description: "security group for my instance",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: [subnet.cidrBlock.apply((cidrBlock) => `${cidrBlock}`)],
        },
    ],
    vpcId: vpc.id,
});

const instance = new aws.ec2.Instance("zbuchheit-instance", {
    instanceType: "t2.micro",
    ami: "ami-07d07d65c47e5aa90",
    subnetId: subnet.id,
    availabilityZone: subnet.availabilityZone,
    vpcSecurityGroupIds: [securityGroup.id],
    tags: {
        owner: "zbuchheit",
    },
});
