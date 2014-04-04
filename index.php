<?php
/**
 * Serves the primary visualization page.
 */

include_once 'util/router.inc.php';
include_once 'util/request.inc.php';
include_once 'util/config.inc.php';
include_once 'util/queries.inc.php';

$config = new Config('app.ini');
$request = new Request($config);
$router = new Router($config);

//If in secure mode, ensure https
if ($config->get('secure')) {
    if (!$router->is_https()) {//$url = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $request->redirect($router->site_url($router->current_url(), 'https'));
    }
}

list($route, $arguments) = $router->get_route();
if (isset($arguments['corpus_id'])) {
    $db = new Queries($config, $arguments['corpus_id']);
} else {
    $db = new Queries($config);
}

$request->start_session($db);

include $route;
