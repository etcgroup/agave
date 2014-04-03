<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

/**
 * discussions.inc.php retrieves and renders the discussions.
 */


include_once 'util/data.inc.php';
include_once 'templates/discussion.inc.php';

$perf = $request->performance();
$db->record_timing($perf);

/**
 * Requests to /discussions.inc.php have no parameters.
 */
$params = $request->get(array(), array('search'));
$search = $params->search;
if (strlen($search) == 0) {
    $search = NULL;
}

$user_data = $request->user_data();
if ($user_data) {
    $user_id = $user_data->id;
} else {
    $user_id = NULL;
}

$result = $db->get_discussions($search, $user_id);

$db->log_action('discussions', $request->user_data());

$perf->start('processing');

$rendered = array();
foreach ($result as $row) {
    $rendered[] = discussion($row);
}


$perf->stop('processing');

$request->response(join("", $rendered));