<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

/**
 * annotations.inc.php retrieves and renders annotations.
 *
 * POSTing to annotations.inc.php will add a new annotation to the database, and return
 * all of the annotations.
 */

//Get the performance tracker
$perf = $request->performance();
$db->record_timing($perf);

$inserted_id = FALSE;

$user_data = $request->user_data();
if ($user_data) {
    $user_id = $user_data->id;
} else {
    $user_id = NULL;
}

/**
 * Requests to annotations.inc.php should provide a discussion id.
 *
 * Optionally, fields for a new message can be provided.
 */
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if ($user_id) {
        $params = $request->post(array('time', 'label'), array('id'));

        $label = htmlspecialchars($params->label);
        $time = floor($params->time / 1000); //converting from ms to s
        $time = new DateTime("@$time"); // converting to a DateTime

        if ($params->id === NULL) {

            $inserted_id = $db->insert_annotation($user_id, $label, $time);
            if (!$inserted_id) {
                $db->log_action('annotations error', $request->user_data());

                echo 'Failure.';
                return -1;
            }

            $db->log_action('create annotation', $request->user_data(), $label, $inserted_id);
        } else {
            //The label is the only thing that can change
            $inserted_id = $db->update_annotation($params->id, $user_id, $label);
            $db->log_action('update annotation', $user_data, $label, $params->id);
        }
    } else {
        echo 'You are not signed in!';
        die();
    }
}

$annotations = array();

$result = $db->get_annotations($user_id);

$perf->start('processing');

foreach($result as $row) {
    $row['created'] *= 1000; //convert to ms
    $row['time'] *= 1000;

    //Fill in possibly null user data
    if ($row['name'] === NULL) {
        $row['name'] = $row['user'];
    }

    if ($row['screen_name'] === NULL) {
        $row['screen_name'] = $row['user'];
    }

    //Mark the annotation that was new, if there was one
    if ($inserted_id && $row['id'] === $inserted_id) {
        $row['new'] = TRUE;
    }

    $annotations[] = $row;
}


$perf->stop('processing');

$request->response($annotations);