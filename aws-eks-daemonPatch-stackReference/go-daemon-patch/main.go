package main

import (
	"encoding/json"

	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	v1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/apps/v1"
	corev1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/core/v1"
	metav1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/meta/v1"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get some configuration values or set default values
		var stackRef *pulumi.StackReference

		stackRef, err := pulumi.NewStackReference(ctx, "zbuchheit-pulumi-corp/aws-ts-eks/dev", nil)
		if err != nil {
			return err
		}

		kubeConfig, err := stackRef.GetOutputDetails("clusterConfig")
		if err != nil {
			return err
		}

		kubeConfigSerialized, err := json.Marshal(kubeConfig.SecretValue)
		if err != nil {
			return err
		}

		kubeProvider, err := kubernetes.NewProvider(ctx, "eks-kubernetes", &kubernetes.ProviderArgs{
			Kubeconfig:           pulumi.String(kubeConfigSerialized),
			EnableServerSideApply: pulumi.BoolPtr(true),
		})
		if err != nil {
			return err
		}

		daemonSet, err := v1.NewDaemonSetPatch(ctx, "k8s-daemonset-patch", &v1.DaemonSetPatchArgs{
					Metadata: metav1.ObjectMetaPatchArgs{
						Name:      pulumi.String("kube-proxy"),
						Namespace: pulumi.String("kube-system"),
						Annotations: pulumi.StringMap{
							"pulumi.com/patchForce":        pulumi.String("true"),
							// "pulumi.com/patchFieldManager": pulumi.String("pulumi"),
						},
					},
					Spec: v1.DaemonSetSpecPatchArgs{
						Template: corev1.PodTemplateSpecPatchArgs{
							Spec: corev1.PodSpecPatchArgs{
								Containers: corev1.ContainerPatchArray{
									corev1.ContainerPatchArgs{
										Name:  pulumi.String("kube-proxy"),
										Image: pulumi.String("602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/kube-proxy:v1.24.7-minimal-eksbuild.2"), //update from 1.24.7
									},
								},
							},
						},
					},
				}, pulumi.Provider(kubeProvider), 
				pulumi.RetainOnDelete(true), 
			)
		if err != nil {
			return err
		}
		ctx.Export("DaemonSetName", daemonSet.Metadata.Name())
		return nil
	})
}