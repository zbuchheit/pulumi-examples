using Pulumi;
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
    
    var userAssignedIdentityPrincipalId = userAssignedIdentity.Apply(async principalId =>
    {

        GetServicePrincipalResult? servicePrincipalResult = null;
        for (int attempt = 1; attempt <= MaximumRetries; attempt++)
        {
            try
            {
                servicePrincipalResult = await GetServicePrincipal.InvokeAsync(new GetServicePrincipalArgs
                {
                    ObjectId = principalId
                });
                Pulumi.Log.Debug($"Attempt {attempt} succeeded in fetching Service Principal.");
                return servicePrincipalResult;
            }
            catch (Exception e)
            {
                Pulumi.Log.Debug($"Attempt {attempt} failed to fetch Service Principal.");

                if (attempt == MaximumRetries)
                {
                    Pulumi.Log.Error($"Service Principal not resolved after {attempt} tries. Exception: {e.Message}");
                    throw;
                }
                int delay = initialDelayMilliseconds * (int)Math.Pow(ExponentialBackoffFactor, attempt);
                Pulumi.Log.Debug($"Waiting for {delay}ms before retrying.");
                await Task.Delay(delay);
            }
        }
        return servicePrincipalResult;
    });

    var cosmosDBDataContributorRoleDefinition = GetSqlResourceSqlRoleDefinition.Invoke(new GetSqlResourceSqlRoleDefinitionInvokeArgs
    {
        AccountName = cosmosAccount.Apply(ca => ca.Name),
        ResourceGroupName = resourceGroupName,
        RoleDefinitionId = CosmosDbBuiltInDataContributorId
    }).Apply(roleDefinition => roleDefinition.Id);

    var sqlResourceSqlRoleAssignment = new SqlResourceSqlRoleAssignment($"sql-resource-sql-role-assignment", new SqlResourceSqlRoleAssignmentArgs
    {
        AccountName = cosmosAccount.Apply(account => account.Name),
        PrincipalId = userAssignedIdentityPrincipalId.Apply(principalId => principalId!.ObjectId),
        ResourceGroupName = resourceGroupName,
        RoleAssignmentId = new Pulumi.Random.RandomUuid("testRandomUuid").Result,
        RoleDefinitionId = cosmosDBDataContributorRoleDefinition,
        Scope = cosmosAccount.Apply(account => account.Id),
    });

});