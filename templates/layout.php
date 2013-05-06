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
                </div>
                <div id="tweet-overview">
                </div>

                <div id="explorer-details" class="clearfix">
                    <div class="tab-group">
                        <ul class="nav nav-tabs">
                            <li class="active"><a data-target="#tweet-list-1" data-toggle="tab">Tweets</a></li>
                            <li><a data-target="#users-list-1" data-toggle="tab">Users</a></li>
                            <li><a data-target="#keywords-list-1" data-toggle="tab">Keywords</a></li>
                        </ul>
                         
                        <div class="tab-content">
                          <div class="tab-pane active tweet-list" id="tweet-list-1"></div>
                          <div class="tab-pane users-list" id="users-list-1">...</div>
                          <div class="tab-pane keywords-list" id="keywords-list-1">...</div>
                        </div>
                    </div>
                    <div id="tab-group-wrapper" class="wrapper">
                        <div class="tab-group">
                            <ul class="nav nav-tabs">
                                <li class="active"><a data-target="#retweet-list-2" data-toggle="tab">Tweets</a></li>
                                <li><a data-target="#users-list-2" data-toggle="tab">Users</a></li>
                                <li><a data-target="#keywords-list-2" data-toggle="tab">Keywords</a></li>
                            </ul>

                            <div class="tab-content">
                                <div class="tab-pane active tweet-list" id="tweet-list-2"></div>
                                <div class="tab-pane users-list" id="users-list-2">...</div>
                                <div class="tab-pane keywords-list" id="keywords-list-2">...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="collaborator-wrapper" class="wrapper">
                <div id="collaborator">
                    <div class="discussions sliding in">
                        <div class="header clearfix">
                            <div class="title">Discussions</div>
                            <div class="btn new-button">New Discussion</div>
                        </div>
                        <p>Join an existing discussion</p>
                        <div class="discussion-list"></div>
                    </div>
                    <div class="discussion-view sliding">
                        <div class="header clearfix">
                            <div class="btn back-button"><i class="icon-arrow-left"></i> Back to discussion list</div>
                        </div>
                        <div class="user-box form-inline collapse in">
                            <input type="text" placeholder="Choose a user name"/>
                            <button type="button" class="user-submit btn btn-primary">Sign in</button>
                        </div>
                        <div class="comment-box clearfix collapse">
                            <textarea></textarea>
                            <span class="user-display"></span>
                            <button type="button" class="send-button btn btn-primary">Post message</button>
                        </div>
                        <div class="comments"></div>
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
                    'moment': 'lib/moment'
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
