<?php

function nav_bar()
{
    ob_start();
    ?>
    <div class="navbar row">
        <div class="navbar-inner">
            <div class="container-fluid">
                <a class="brand" href="#">TwitterVis</a>
                <ul class="nav">
                    <li>
                        <span class="title navbar-text">Super Bowl 47</span>
                    </li>
                    <li>
                        <span class="navbar-text">2/3/2013 6:30pm - 2/3/2013 10:00pm EST; 7.5 million tweets, 3.9 million authors</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
