using Pulumi.AzureNative.Resources;
using System.Collections.Generic;

return await Pulumi.Deployment.RunAsync(() =>
{
    var resourceGroup = new ResourceGroup("resource-group", new ResourceGroupArgs{
        ResourceGroupName = "zbuchheit",
        Tags = { { "Environment", "Dev" }, {"Owner", "Zbuchheit"} },
    });

    var cosmosAccount = new Pulumi.AzureNative.DocumentDB.DatabaseAccount("cosmos-account", new Pulumi.AzureNative.DocumentDB.DatabaseAccountArgs{
        AccountName = "zbuchheit",
        CreateMode = Pulumi.AzureNative.DocumentDB.CreateMode.Default,
        ResourceGroupName = resourceGroup.Name,
        Locations = new[] {
            new Pulumi.AzureNative.DocumentDB.Inputs.LocationArgs
            {
                LocationName = resourceGroup.Location,
                FailoverPriority = 0,
                IsZoneRedundant = false
            }
        },
        DatabaseAccountOfferType = Pulumi.AzureNative.DocumentDB.DatabaseAccountOfferType.Standard,
        EnableFreeTier = true,
        Kind = Pulumi.AzureNative.DocumentDB.DatabaseAccountKind.GlobalDocumentDB,
        Tags = { { "Environment", "Dev" }, {"Owner", "Zbuchheit"} },
    });

    var sqlCosmosDBDatabase = new Pulumi.AzureNative.DocumentDB.SqlResourceSqlDatabase("sql-resource-sql-db", new()
    {
        AccountName = cosmosAccount.Name,
        DatabaseName = "zbuchheit",
        Location = resourceGroup.Location,
        Options = null,
        Resource = new Pulumi.AzureNative.DocumentDB.Inputs.SqlDatabaseResourceArgs
        {
            Id = "zbuchheit",
        },
        ResourceGroupName = resourceGroup.Name,
    });

    // Export the primary key of the Storage Account
    return new Dictionary<string, object?>
    {   
        ["resourceGroupName"] = resourceGroup.Name,
        ["cosmosDbAccountName"] = cosmosAccount.Name,
    };
});