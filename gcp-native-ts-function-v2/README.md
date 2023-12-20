# Code Overview
The code first sets up a Google Cloud Storage bucket with public access prevention enforced. It then creates an asset archive from the local ./function directory and uploads it to the bucket. Two Google Cloud Functions are then created, both using the uploaded function archive as their source code.

It is intended to display differences in behavior between the google native provider and the gcp classic provider. It, like everything, is subject to the passing of time making it outdated.