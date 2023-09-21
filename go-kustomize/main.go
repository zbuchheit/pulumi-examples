package main

import (
	"github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes"
	"github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/kustomize"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
        provider, err := kubernetes.NewProvider(ctx, "provider", &kubernetes.ProviderArgs{
            EnableServerSideApply: pulumi.BoolPtr(true),
        })
        if err != nil {
            return err
        }
		kustomize.NewDirectory(ctx, "zbuchheit", kustomize.DirectoryArgs{
			Directory: pulumi.String("https://github.com/kubernetes-sigs/kustomize/tree/v3.3.1/examples/helloWorld"),
		}, 
		pulumi.Provider(provider),
	)

		return nil
	})
}