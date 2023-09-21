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
const eksNodeInstanceType = config.get("eksNodeInstanceType") || aws.ec2.InstanceType.T3_Medium;
const vpcNetworkCidr = config.get("vpcNetworkCidr") || "10.0.0.0/16";

// // Define a new VPC with 3 subnets, 3 availability zones, and a single NAT gateway.
const eksVpc = new awsx.ec2.Vpc(`${name}-vpc`, {
    cidrBlock: vpcNetworkCidr,
    enableDnsHostnames: true,
    tags: {
        "Name": `${name}-vpc`
    }
});

const cluster = new eks.Cluster("zbuchheit-cluster", {
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

const k8sProvider = new k8s.Provider("k8s-provider", {
    kubeconfig: cluster.kubeconfig
})

const appLabels = { app: "nginx" };

const deployment = new k8s.apps.v1.Deployment(`k8s-deployment`, {
    metadata: { 
        name: "nginx-deployment",
        labels: appLabels
    },
    spec: {
        replicas: 1,
        selector: { matchLabels: appLabels },
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: "nginx",
                    image: "nginx",
                    ports: [{ name: "http", containerPort: 80 }],
                }],
            },
        },
    },
}, { provider: k8sProvider });

export const labels = deployment.metadata.labels;

const nginxService = new k8s.core.v1.Service("nginx-service", {
    metadata: { name: "nginx-service" },
    spec: {
        selector: { app: "nginx" },
        type: "LoadBalancer",
        ports: [{ port: 80, targetPort: 80 }],
    },
}, { provider: k8sProvider });

export const nginxLoadBalancerAddress = nginxService.status.loadBalancer.ingress[0].hostname;

export const clusterConfig = pulumi.secret(cluster.kubeconfig);
export const kubeVersion = cluster.eksCluster.version;
export const vpcId = eksVpc.vpcId;
export const vpcPublicSubnet = eksVpc.publicSubnetIds;
export const vpcPrivateSubnet = eksVpc.privateSubnetIds;