<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

if ($request->is_env('development')) {
    $perf = $request->performance();
    $db->record_timing($perf);
}

$user_data = $request->user_data();
$db->log_action('load', $user_data);

//Load in elements
include_once 'templates/nav_bar.inc.php';
include_once 'templates/query_box.inc.php';
include_once 'templates/timeline_controls.inc.php';
include_once 'templates/details_tabs.inc.php';
include_once 'templates/help_icon.inc.php';
include_once 'templates/discussion_ui.inc.php';
include_once 'templates/page.inc.php';
