import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi"

const name = "zach-example";

// Grab some values from the Pulumi configuration (or use default values)
const config = new pulumi.Config();
const minClusterSize = config.getNumber("minClusterSize") || 3;
const maxClusterSize = config.getNumber("maxClusterSize") || 6;
const desiredClusterSize = config.getNumber("desiredClusterSize") || 3;
const eksNodeInstanceType = config.get("eksNodeInstanceType") || aws.ec2.InstanceType.T3a_Nano;
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";

// Define a new VPC with 3 subnets, 3 availability zones, and a single NAT gateway.
const eksVpc = new awsx.ec2.Vpc(`${name}-vpc`, {
    cidrBlock: vpcNetworkCidr,
    enableDnsHostnames: true,
    tags: {
        "Name": `${name}-vpc`
    }
});

const cluster = new eks.Cluster("myCluster", {
    vpcId: eksVpc.vpcId,
    publicSubnetIds: eksVpc.publicSubnetIds,
    privateSubnetIds: eksVpc.privateSubnetIds,
    instanceType: eksNodeInstanceType,
    minSize: minClusterSize,
    maxSize: maxClusterSize,
    desiredCapacity: desiredClusterSize,
    // skipDefaultNodeGroup: true,
    nodeAssociatePublicIpAddress: false,
    //Common Settings
    encryptRootBlockDevice: true,
    enabledClusterLogTypes: ["api", "audit", "authenticator", "controllerManager", "scheduler"],
    tags: {
        "Name": `${name}-cluster`,
        "Owner": "zbuchheit"
    }
});

// const managed_node_group_spot = new eks.ManagedNodeGroup(`${name}-manangednodegroup-spot`, {
//     cluster: cluster,
//     capacityType: "SPOT",
//     instanceTypes: [aws.ec2.InstanceType.T3a_Nano],
//     nodeRole: cluster.instanceRoles[0],
//     labels: {"managed":"true", "spot":"true"},
//     tags: {
//         "k8s.cluster-autoscaler/zbuchheit-dev":"owned",
//         "k8s.cluster-autoscaler/enabled":"True",
//         "team":"ce-team",
//         "environment":"development"
//     },
//     scalingConfig: {
//                     desiredSize: 2, 
//                     minSize: 1, 
//                     maxSize:10
//                    },
//     diskSize: 10,
// })

export const clusterConfig = pulumi.secret(cluster.kubeconfig);
export const kubeVersion = cluster.eksCluster.version;
export const vpcId = eksVpc.vpcId;
export const vpcPublicSubnet = eksVpc.publicSubnetIds;
export const vpcPrivateSubnet = eksVpc.privateSubnetIds;

