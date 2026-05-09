param (
    [string]$message = "checkpoint"
)

git add .
git commit -m $message
git push