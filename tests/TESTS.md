# Notes on testing

## gitlab

A webhook from gitlab looks like this:

POST to the specified endpoint.  (`https://server/webhook` is what we want here.)

These http headers.

      "content-length": "2512",
      "content-type": "application/json",
      "x-gitlab-event": "Push Hook",
      "x-gitlab-token": "SecretToken"
   
A JSON object as a payload. For example see `gitlab1.json`.

Here's a test command in CURL
```
curl -X POST  -H "X-GITLAB-EVENT:Push Hook" -H "X-GITLAB-TOKEN:SecretToken" -H "Content-Type:application/json" -d @gitlab1.json https://video.myglance.org:3100/
```

