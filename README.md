twittervis
==========

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
