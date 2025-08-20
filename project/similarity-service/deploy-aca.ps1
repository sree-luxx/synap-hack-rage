Param(
  [string]$ResourceGroup = "hackhub-rg",
  [string]$Location = "eastus",
  [string]$AcrName = "hackhubacr$((Get-Random))",
  [string]$EnvName = "hackhub-cae",
  [string]$AppName = "similarity-service",
  [string]$Tag = "v1",
  [string]$SimilarityApiKey = "change-me"
)

az group create -n $ResourceGroup -l $Location | Out-Null
az acr show -n $AcrName -g $ResourceGroup 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { az acr create -n $AcrName -g $ResourceGroup --sku Basic | Out-Null }

az extension add -n containerapp --yes | Out-Null
az provider register --namespace Microsoft.App | Out-Null
az containerapp env show -n $EnvName -g $ResourceGroup 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { az containerapp env create -n $EnvName -g $ResourceGroup -l $Location | Out-Null }

# Build to ACR using ACR Tasks
az acr build -r $AcrName -t similarity-service:$Tag -f Dockerfile .

$acrUser = az acr credential show -n $AcrName --query username -o tsv
$acrPass = az acr credential show -n $AcrName --query passwords[0].value -o tsv
$acrLogin = "$AcrName.azurecr.io"
$image = "$acrLogin/similarity-service:$Tag"

if (az containerapp show -n $AppName -g $ResourceGroup 2>$null) {
  az containerapp update -n $AppName -g $ResourceGroup `
    --image $image `
    --set-env-vars SIMILARITY_API_KEY=$SimilarityApiKey | Out-Null
} else {
  az containerapp create -n $AppName -g $ResourceGroup --environment $EnvName `
    --image $image `
    --ingress external --target-port 3001 `
    --registry-server $acrLogin --registry-username $acrUser --registry-password $acrPass `
    --env-vars SIMILARITY_API_KEY=$SimilarityApiKey | Out-Null
}

az containerapp show -n $AppName -g $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv


