<?php
if (!isset($error_code)) {
    $error_code = 500;
}

$default_messages = array(
    404 => 'The page could not be found.',
    500 => 'The server is having a bad problem.'
);

if (!isset($error_message)) {
    $error_message = $default_messages[$error_code];
}

$status_messages = array(
    403 => 'Forbidden',
    404 => 'Not Found',
    500 => 'Internal Server Error'
);

header("HTTP/1.0 $error_code ${status_messages[$error_code]}");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo "$error_code ${status_messages[$error_code]}"; ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet"
          href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.no-icons.min.css">

    <style type="text/css">
        body {
            padding-top: 20px;
            padding-bottom: 40px;
        }

        /* Custom container */
        .container-narrow {
            margin: 0 auto;
            max-width: 700px;
        }

        .container-narrow > hr {
            margin: 30px 0;
        }

        /* Main marketing message and sign up button */
        .jumbotron {
            margin: 60px 0;
            text-align: center;
        }

        .jumbotron h1 {
            font-size: 60px;
            line-height: 1;
        }
    </style>
</head>
<body>
<div class="container-narrow">

    <div class="jumbotron">
        <h1><?php echo "$error_code ${status_messages[$error_code]}"; ?></h1>
        <p class="lead"><?php echo $error_message; ?></p>
        <?php if ($error_code == 404 && isset($GLOBALS['router'])) { ?>
            <p class="lead"><a href="<?php echo $GLOBALS['router']->base_url(); ?>">Return to Agave</a></p>
        <?php } ?>
    </div>
</body>
</html>