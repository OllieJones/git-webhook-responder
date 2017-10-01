# git Webhook Responder

github and gitlab offer *webhooks*, outbound requests to web services of your choice. When somebody does something
to your repository, like `push` changes up, the server makes the webhook request.

## Uses

### Continuous Deployment

This program lets you set up your machine to receive webhook requests and do something useful.  For example, when a webhook
announces a `push` to your `staging` branch, it can fetch, build, and deploy that branch.

TODO more to come

## Operation

This is a node / express web application. By default it listens on port 3100 for incoming webhooks.  

### Validation

When a webhook arrives this program validates and authenticates it.

* Is it well-formed?
* Is the webhook secret as expected?
* Did the webhook request originate from an address on a whitelist (optional)?

The program uses `syslog` to record the results of webhook validation.  On failure it  makes a 
 syslog entry and ignores the request.

### Action

The program then spawns a shell and runs the command `on-webhook`. That shell script or 
program does what you want it to do.

`on-webhook` has parameters describing the webhook. When you write it, **you must check the parameters** 
to make sure it does what you want done.


#### Name

   `on-webhook`   Run an action when receiving a webhook

#### Synopsis

    on-webhook repository action branch  

#### Parameters

    repository
The repository's URL. For example `git@github.com/olliejones/git-webhook-responder`

    action
The action triggering the webhook.  `push`, `merge`, etc.

    branch
The branch of the repository involved in the action. 

#### Notes

The shell's standard input fetches the payload of the webhook request. That's usually a JSON object with
details of the action that triggered the webhook. It's not always necessary to handle that data. But, if you
do handle it, [Stephen Dolan's](http://stedolan.net/about/) [jq command line utility](https://stedolan.github.io/jq/) can help.

The shell is spawned under the same user that runs this program. That user must, of course, have access 
to system resources necessary to handle the request. If it's going to fetch the contents of a git
repository, it also must have the appropriate `ssh` credentials.  Duh.

#### Example

````
#!/bin/sh
TODO
if $1 == 'git@github.com/olliejones/git-webhook-responder' & $2 == 'push' & $3 == 'production' then
   pm2 deploy program staging
else
   logger on-webhook "Mismatched parameters $1 $2 $3"
fi
````

## Security Considerations

Yes. Be careful.  We try to slow down cybercriminals by validating webhooks, 
but they are smarter than we are. 

Use https for this service.

Make your `on-webhook` program readonly. Make it do only the minimum needed. Don't let it write any files
or run any other programs or scripts you might not trust.

Make your webhook secrets hard to guess, and change them up once in a while.

Set the whitelists if you can.

Check your `/var/log/auth` log file once in a while looking for validation failures.