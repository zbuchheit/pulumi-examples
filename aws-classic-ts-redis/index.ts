import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";

const name = "zach";
// Define a new VPC with 3 subnets, 3 availability zones, and a single NAT gateway.
const myVpc = new awsx.ec2.Vpc(`${name}-vpc`, {
    numberOfAvailabilityZones: 3,
    natGateways: { strategy: "Single" },
    cidrBlock: "10.0.0.0/22",
    tags: {
        "Name": `${name}-vpc`
    }
});

const redisSecurityGroup = new aws.ec2.SecurityGroup(`${name}-redisSecurityGroup`, {
    vpcId: myVpc.vpc.id,
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    tags: {
        "Name": `${name}-redisSecurityGroup`
    }
});

const subnetGroup = new aws.elasticache.SubnetGroup(`${name}-redis-subnet-group`, {
    subnetIds: myVpc.privateSubnetIds,
});

new aws.elasticache.Cluster(`${name}-redisCluster`, {
    engine: "redis",
    engineVersion: "7.0",
    nodeType: "cache.t2.micro",
    numCacheNodes: 1,
    subnetGroupName: subnetGroup.name,
    securityGroupIds: [redisSecurityGroup.id],
    tags: {
        "Name": `${name}-redisCluster`
    }
});

// Export the VPC's ID, private and public subnet IDs
export const privateSubnetIds = myVpc.privateSubnetIds;
export const publicSubnetIds = myVpc.publicSubnetIds;
export const vpcObject = myVpc.vpcId;
