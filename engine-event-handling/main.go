package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/pulumi/pulumi-azure-native-sdk/resources/v2"
	"github.com/pulumi/pulumi-azure-native-sdk/storage/v2"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/events"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/apitype"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

const (
	azurePluginVersion = "v2.0.0"
	resourceGroupName  = "resourceGroup"
	storageAccountName = "sa-zbuchheit-v2"
	stackName 		= "dev"
	projectName 	= "inlineAzureProjectZbuchheit"
)

func main() {
	// to destroy our program, we can run `go run main.go destroy`
	destroy := len(os.Args) > 1 && os.Args[1] == "destroy"
	ctx := context.Background()

	deployFunc := func(ctx *pulumi.Context) error {
		resourceGroup, err := resources.NewResourceGroup(ctx, resourceGroupName, nil)
		if err != nil {
			return err
		}
		//This is intentionally wrong to test the error handling with the uppercase letter in the name
		//NOTE: If you fail for a size reason you will encounter a validation error that will not result in a ResOpFailedEvent but will still appear in Diagnostic Event
		//Related to https://github.com/pulumi/pulumi-azure-native/issues/164
		_, err = storage.NewStorageAccount(ctx, "zBchhttest", &storage.StorageAccountArgs{
			ResourceGroupName: resourceGroup.Name,
			Sku: &storage.SkuArgs{
				Name: pulumi.String("Standard_LRS"),
			},
			Kind: pulumi.String("StorageV2"),
		}, pulumi.Parent(resourceGroup))
		if err != nil {
			return err
		}
		return nil
	}

	stack, err := auto.UpsertStackInlineSource(ctx, stackName, projectName, deployFunc)
	if err != nil {
		fmt.Printf("Failed to create or select stack: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Created/Selected stack %q\n", stackName)

	w := stack.Workspace()

	fmt.Println("Installing the Azure-Native plugin")

	// for inline source programs, we must manage plugins ourselves
	err = w.InstallPlugin(ctx, "azure-native", "v2.0.0")
	if err != nil {
		fmt.Printf("Failed to install program plugins: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Successfully installed Azure plugin")

	// set stack configuration specifying the Azure region to deploy
	stack.SetConfig(ctx, "azure-native:location", auto.ConfigValue{Value: "westus2"})

	fmt.Println("Successfully set config")
	fmt.Println("Starting refresh")

	_, err = stack.Refresh(ctx)
	if err != nil {
		fmt.Printf("Failed to refresh stack: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Refresh succeeded!")

	if destroy {
		fmt.Println("Starting stack destroy")

		// wire up our destroy to stream progress to stdout
		stdoutStreamer := optdestroy.ProgressStreams(os.Stdout)

		// destroy our stack and exit early
		_, err := stack.Destroy(ctx, stdoutStreamer)
		if err != nil {
			fmt.Printf("Failed to destroy stack: %v", err)
		}
		fmt.Println("Stack successfully destroyed")
		os.Exit(0)
	}

	fmt.Println("Starting update")
	upChannel := make(chan events.EngineEvent)
	var upEvents []events.EngineEvent

	go collectEvents(upChannel, &upEvents)

	_, err = stack.Up(ctx, optup.EventStreams(upChannel))
	for _, event := range upEvents {
		if event.DiagnosticEvent != nil && event.DiagnosticEvent.URN != "" {
			fmt.Printf("Diagnostic Event: %v\n", event.DiagnosticEvent)
		}
        if event.EngineEvent.ResOpFailedEvent != nil {
			handleResOpFailedEvent(event.EngineEvent)
		}
    }
	if err != nil {
		fmt.Printf("Failed to update stack: %v\n\n", err)
		os.Exit(1)
	}

	fmt.Println("Update succeeded!")
	os.Exit(0)
}

func collectEvents(eventChannel <-chan events.EngineEvent, events *[]events.EngineEvent) {
	for {
		event, ok := <-eventChannel
		if !ok {
			return
		}
		*events = append(*events, event)
	}
}

func handleResOpFailedEvent(event apitype.EngineEvent) {
	fmt.Printf("Handling Res Operation failed: %+v\n", event.ResOpFailedEvent.Metadata)
	fmt.Printf("Parent of failed Resource: %+v\n", getParentURN(event.ResOpFailedEvent.Metadata.URN))
}

func getParentURN(urn string) string {
	parts := strings.Split(urn, "$")
	if len(parts) > 1 {
		return parts[0]
	}
	return "No parent found"
}