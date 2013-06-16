<?php

include_once 'util/request.inc.php';

$request = new Request('app.ini');
$db = $request->db();

if (isset($request->config['secure']) && $request->config['secure']) {
    if (!isset($_SERVER['HTTPS'] ) || $_SERVER['HTTPS'] === 'off') {
        $url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        header('Location: ' . $url);
        die();
    }
}

$user_data = $request->user_data();
$db->log_action('load', $user_data);

//Load in elements
include_once 'elements/nav_bar.inc.php';
include_once 'elements/query_box.inc.php';
include_once 'elements/timeline_controls.inc.php';
include_once 'elements/details_tabs.inc.php';
include_once 'elements/help_icon.inc.php';

?>
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
                            <div class="message">Discuss this data set!</div>
                        </div>
                        <div class="form">
                            <button type="button" class="user-submit btn btn-large btn-primary">
                                <i class="twitter-icon-light"></i>
                                Sign in with Twitter
                            </button>
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
<?php
$flash = $request->flash();
if ($flash) {
?>
    <div class="flash alert alert-<?php echo $flash['type']?>">
        <button type="button" class="close" data-dismiss="alert">&times;</button>
        <?php echo $flash['message']?>
    </div>
<?php } ?>
<?php if ($request->is_env('development')) { ?>
    <!-- Loading development resources -->
    <script src="js/lib/require.js"></script>
    <script src="js/require-config.js"></script>
    <script type="text/javascript">
        //Have to make sure that we override the common config's base url with the real one
        require.config({
            'baseUrl': "js"
        });
    </script>
<?php } else { ?>
    <!-- Loading production resources -->
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="js/main.js"></script>
    <script type="text/javascript">
        //A shim since jQuery didn't know about define when it initialized
        define('jquery', function() {
            return jQuery;
        });
    </script>
<?php } ?>

<script type="text/javascript">
    <?php if ($user_data) { ?>
    window.user_data = <?php echo json_encode($user_data); ?>;
    <?php } ?>

    //Start the app
    require(["main"]);

<?php if ($request->ga_id()) { ?>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', '<?php echo $request->ga_id() ?>', '<?php echo $request->ga_domain() ?>');
    ga('send', 'pageview');
<?php } ?>
</script>
</body>
</html>