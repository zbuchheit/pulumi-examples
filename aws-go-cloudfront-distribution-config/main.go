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

		config.RequireObject("distribution", &args)

		var forwardedValuesArgs *cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs
		// Set value for ForwardedValues if not set
		if args.DefaultCacheBehavior.ForwardedValues != nil {
			forwardedValuesArgs = &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
				Cookies: cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{
					Forward: pulumi.String(args.DefaultCacheBehavior.ForwardedValues.Cookies.Forward),
				},
				QueryString: pulumi.Bool(args.DefaultCacheBehavior.ForwardedValues.QueryString),
				Headers: pulumi.ToStringArray(args.DefaultCacheBehavior.ForwardedValues.Headers),
			}
		}

		distribution, err := cloudfront.NewDistribution(ctx, "mydist-zbuchheit", &cloudfront.DistributionArgs{
			Origins: cloudfront.DistributionOriginArray{ cloudfront.DistributionOriginArgs{
				OriginId: pulumi.String("zbchht.example.amazonaws.com"),
				DomainName: pulumi.String("zbchht.example.amazonaws.com"),
			} },
			Restrictions: cloudfront.DistributionRestrictionsArgs{
				GeoRestriction: cloudfront.DistributionRestrictionsGeoRestrictionArgs{
					Locations: pulumi.ToStringArray([]string{"US"}),
					RestrictionType: pulumi.String("whitelist"),
				},
			},
			ViewerCertificate: cloudfront.DistributionViewerCertificateArgs{
				MinimumProtocolVersion: pulumi.String("TLSv1.2_2021"),
				SslSupportMethod: pulumi.String("sni-only"),
			},
			Enabled: pulumi.Bool(false),
			OriginGroups: cloudfront.DistributionOriginGroupArray{ cloudfront.DistributionOriginGroupArgs{
				OriginId: pulumi.String("zbchht.example.amazonaws.com"),
				FailoverCriteria: cloudfront.DistributionOriginGroupFailoverCriteriaArgs{
					StatusCodes: pulumi.ToIntArray([]int{403, 404, 500, 502}),
				},
				Members: cloudfront.DistributionOriginGroupMemberArray{ cloudfront.DistributionOriginGroupMemberArgs{
					OriginId: pulumi.String("zbchht.example.amazonaws.com"),
				}, cloudfront.DistributionOriginGroupMemberArgs{
					OriginId: pulumi.String("zbchht2.example.amazonaws.com"),
				}},
			} },
			DefaultCacheBehavior: cloudfront.DistributionDefaultCacheBehaviorArgs{
				AllowedMethods: pulumi.ToStringArray(args.DefaultCacheBehavior.AllowedMethods),
				ForwardedValues: forwardedValuesArgs, 
				//If you use the below block of code instead you will get an invalid memory address or nil pointer dereference error
				//
				// ForwardedValues: cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
				// 	Cookies: cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{
				// 		Forward: pulumi.String(args.DefaultCacheBehavior.ForwardedValues.Cookies.Forward),
				// 	},
				// 	QueryString: pulumi.Bool(args.DefaultCacheBehavior.ForwardedValues.QueryString),
				// 	Headers: pulumi.ToStringArray(args.DefaultCacheBehavior.ForwardedValues.Headers),
				// },
				TargetOriginId: pulumi.String(args.DefaultCacheBehavior.TargetOriginId),
				ViewerProtocolPolicy: pulumi.String(args.DefaultCacheBehavior.ViewerProtocolPolicy),
				CachedMethods: pulumi.ToStringArray(args.DefaultCacheBehavior.CachedMethods),
			},
		})
		if err != nil {
			return err
		}

		fmt.Printf("args: %#v\n", args.DefaultCacheBehavior.ForwardedValues)
		fmt.Printf("args with nil check: %#v\n", forwardedValuesArgs)
		ctx.Export("cloudFrontDomain", distribution.DomainName)
		return nil
	})
}
