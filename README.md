Agave
==========



Development Setup
-----------------

A Vagrantfile is provided for getting a development environment
set up in an Ubuntu VM. Before beginning:

1. Install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) for your platform.
2. Install [Vagrant](http://www.vagrantup.com/downloads).

Clone the git repository to your machine.
Then, run the following command inside the repository directory:

```bash
$ vagrant up
```

This will start and provision the VM.

You will also want to add the line below to your system's "hosts" file.
On Windows, this is located at "C:\Windows\System32\drivers\etc\hosts".
On Linux and Mac OSX, it is at "/etc/hosts".

```
192.168.56.101 agave.dev www.agave.dev
```

Once the VM has been provisioned successfully, you can
visit `http://agave.dev/` to access your development copy of Agave.

There will be a phpMyAdmin instance available at
at `http://localhost:8080/phpmyadmin/`,
and xdebug will be available at `localhost:9090`.

### Database Setup

Agave uses two databases, one for "application data" like
Agave users and discussion posts, and one for "corpus data"
like tweets. The idea is that you might have such a large
volume of tweets that you want to host those somewhere else.

There are two SQL files, schema.sql and corpus_schema.sql.
If you followed the Vagrant provisioning step, these will
already have been loaded into the `agave` and `agave_corpus`
databases, along with some initial data (no tweets though).

The database user is `agave` and the password is `agave`
(the root user is similar).


### Streaming Tweets

You can stream tweets into your database
using [twitter-monitor](https://github.com/michaelbrooks/twitter-monitor).

You will first need to define a file `track.txt` containing
one filter term per line.
In `app.ini` make sure to fill out the twitter section
with your api key and access token.
Then run this command to begin streaming:

```bash
$ stream_tweets --ini-file app.ini | php setup/import_tweets.php
```


### Building static resources

There are CSS and LESS files contained in the css folder. Do not edit the CSS file when there is 
a corresponding LESS file available. To build the CSS files, you need to install the 
LESS compiler. The command below also installs `lesswatch`, a tool that will
allow automatically compiling the CSS files when the files change:

```bash
$ npm install --global less lesswatch
```

To start lesswatch:

```bash
$ lesswatch css css
```
