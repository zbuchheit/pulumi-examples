"""An AWS Python Pulumi program"""

import pulumi
from pulumi_aws import Provider, s3, ec2

new_aws_provider = Provider("newAwsProvider", region="us-west-2")

def transform(args: pulumi.ResourceTransformationArgs):
    """
    Transformation function to modify resource properties before deployment.
    """
    # Override the provider property with the new provider
    args.opts.provider = new_aws_provider

    return args
"""
Apply provider to all resources in the stack without havin to use the ops parameter
"""
pulumi.runtime.register_stack_transformation(transform)

# Create an AWS resource (S3 Bucket)
bucket = s3.Bucket('zbuchheit-bucket')

vpc = ec2.Vpc('zbuchheit-vpc',
    cidr_block='10.0.0.0/16',
    tags={
        'owner': 'zbuchheit'
    });

subnet = ec2.Subnet('zbuchheit-subnet',
                    cidr_block='10.0.1.0/24',
                    vpc_id=vpc.id
                    )

security_group = ec2.SecurityGroup('zbuchheit-sg',
                                   description='security group for my instance',
                                   ingress=[
                                       ec2.SecurityGroupIngressArgs(
                                            protocol='tcp',
                                            from_port=22,
                                            to_port=22,
                                            cidr_blocks=[subnet.cidr_block],
                                    ),
                                   ],
                                   vpc_id=vpc.id)

instance = ec2.Instance('zbuchheit-instance',
                        instance_type='t2.micro',
                        ami='ami-07d07d65c47e5aa90',
                        subnet_id=subnet.id,
                        vpc_security_group_ids=[security_group.id],
                        tags={
                            'owner': 'zbuchheit'
                        })