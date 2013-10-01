<?php
if(basename(__FILE__) == basename($_SERVER['PHP_SELF'])){exit();}

function nav_bar()
{
    ob_start();
    ?>
    <div class="navbar row">
        <div class="navbar-inner">
            <div class="container-fluid">
                <div class="nav-main-info">
                    <a class="brand" href="?">
                    </a>
                    <span class="colon"><i class="icon-chevron-right icon-white"></i></span>
                    <span class="title muted">Super Bowl 47</span>
                </div>
                <ul class="details">
                    <li>2/3/2013 6:30pm - 2/3/2013 10:00pm EST</li>
                    <li class="divider-vertical"></li>
                    <li>7.9 million tweets</li>
                    <li class="divider-vertical"></li>
                    <li>3.8 million authors</li>
                </ul>
                <div class="user-display hide fade">
                    <span class="welcome-message">
                        Welcome, <i class="twitter-icon-light hide" title="Signed in with Twitter"></i> <span class="user-name"></span>!
                    </span>
                    <button type="button" class="btn sign-out-button">Sign out</button>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
