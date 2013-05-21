<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Twitter Vis!</title>
        <meta name="description" content="A neat twitter visualization">
        <meta name="viewport" content="width=device-width">
        <link rel="icon"
              type="image/png"
              href="css/img/logo.png">
        <link rel="stylesheet" href="css/main.css">
    </head>
    <body>
        <?php echo nav_bar(); ?>
        <div class="content row">
            <div class="padding-all">
                <div class="explorer col">
                    <div class="timeline-controls row">
                        <?php echo timeline_controls(); ?>
                    </div>
                    <div class="tweet-timeline-panel row">
                        <div class="tweet-timeline padding-bottom">
                        </div>
                    </div>
                    <div class="tweet-overview-panel row">
                        <div class="tweet-overview padding-bottom">
                            <div class="time-selector popover-me" data-animation="true" data-trigger="hover" title="Time Selector"
                                 data-html="true"
                                 data-content="This timeline shows an overview of the entire data set. <u>Click and drag</u> on it to focus
                                 on an interval in the timeline above.">
                                <label class="selector-label">Time Selector</label>
                                <i class="icon-white icon-question-sign"></i>
                            </div>
                        </div>
                    </div>

                    <div class="details row">
                        <div class="details-left col" data-query-index='0'>
                            <div class="padding-right-half">
                                <?php echo query_box('Series 1') ?>
                                <?php echo details_tabs(1); ?>
                            </div>
                        </div>
                        <div class="details-right col" data-query-index='1'>
                            <div class="padding-left-half">
                                <?php echo query_box('Series 2') ?>
                                <?php echo details_tabs(2); ?>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="collaborator-wrapper col">
                    <div class="collaborator padding-left show-left hide">
                        <div class="sliding-panel col">
                            <div class="user-box col">
                                <div class="header">
                                    <div class="title">Welcome!</div>
                                    <div class="message">Sign in to discuss this data set</div>
                                </div>
                                <div class="form">
                                    <input type="text" placeholder="Enter your user name"/><br/>
                                    <button type="button" class="user-submit btn btn-large btn-primary">Sign in</button>
                                </div>
                            </div>
                            <div class="discussions col">
                                <div class="header row">
                                    <div class="title">Discussions</div>
                                    <button type="button" class="btn btn-primary new-button tooltip-me" data-placement="bottom"
                                        title="Create a new discussion">
                                        <i class="icon-white icon-plus-sign"></i>
                                        New</button>
                                    <div>Join an existing discussion</div>
                                </div>
                                <ul class="discussion-list content-panel item-list row scroll-y"></ul>
                            </div>
                            <div class="discussion-view col">
                                <div class="comment-box row">
                                    <button type="button" class="btn back-button tooltip-me" data-placement="right"
                                        title="Back to discussion list">
                                        <i class="icon-white icon-arrow-left"></i>
                                        Back
                                    </button>
                                    <div class="discussion-title"></div>
                                    <textarea></textarea>
                                    <button type="button"
                                            class="send-button btn btn-primary tooltip-me" data-placement="bottom"
                                        title="Post your comment">
                                        <i class="icon-white icon-comment"></i> Post
                                    </button>
                                    <button type="button" data-toggle="button"
                                            class="reference-button btn tooltip-me" data-placement="right"
                                            title="Reference a tweet or annotation">
                                        <i class="icon-white icon-map-marker"></i> Reference
                                    </button>
                                </div>
                                <ul class="comments item-list content-panel row scroll-y"></ul>
                            </div>
                        </div>
                    </div>
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
                    'moment': 'lib/moment',
                    'spin': 'lib/spin'
                },
                shim: {
                    'lib/d3': {
                        exports: 'd3'
                    },
                    'lib/bootstrap': ['jquery'],
                    'lib/Uri': {
                        exports: 'Uri'
                    }
                }
            };
        </script>

        <script src="js/lib/require.js" data-main="main"></script>
    </body>
</html>