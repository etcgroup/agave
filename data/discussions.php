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

$perf->start('processing');

$rendered = array();
while ($row = $result->fetch_assoc()) {
    $rendered[] = discussion($row);
}
$result->free();

$perf->stop('processing');

$request->response(join("", $rendered));