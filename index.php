<?php
/**
 * Serves the primary visualization page.
 */

include_once 'util/request.inc.php';

$request = new Request('app.ini');
$db = $request->db();

//If in secure mode, ensure https
if (isset($request->config['secure']) && $request->config['secure']) {
    if (!isset($_SERVER['HTTPS'] ) || $_SERVER['HTTPS'] === 'off') {
        $url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        header('Location: ' . $url);
        die();
    }
}

$user_data = $request->user_data();
$db->log_action('load', $user_data);

//Load in elements
include_once 'templates/nav_bar.inc.php';
include_once 'templates/query_box.inc.php';
include_once 'templates/timeline_controls.inc.php';
include_once 'templates/details_tabs.inc.php';
include_once 'templates/help_icon.inc.php';
include_once 'templates/discussion_ui.inc.php';
include_once 'templates/page.inc.php';
?>
