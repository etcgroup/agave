<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Agave: <?php echo $request->corpus_title(); ?></title>
    <meta name="description" content="A neat twitter visualization">
    <meta name="viewport" content="width=device-width">

    <link rel="icon"
          type="image/png"
          href="<?php $request->stat('css/img/logo-only.png'); ?>">
    <link rel="stylesheet" href="<?php $request->stat('css/main.css'); ?>">

</head>
<body>
<?php echo nav_bar($request); ?>
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
            <div class="collaborator padding-left show-left hide fade in">
                <div class="sliding-panel col">
                    <?php echo sign_in_box($request->auth_mode()) ?>
                    <?php echo discussion_box() ?>
                    <?php echo discussion_view() ?>
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
    <script src="<?php $request->stat('js/lib/require.js'); ?>"></script>
    <script src="<?php $request->stat('js/require-config.js'); ?>"></script>
    <script type="text/javascript">
        //Have to make sure that we override the common config's base url with the real one
        require.config({
            'baseUrl': "<?php $request->stat('js'); ?>"
        });
    </script>
<?php } else { ?>
    <!-- Loading production resources -->
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="<?php $request->stat('js/main.js'); ?>"></script>
    <script type="text/javascript">
        //A shim since jQuery didn't know about define when it initialized
        define('jquery', function() {
            return jQuery;
        });
    </script>
<?php } ?>

<script type="text/javascript">
    <?php
    $stats = $request->corpus_properties();

    $start_time = $stats['start_time']->getTimestamp();
    $end_time = $stats['end_time']->getTimestamp();
    $tz_offset_millis = $stats['timezone_offset'] * 1000;
    ?>

    window.agave_config = {
        defaults: {
            //Default time interval (UTC seconds) for the superbowl data set
            from: <?php echo $start_time ?>,
            to: <?php echo $end_time ?>,
            mode: 'simple',
            focus: null,
            annotations: true
        },
        //Time interval (UTC seconds) for the superbowl data set
        overview_from: <?php echo $start_time ?>,
        overview_to: <?php echo $end_time ?>,

        //The overview bin size in seconds
        bin_size: 5,

        //Display times in this timezone
        utc_offset_millis: <?php echo $tz_offset_millis ?>,

        //Time between annotation polls in millis
        annotation_poll_interval: 10000
    };

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