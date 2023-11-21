# Pulumi Engine Event Handling Example

## Overview

This example demonstrates how to capture and handle engine events in a Pulumi application. It showcases a specific scenario where a Pulumi program creates an Azure Storage Account with a Resource Group as its parent. The focus is on capturing engine events to monitor resource creation, detect failures, and understand resource dependencies, particularly parent-child relationships. It leverages a inline program set up with the automation api.

## Use Case

This example is particularly useful for:

- **Debugging and Monitoring**: Capturing engine events provides insights into the deployment process, helping to monitor progress and diagnose failures.
- **Dependency Analysis**: By parsing engine events, especially in failure scenarios, you can determine dependencies between resources. This is vital for understanding the impact of a failure on dependent resources.
- **Automated Response**: With detailed event information, you can build logic to respond automatically to certain conditions, like rolling back changes or notifying administrators.

## Implementation Details

The Pulumi program in this example sets up an Azure Storage Account and a Resource Group. The Resource Group acts as the parent of the Storage Account, establishing a clear parent child relationship as well as a dependency.

### Key Components

- **Pulumi Azure-Native SDK**: Used to define Azure resources (Storage Account and Resource Group).
- **Engine Event Handling**: The program includes logic to listen to Pulumi engine events during `up` operation. These events provide detailed information about the resource operations.
- **Parent-Child Relationship Parsing**: The program parses the Universal Resource Name (URN) of resources from engine events to extract parent-child relationships, particularly useful when handling failed resource operations.

### Capturing Engine Events

Engine events are captured in real-time during the `up` operation. Each event is processed to extract relevant information. The focus is on two aspects:

1. **General Event Information**: All events are printed to the console, providing a real-time log of operations.
2. **Failure Analysis**: When a resource operation fails (e.g., due to an invalid Storage Account name), the event is analyzed to extract the URN of the failed resource. The URN is then parsed to identify the parent resource, highlighting the dependency link.

### Running the Example

To run this example, you need to have Pulumi set up with Azure credentials configured. Execute the program with `go run main.go` and destroy the infra with `go run main.go destroy`. The console output will include detailed event logs, especially useful when an operation fails.

## Conclusion

This example serves as a foundation for building more sophisticated cloud infrastructure management tools using Pulumi. By leveraging engine events, developers and system administrators can gain better visibility into their cloud resources and automate complex workflows based on real-time infrastructure data.
