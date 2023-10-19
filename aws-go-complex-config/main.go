package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)
type distributionArgs struct {
	DefaultCacheBehavior cloudfront.DistributionDefaultCacheBehavior `pulumi:"defaultCacheBehavior"`
}
func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		config := config.New(ctx, "")
		var args distributionArgs
		var argsGet distributionArgs 
		var argsTry distributionArgs 
		config.RequireObject("distribution", &args)
		config.GetObject("disribution", &argsGet)
		config.TryObject("disribution", &argsTry)
		
		fmt.Printf("args: %#v\n", args)
		fmt.Printf("argsGet: %#v\n", argsGet)
		fmt.Printf("argsTry: %#v\n", argsTry)
		
		return nil
	})
}
