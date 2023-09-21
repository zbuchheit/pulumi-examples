import pulumi
import pulumi_awsx as awsx
import pulumi_eks as eks

# Get some values from the Pulumi configuration (or use defaults)
config = pulumi.Config()
min_cluster_size = config.get_float("minClusterSize", 3)
max_cluster_size = config.get_float("maxClusterSize", 6)
desired_cluster_size = config.get_float("desiredClusterSize", 3)
eks_node_instance_type = config.get("eksNodeInstanceType", "t3.medium")
vpc_network_cidr = config.get("vpcNetworkCidr", "10.0.0.0/16")

# Create a VPC for the EKS cluster
eks_vpc = awsx.ec2.Vpc(
    "eks-vpc",
    enable_dns_hostnames=True,
    cidr_block=vpc_network_cidr,
    tags={"Name": "zbuchheit-vpc", "Owner": "zbuchheit"},
)

# Create the EKS cluster
eks_cluster = eks.Cluster(
    "zbuchheit-cluster",
    vpc_id=eks_vpc.vpc_id,
    public_subnet_ids=eks_vpc.public_subnet_ids,
    private_subnet_ids=eks_vpc.private_subnet_ids,
    instance_type=eks_node_instance_type,
    min_size=min_cluster_size,
    max_size=max_cluster_size,
    desired_capacity=desired_cluster_size,
    node_associate_public_ip_address=False,
    encrypt_root_block_device=True,
    enabled_cluster_log_types=[
        "api",
        "audit",
        "authenticator",
        "controllerManager",
        "scheduler",
    ],
    tags={"Name": "zbuchheit-cluster", "Owner": "zbuchheit"},
)

# Export values to use elsewhere
pulumi.export("kubeconfig", eks_cluster.kubeconfig)
pulumi.export("vpcId", eks_vpc.vpc_id)
