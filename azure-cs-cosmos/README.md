# Pulumi Managed Identity and Cosmos DB Role Assignment

This example demonstrates how to use Pulumi to:

1. Create a User-Assigned Managed Identity in Azure.
2. Assign the Managed Identity the `Data Contributor` role on an Azure Cosmos DB.

## Overview

The code is written in C# and uses the Pulumi AD and Azure Native providers to interact with Azure resources.

### Key Components:

- **Managed Identity**: A user-assigned managed identity is created and its `PrincipalId` is retrieved. This ID represents the identity in Azure AD.

- **Service Principal Workaround**: Due to a known bug in the Azure SDK where the `PrincipalId` property of the UserAssignedIdentity resource is not populated immediately upon creation, there's a mechanism in place to repeatedly poll Azure AD for the Service Principal until the `PrincipalId` is available.

- **Role Assignment**: The Managed Identity is then given the `Data Contributor` role on an Azure Cosmos DB. This role allows the identity to read and write data to the Cosmos DB.

## Usage:

### Pre-requisites:

1. Ensure you have Pulumi CLI set up and configured with Azure credentials.
2. You should have a pre-existing Cosmos DB and its details referenced via a `StackReference`.

### Steps:

1. Deploy the Pulumi Stack Reference program:

1. Deploy the Pulumi DB Role Assignment program

1. After deployment, the Managed Identity will be assigned the necessary permissions on the specified Cosmos DB.

## Notes:

- The constant `CosmosDbBuiltInDataContributorId` contains the built-in role ID for the Cosmos DB Data Contributor.
- The role assignment ID is generated randomly using the `Pulumi.Random` namespace to ensure uniqueness.
