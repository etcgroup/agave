<?php
/**
 * annotations.php retrieves and renders annotations.
 *
 * POSTing to annotations.php will add a new annotation to the database, and return
 * all of the annotations.
 */


include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

$inserted_id = FALSE;

/**
 * Requests to /messages.php should provide a discussion id.
 *
 * Optionally, fields for a new message can be provided.
 */
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $params = $request->post(array('user', 'time', 'label'));

    $user = $params->user;
    $label = htmlspecialchars($params->label);
    $time = floor($params->time / 1000); //converting from ms to s
    $time = new DateTime("@$time"); // converting to a DateTime

    $inserted_id = $db->insert_annotation($user, $label, $time);
    if (!$inserted_id) {
        echo 'Failure.';
        return -1;
    }
}

$annotations = array();

$result = $db->get_annotations();

$perf->start('processing');

foreach($result as $row) {
    $row['created'] *= 1000; //convert to ms
    $row['time'] *= 1000;

    //Mark the annotation that was new, if there was one
    if ($inserted_id && $row['id'] === $inserted_id) {
        $row['new'] = TRUE;
    }

    $annotations[] = $row;
}


$perf->stop('processing');

$request->response($annotations);