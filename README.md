# git Webhook Responder

github and gitlab offer *webhooks*, outbound requests to web services of your choice. When somebody does something
to your repository, like `push` changes up, the server makes the webhook request.

## Uses

### Continuous Deployment

This program lets you set up your machine to receive webhook requests and do something useful.  For example, when a webhook
announces a `push` to your `staging` branch, it can fetch, build, and deploy that branch.

### Logging changes

Any logging operation you can do with a shell script, you can do automatically whenever your repo gets a push

## Operation

This is a node / express web application. By default it listens on port 3100 for incoming webhooks.  

### Behind nginx

A good way to run this is to put it behind `nginx`.  Here's a snippet from `nginx.conf` for that. 

```
       upstream webhook {
            server 127.0.0.1:3100;
        }
        ...
        server {
            ...
            listen 443 default_server;
            server_name $hostname;
            ssl on;
            ssl_certificate  /path/to/cert;
            ssl_certificate_key /path/to/key;
            ssl_session_cache shared:SSL:10m;

            location /webhook {
                proxy_pass http://webhook;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_set_header        X-Real-IP       $remote_addr;
                proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
            }
            ...
        }

```

Notice that this service uses the `/webhook` path. It can coexist behind `nginx` with other servers using other paths. 

### Validation

When a webhook arrives this program validates and authenticates it.

* Is it well-formed?
* Is the webhook secret as expected?

The program uses `syslog` to record the results of webhook validation.  On failure it  makes a 
 syslog entry and returns 404 to the originator.
 
### Configuration

This program is configured using [config.json](https://www.npmjs.com/package/config.json) so you can use the features
of that module to organize your configuration. The `config` directory contains a default configuration file `default.properties`.  Look at that file for possibilities to 
configure the server.

It also contains a file `sample.json`. Follow that file's example to set up the sources of the webhooks you expect.
You need to copy this file and put it in local-production.json or whatever config location is suitable. 

Explanation of `sample.json`:

```
{
  "gitlab": {                         One or more stanzas of configuration for gitlab.com repos.
    "1": {                            You can give each stanza any unique name you want.
      "repopath": "joeuser/project",  This is the repo path  namespace/repo
      "ref": "refs/heads/master",     This is the fully qualified ref for the branch of interest
      "secret": "SecretToken"         This is the secret used to validate the request
    },
    "2": {
      "repopath": "joeuser/bigdeal",
      "ref": "refs/heads/production",
      "secret": "DontTellMom",
      "on_webhook": "myCommand.sh"    If this is provided, it is the name of the command to run
    }
  },
  "github": {                         One or more stanzas of configuration for github.com repos.
    "1": {
      "repopath": "JoeUser/open-source-magnum-opus",
      "ref": "refs/heads/master",
      "secret": "deadbeef01234567890abcdefbeefdead"
    }
  }
}
```

### Action

The program then spawns a shell and runs the command `on-webhook` (or the command you specified in your configuration stanza
 for the particular repo.) You can write that shell script or 
program to do what you want it to do.  A good way to deploy it on your server is to put in `~/bin/` and make it executable.

`on-webhook` is invoked with parameters describing the webhook. When you write it, **you must check the parameters** 
to make sure it does what you want done.


#### Name

   `on-webhook`   Run an action when receiving a webhook

#### Synopsis

    on-webhook repository repopath reponame action branch  

#### Parameters

    repository
The repository's URL. For example `git@github.com/olliejones/git-webhook-responder`

    repopath
The repository's name, including namespace. For example `olliejones/git-webhook-responder`

    reponame
The repository's leaf name. For example `git-webhook-responder`

    action
The action triggering the webhook.  `push`, `merge`, etc.

    branch
The branch of the repository involved in the action.  Branch names appearing here 
are [fully qualified git references](https://git-scm.com/book/en/v2/Git-Internals-Git-References) looking like this:
 `refs/heads/branchname` strings. `master` branches show up like this: `refs/heads/master`.


#### Notes

The shell's standard input contains the payload of the webhook request. That's ordinarily a stringified JSON object with
details of the action that triggered the webhook. It's not always necessary to handle that data. But, if you
do handle it, [Stephen Dolan's](http://stedolan.net/about/) [jq command line utility](https://stedolan.github.io/jq/) can help.

The payload doesn't have an industry-standard format: it's different on github and gitlab, for example.

The shell is spawned under the same user that runs this program. That user must, of course, have access 
to system resources necessary to handle the request. If it's going to fetch the contents of a git
repository, it also must have any required `ssh` credentials. 

#### Example

```
#!/bin/sh

# Synopsis
#    on-webhook repository repopath reponame action branch

repository=$1
repopath=$2
reponame=$3
action=$4
branch=$5

if [ "$repopath" == "joeuser/project" ] &&  [ "$action" == "push" ] && [ "$branch" == "refs/heads/master" ]; then
    logger "$0 deploying $repository"
    cd ~/$reponame
    pm2 deploy development
else
    logger "$0 mismatch! not deploying $repository"
fi
```

## Security Considerations

Yes. Be careful.  We try to slow down cybercriminals by validating webhooks, 
but they are smarter than we are. 

The git hosting services change IP addresses a lot, so it's not feasible to use address whitelists to validate
sources of these webhooks.

Use https for this service.

Make your `on-webhook` program readonly. Make it do only the minimum needed. Don't let it write any files
or run any other programs or scripts you might not trust.

Make your webhook secrets hard to guess, and change them up once in a while.

Set the whitelists if you can.

Check your `/var/log/auth` log file once in a while looking for validation failures.

## Issue reports and pull requests

Yes, please. You know the drill.  Be nice.
