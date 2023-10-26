import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";

const name = "zach-example";

const config = new pulumi.Config();
const eksNodeInstanceType =
  config.get("eksNodeInstanceType") || aws.ec2.InstanceType.T3_Small;


const cluster = new eks.Cluster("zbuchheit-cluster", {
  version: "1.24",
  instanceType: eksNodeInstanceType,
  tags: {
    Name: `${name}-cluster`,
    Owner: "zbuchheit",
  },
});

cluster.kubeconfig.apply((kubeconfig) => {
    console.log(kubeconfig)
});

export const clusterConfig = pulumi.secret(cluster.kubeconfig);
export const kubeVersion = cluster.eksCluster.version;
export const kubeName = cluster.eksCluster.name;
