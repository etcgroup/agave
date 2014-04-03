<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();
/**
 * messages.inc.php retrieves and renders discussion messages for a specific discussion.
 *
 * POSTing to messages.inc.php will add a new message to the database, and render
 * all of the messages.
 */

include_once 'templates/message.inc.php';

$perf = $request->performance();
$db->record_timing($perf);

$user_data = $request->user_data();
if ($user_data) {
    $user_id = $user_data->id;
} else {
    $user_id = NULL;
}

/**
 * Requests to /messages.inc.php should provide a discussion id.
 *
 * Optionally, fields for a new message can be provided.
 */
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if ($user_id) {
        $params = $request->post(array('message', 'view_state'), array('discussion_id'));
        $message = htmlspecialchars($params->message);
        $discussion_id = $params->discussion_id;
        $view_state = $params->view_state;

        $inserted_id = $db->insert_message($user_id, $message, $view_state, $discussion_id);
        if (!$inserted_id) {
            $db->log_action('messages error', $request->user_data());
            echo 'Failure.';
            return -1;
        }

        if (!$discussion_id) {
            $message = $db->get_message($inserted_id);
            $discussion_id = $message['discussion_id'];

            $db->log_action('create discussion', $request->user_data(), NULL, $discussion_id);
        }

        $db->log_action('create message', $request->user_data(), NULL, $inserted_id);
    } else {
        echo 'You are not signed in!';
        die();
    }
} else {
    $params = $request->get(array('discussion_id'), array('first_load'));
    $discussion_id = $params->discussion_id;

    if ($params->first_load) {
        $db->log_action('messages', $request->user_data(), NULL, $discussion_id);
    }
}

$rendered = array();

$tweets = array();
if ($discussion_id) {
    $result = $db->get_discussion_messages($discussion_id, $user_id);

    $perf->start('processing');

    foreach ($result as $row) {
        $rendered[] = discussion_message($row);
        if(preg_match_all("/T(\d{10,20})\[/", $row['message'], $matches, PREG_SET_ORDER) > 0) {
            foreach($matches as $m) {
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
