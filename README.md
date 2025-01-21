# Lynkmi API

An unofficial API to submit links to Lynkmi.com. It uses Playwright to submit a link via browser automation, so it might be flaky - developer beware.

## Usage
```
curl -X POST https://lynkmi-api.fly.dev/submitLink \
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

The description and title fields may be omitted.
The title field tries to use the auto-generated title from Lynkmi, and if it fails it will use "Untitled Link" as the title.

I host an instance of this API at https://lynkmi-api.fly.dev/. But you may not want to rely on this if you're concerned about security or reliability because:
a) This service does not store or log your password, and I do run the open source code shown here, but you are still revealing your password to this service.
b) This service processes requests serially and takes 1-5s per request, it might fail under any significant load.

## Hosting the API yourself

To run it locally:
```
pnpm install
pnpm run dev
```

To deploy it, use the attached Dockerfile. If you're using Fly, the fly.toml should be helpful, you'll just need to change the app name to your own, and then run:
```
fly deploy
```

It takes ~400 MB of RAM when idle, so fits in the Fly 512mb instance at $3.19/mo. Ensure you scale down to one instance with `fly scale count 1`.
You may also want to [scale to zero](https://www.jacobparis.com/content/fly-autoscale-to-zero), but this is a bit more effort to set up.