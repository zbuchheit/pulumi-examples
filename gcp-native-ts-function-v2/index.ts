import * as googleNative from "@pulumi/google-native"
import * as asset from "@pulumi/pulumi/asset";
import * as gcpClassic from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi"

const config = new pulumi.Config();
const project = config.require("project");

const bucket = new googleNative.storage.v1.Bucket("zbuchheit-bucket", {
    storageClass: 'STANDARD',
    project: project,
    iamConfiguration: {
        publicAccessPrevention: 'enforced',
    },
});

const functionArchive = new asset.AssetArchive({
    ".": new asset.FileArchive("./function"),
});

const object = new googleNative.storage.v1.BucketObject('zbuchheit-native-bucket-object', {
    bucket: bucket.name,
    source: functionArchive,
}, {
    // replaceOnChanges: ["source"], //Uncomment this line to workaround the object not changing
});

const classicObject = new gcpClassic.storage.BucketObject('zbuchheit-classic-bucket-object', {
    bucket: bucket.name,
    source: functionArchive,
});

const myFunction = new googleNative.cloudfunctions.v2.Function("zbuchheit-function-1", {
    project: project,
    functionId: "zbuchheit-function-1",
    name: 'projects/pulumi-ce-team/locations/us-west1/functions/zbuchheit-function-1', 
    buildConfig: {
        entryPoint: "helloGET",
        runtime: "nodejs20",
        source: {
            storageSource: {
                bucket: bucket.name,
                object: classicObject.name
            },
        },
    },
});
const myFunction2 = new googleNative.cloudfunctions.v2.Function("zbuchheit-function-2", {
    project: project,
    functionId: "zbuchheit-function-2",
    name: 'projects/pulumi-ce-team/locations/us-west1/functions/zbuchheit-function-2', 
    buildConfig: {
        entryPoint: "helloGET",
        runtime: "nodejs20",
        source: {
            storageSource: {
                bucket: bucket.name,
                object: object.name
            },
        },
    },
});
export const myFunctionUrl = myFunction.url;
export const myFunctionUrl2 = myFunction2.url;

