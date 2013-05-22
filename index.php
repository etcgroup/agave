<?php

global $static_root;
$config = parse_ini_file('app.ini');

if (isset($config['environment']) && $config['environment'] == 'development') {
    $static_root = '';
} else {
    $static_root = 'dist/';
}

function asset($name) {
    global $static_root;
    return $static_root . $name;
}

include_once 'data/util/request.php';

$request = new Request();
$db = $request->db('data/db.ini');
$db->log_action('load', $request->user_data());

//Load in elements
include_once 'elements/nav_bar.php';
include_once 'elements/query_box.php';
include_once 'elements/timeline_controls.php';
include_once 'elements/details_tabs.php';
include_once 'elements/help_icon.php';

include 'templates/layout.php';