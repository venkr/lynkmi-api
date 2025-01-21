# Lynkmi API

🚧 **Work in Progress** 🚧

An unofficial API to submit links to Lynkmi.com

## Using the API

WIP: I intend to host a version, but you should probably just host your own or use playwright code directly.

A sample command to submit a link:
```
curl -X POST https://api.lynmki.venki.dev/submitLink \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password",
    "title": "Example Website",
    "url": "https://example.com",
    "tags": ["test"],
    "description": "This is an optional description"
  }'
```

## Running the API

To run it locally:
```
pnpm install
pnpm run dev
```

To deploy it, use the attached Dockerfile. If you're using Fly, the fly.toml should be helpful, you'll just need to change the app name to your own.

