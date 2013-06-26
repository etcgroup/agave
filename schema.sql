delimiter $$

CREATE TABLE `annotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `user` varchar(150) NOT NULL,
  `label` varchar(150) NOT NULL,
  `time` datetime NOT NULL,
  `public` int(1) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `public_time` (`public`,`time`)
) ENGINE=MyISAM AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `discussions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `public` int(1) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `public` (`public`)
) ENGINE=MyISAM AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `instrumentation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` datetime NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `action` varchar(45) NOT NULL,
  `user` varchar(150) DEFAULT NULL,
  `data` varchar(250) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `public` int(10) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3723 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discussion_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `user` varchar(150) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `view_state` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created` (`created`)
) ENGINE=MyISAM AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `sessions` (
  `id` varchar(32) NOT NULL,
  `access` INT UNSIGNED NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$

delimiter $$

CREATE TABLE `app_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `last_signed_in` datetime DEFAULT NULL,
  `twitter_id` bigint(20) unsigned NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `utc_offset` int(11) DEFAULT NULL,
  `time_zone` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_twitter_id` (`twitter_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4$$

