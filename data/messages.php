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
$params = $request->get(array('discussion_id'));
$discussion_id = $params->discussion_id;

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $post = $request->post(array('user', 'message'));
    $user = $post->user;
    $message = htmlspecialchars($post->message);

    if (!$db->insert_message($user, $message, $discussion_id)) {
        echo 'Failure.';
        return -1;
    }
}

$result = $db->get_discussion_messages($discussion_id);

$perf->start('processing');

$rendered = array();
while ($row = $result->fetch_assoc()) {
    $rendered[] = discussion_message($row);
}
$result->free();

$perf->stop('processing');

$request->response(join("", $rendered));