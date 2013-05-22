<?php
/**
 * discussions.php retrieves and renders the discussions.
 */


include_once 'util/data.php';
include_once 'util/request.php';
include_once '../elements/discussion.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

/**
 * Requests to /discussions.php have no parameters.
 */

$result = $db->get_discussions();

$db->log_action('discussions', $request->user_data());

$perf->start('processing');

$rendered = array();
foreach ($result as $row) {
    $rendered[] = discussion($row);
}


$perf->stop('processing');

$request->response(join("", $rendered));