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
    $params = $request->post(array('user', 'message', 'view_state'), array('discussion_id'));
    $user = $params->user;
    $message = htmlspecialchars($params->message);
    $discussion_id = $params->discussion_id;
    $view_state = $params->view_state;

    $inserted_id = $db->insert_message($user, $message, $view_state, $discussion_id);
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

$tweet_ids = array();
$tweets = array();
if ($discussion_id) {
    $result = $db->get_discussion_messages($discussion_id);

    $perf->start('processing');

    foreach ($result as $row) {
        $rendered[] = discussion_message($row);
        if(preg_match_all("/T(\d{10,20})\[/", $row['message'], $matches, PREG_SET_ORDER) > 1) {
            foreach($matches as $m) {
                $tweet_ids[] = $m[1];

                $tweet_result = $db->get_tweet($m[1]);
                foreach($tweet_result as $row) {
                    $row['created_at'] = $row['created_at'] * 1000;
                    $tweets[] = $row;
                }
            }
        }
    }


    $perf->stop('processing');
}



$combined = array();
$combined['rendered'] = join("", $rendered);
$combined['tweets'] = $tweets;

$request->response($combined);
