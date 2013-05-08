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
        <div class="content row">
            <div class="padding-all">
                <div class="explorer col">
                    <div class="queries row">
                        <?php echo query_box('Series 1') ?>
                        <?php echo query_box('Series 2') ?>
                    </div>
                    <div class="tweet-timeline-panel row">
                        <div class="tweet-timeline padding-bottom">
                        </div>
                    </div>
                    <div class="tweet-overview-panel row">
                        <div class="tweet-overview padding-bottom">
                        </div>
                    </div>

                    <div class="details row">
                        <div class="tab-group details-left col">
                            <div class="padding-right-half">
                                <ul class="nav nav-tabs row">
                                    <li class="active"><a data-target="#tweet-list-1" data-toggle="tab">Tweets</a></li>
                                    <li><a data-target="#users-list-1" data-toggle="tab">Users</a></li>
                                    <li><a data-target="#keywords-list-1" data-toggle="tab">Keywords</a></li>
                                </ul>

                                <div class="tab-content row scroll-y">
                                  <div class="tab-pane active tweet-list" id="tweet-list-1"></div>
                                  <div class="tab-pane users-list" id="users-list-1">...</div>
                                  <div class="tab-pane keywords-list" id="keywords-list-1">...</div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-group details-right col">
                            <div class="padding-left-half">
                                <ul class="nav nav-tabs row">
                                    <li class="active"><a data-target="#tweet-list-2" data-toggle="tab">Tweets</a></li>
                                    <li><a data-target="#users-list-2" data-toggle="tab">Users</a></li>
                                    <li><a data-target="#keywords-list-2" data-toggle="tab">Keywords</a></li>
                                </ul>

                                <div class="tab-content row scroll-y">
                                    <div class="tab-pane active tweet-list" id="tweet-list-2"></div>
                                    <div class="tab-pane users-list" id="users-list-2">...</div>
                                    <div class="tab-pane keywords-list" id="keywords-list-2">...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="collaborator-wrapper col">
                    <div class="collaborator padding-left show-left">
                        <div class="sliding-panel col">
                            <div class="user-box form-inline col">
                                <input type="text" placeholder="Choose a user name"/>
                                <button type="button" class="user-submit btn btn-primary">Sign in</button>
                            </div>
                            <div class="discussions col">
                                <div class="header row">
                                    <div class="title">Discussions</div>
                                    <div class="btn new-button">New Discussion</div>
                                    <p>Join an existing discussion:</p>
                                </div>
                                <div class="discussion-list row scroll-y"></div>
                            </div>
                            <div class="discussion-view col">
                                <div class="comment-box row">
                                    <div class="btn back-button"><i class="icon-arrow-left"></i> Back to discussion list</div>
                                    <br/>
                                    <textarea></textarea>
                                    <span class="user-display"></span>
                                    <button type="button" class="send-button btn btn-primary">Post message</button>
                                </div>
                                <div class="comments row scroll-y"></div>
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
