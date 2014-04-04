<?php

/**
 * @param $request Request
 * @return string
 */
function vis_content($request)
{
    include_once 'templates/query_box.inc.php';
    include_once 'templates/timeline_controls.inc.php';
    include_once 'templates/details_tabs.inc.php';
    include_once 'templates/help_icon.inc.php';
    include_once 'templates/discussion_ui.inc.php';

    ob_start();
    ?>
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
                        <div class="time-selector popover-me" data-animation="true" data-trigger="hover"
                             title="Time Selector"
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
        <?php if ($request->is_env('development')) {
            include 'templates/debugger.inc.php';
        } ?>
    </div>
    <?php
    return ob_get_clean();
}

/**
 * @param $router Router
 * @param $user_data array
 * @param $corpus_id string
 * @param $corpus_stats array
 * @return string
 */
function vis_app_javascript($router, $user_data, $corpus_id, $corpus_stats) {

    ob_start();
    ?>
    <script type="text/javascript">
        <?php
        $start_time = $corpus_stats['start_time']->getTimestamp();
        $end_time = $corpus_stats['end_time']->getTimestamp();
        $tz_offset_millis = $corpus_stats['timezone_offset'] * 1000;
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
            annotation_poll_interval: 10000,

            urls: <?php echo json_encode($router->route_urls($corpus_id)); ?>
        };

        <?php if ($user_data) { ?>
        window.user_data = <?php echo json_encode($user_data); ?>;
        <?php } ?>

        //Start the app
        require(["main"]);
    </script>
    <?php

    return ob_get_clean();
}