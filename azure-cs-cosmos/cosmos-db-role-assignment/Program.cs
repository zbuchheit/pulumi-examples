﻿using Pulumi;
using Pulumi.AzureAD;
using System;
using System.Threading.Tasks;
using ManagedIdentity = Pulumi.AzureNative.ManagedIdentity;
using Pulumi.AzureNative.DocumentDB;

return await Pulumi.Deployment.RunAsync(async () =>
{ 
    const int initialDelayMilliseconds = 500;
    const int MaximumRetries = 10;
    const int ExponentialBackoffFactor = 2;
    const string CosmosDbBuiltInDataContributorId = "00000000-0000-0000-0000-000000000002";

    var stackReference = new StackReference($"{Deployment.Instance.OrganizationName}/cosmos-db-stack-reference/{Deployment.Instance.StackName}");

    var resourceGroupName = stackReference.RequireOutput("resourceGroupName").Apply(id => (string)id);

    var cosmosAccount = GetDatabaseAccount.Invoke(new GetDatabaseAccountInvokeArgs
    {
        ResourceGroupName = resourceGroupName,
        AccountName = stackReference.RequireOutput("cosmosDbAccountName").Apply(id => (string)id)
    });

    var userAssignedIdentity = new ManagedIdentity.UserAssignedIdentity("user-assigned-identity", new ManagedIdentity.UserAssignedIdentityArgs 
    { 
        ResourceGroupName = resourceGroupName 
    }).PrincipalId;

    /*
    The following code is a workaround for a bug in the Azure SDK. The bug is that the PrincipalId property of the UserAssignedIdentity resource is not populated
    when the resource is created. This is a problem because we need the PrincipalId to assign the role to the identity. The workaround is to poll the resource
    until the PrincipalId is populated by reference AD. It would be preferable to be able to use the PrincipalId property of the UserAssignedIdentity resource as
    it only requires an api call to the Resource Manager API. The workaround requires an additional call to the AD API to get the Service Principal.
    */
    // var userAssignedIdentityPrincipalId = userAssignedIdentity.Apply(async principalId =>
    // {

    //     GetServicePrincipalResult? servicePrincipalResult = null;
    //     for (int attempt = 1; attempt <= MaximumRetries; attempt++)
    //     {
    //         try
    //         {
    //             servicePrincipalResult = await GetServicePrincipal.InvokeAsync(new GetServicePrincipalArgs
    //             {
    //                 ObjectId = principalId
    //             });
    //             Pulumi.Log.Debug($"Attempt {attempt} succeeded in fetching Service Principal.");
    //             return servicePrincipalResult;
    //         }
    //         catch (Exception e)
    //         {
    //             Pulumi.Log.Debug($"Attempt {attempt} failed to fetch Service Principal.");

    //             if (attempt == MaximumRetries)
    //             {
    //                 Pulumi.Log.Error($"Service Principal not resolved after {attempt} tries. Exception: {e.Message}");
    //                 throw;
    //             }
    //             int delay = initialDelayMilliseconds * (int)Math.Pow(ExponentialBackoffFactor, attempt);
    //             Pulumi.Log.Debug($"Waiting for {delay}ms before retrying.");
    //             await Task.Delay(delay);
    //         }
    //     }
    //     return servicePrincipalResult;
    // });

    var cosmosDBDataContributorRoleDefinition = GetSqlResourceSqlRoleDefinition.Invoke(new GetSqlResourceSqlRoleDefinitionInvokeArgs
    {
        AccountName = cosmosAccount.Apply(ca => ca.Name),
        ResourceGroupName = resourceGroupName,
        RoleDefinitionId = CosmosDbBuiltInDataContributorId
    }).Apply(roleDefinition => roleDefinition.Id);

    var sqlResourceSqlRoleAssignment = new SqlResourceSqlRoleAssignment($"sql-resource-sql-role-assignment", new SqlResourceSqlRoleAssignmentArgs
    {
        AccountName = cosmosAccount.Apply(account => account.Name),
        PrincipalId = userAssignedIdentity,
        ResourceGroupName = resourceGroupName,
        RoleAssignmentId = new Pulumi.Random.RandomUuid("testRandomUuid").Result,
        RoleDefinitionId = cosmosDBDataContributorRoleDefinition,
        Scope = cosmosAccount.Apply(account => account.Id),
    });

});