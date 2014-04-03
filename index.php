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

//If they didn't provide a corpus, redirect to the default corpus.
//TODO: replace this with some kind of corpus list page or something.
if ($router->current_url() === '') {
    $corpus_id = $config->get('db')['corpus'];
    $request->redirect($router->site_url($corpus_id));
}

list($route, $arguments) = $router->get_route();
if (isset($arguments['corpus_id'])) {
    $corpus_id = $arguments['corpus_id'];
} else {
    $corpus_id = $config->get('db')['corpus'];
}

$db = new Queries($config, $corpus_id);
$request->start_session($db);

include $route;
