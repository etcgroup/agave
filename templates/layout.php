<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Twitter Vis!</title>
        <meta name="description" content="A neat twitter visualization">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="css/main.css">
    </head>
    <body>
        <?php echo nav_bar(); ?>
        <div id="content" class="wrapper">
            <div id="explorer">
                <div id="queries">
                    <?php echo query_box('Series 1') ?>
                    <?php echo query_box('Series 2') ?>
                </div>
                <div id="tweet-timeline">
                    focus
                </div>
                <div id="tweet-overview">
                    context
                </div>

                <div id="explorer-details" class="clearfix">
                    <div id="tweet-list">
                        tweets
                    </div>
                    <div id="details-wrapper" class="wrapper">
                        <div id="details">
                            details
                        </div>
                    </div>
                </div>
            </div>
            <div id="collaborator-wrapper" class="wrapper">
                <div id="collaborator">
                    discussion
                </div>
            </div>
        </div>

        <script>
            window.require = {
                baseUrl: 'js',
                paths: {
                    'underscore': 'lib/underscore-amd',
                    'backbone': 'lib/backbone-amd',
                    'jquery' : 'lib/jquery',
                    'moment': 'lib/moment'
                },
                shim: {
                    'lib/d3': {
                        exports: 'd3'
                    },
                    'lib/bootstrap': ['jquery']
                }
            };
        </script>

        <script src="js/lib/require.js" data-main="app"></script>
    </body>
</html>
