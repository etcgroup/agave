<?php
/**
 * messages.php retrieves and renders discussion messages for a specific discussion.
 *
 * POSTing to messages.php will add a new message to the database, and render
 * all of the messages.
 */


include_once 'util/data.php';
include_once 'util/request.php';
include_once '../elements/message.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

/**
 * Requests to /messages.php should provide a discussion id.
 *
 * Optionally, fields for a new message can be provided.
 */
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $params = $request->post(array('user', 'message'), array('discussion_id'));
    $user = $params->user;
    $message = htmlspecialchars($params->message);
    $discussion_id = $params->discussion_id;

    $inserted_id = $db->insert_message($user, $message, $discussion_id);
    if (!$inserted_id) {
        echo 'Failure.';
        return -1;
    }

    if (!$discussion_id) {
        $message = $db->get_message($inserted_id);
        $discussion_id = $message['discussion_id'];
    }
} else {
    $params = $request->get(array('discussion_id'));
    $discussion_id = $params->discussion_id;
}

$rendered = array();

if ($discussion_id) {

    $result = $db->get_discussion_messages($discussion_id);

    $perf->start('processing');

    foreach ($result as $row) {
        $rendered[] = discussion_message($row);
    }


    $perf->stop('processing');
}

$request->response(join("", $rendered));