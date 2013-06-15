<?php
/**
 * The hilariously named auth.php just logs that the user logged in or out.
 */


include_once '../util/data.php';
include_once '../util/request.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

//Get the current user data
$user_data = $request->user_data();

if ($user_data) {
    $action = 'sign in';
} else {
    $action = 'sign out';

    //Get the old user data
    $user_data = $request->get(array('name'));
}

$db->log_action($action, $user_data);

$request->response('Noted.');