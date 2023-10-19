# Pulumi AWS CloudFront Distribution Example in Go

## Overview

This updated example Go program uses Pulumi to create an AWS CloudFront Distribution. The primary update is the handling of optional `ForwardedValues` in the `DefaultCacheBehavior`.

## Key Concepts

### Optional Fields and `nil` Pointers

The program now correctly handles optional fields by checking for `nil` before attempting to dereference the pointers. This avoids nil pointer dereference errors.

### Configuration and `ForwardedValues`

The program reads the `ForwardedValues` from the configuration. If it's not provided, the program safely skips setting it, avoiding nil pointer errors.

## Code Highlights

### Handling Optional `ForwardedValues`

```go
var forwardedValuesArgs *cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs
if args.DefaultCacheBehavior.ForwardedValues != nil {
	forwardedValuesArgs = &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
		// ...
	}
}
