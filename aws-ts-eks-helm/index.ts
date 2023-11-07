import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const name = "zach-example";

// Grab some values from the Pulumi configuration (or use default values)
const config = new pulumi.Config();
const minClusterSize = config.getNumber("minClusterSize") || 3;
const maxClusterSize = config.getNumber("maxClusterSize") || 6;
const desiredClusterSize = config.getNumber("desiredClusterSize") || 3;
const eksNodeInstanceType = config.get("eksNodeInstanceType") || aws.ec2.InstanceType.T3_Small;
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";

const eksVpc = new awsx.ec2.Vpc(`${name}-vpc`, {
    cidrBlock: vpcNetworkCidr,
    enableDnsHostnames: true,
    tags: {
        "Name": `${name}-vpc`
    },
    numberOfAvailabilityZones: 2,

});


const cluster = new eks.Cluster(`${name}-cluster`, {
    vpcId: eksVpc.vpcId,
    publicSubnetIds: eksVpc.publicSubnetIds,
    privateSubnetIds: eksVpc.privateSubnetIds,
    instanceType: eksNodeInstanceType,
    version: "1.24",
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

const k8sProvider = new k8s.Provider(`${name}-k8s-provider`, {
    kubeconfig: cluster.kubeconfig
})

const alb = new k8s.helm.v3.Release(`${name}-manifest`, {
    chart: "./testChart",
    namespace: 'default',
    skipAwait: false,
    values: {
        clusterName: cluster.eksCluster.name
    }
}, { 
    dependsOn: [cluster],
    provider: k8sProvider
});
                                  
export const albDetails = alb.resourceNames;
export const kubeVersion = cluster.eksCluster.version;
export const vpcId = eksVpc.vpcId;
export const vpcPublicSubnet = eksVpc.publicSubnetIds;
export const vpcPrivateSubnet = eksVpc.privateSubnetIds;